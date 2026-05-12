package com.example.moneymanager.service;

import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.dto.ForecastDTOs.*;
import com.example.moneymanager.entity.ExpenseEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForecastService {

    private final ExpenseRepository expenseRepository;
    private final GeminiService geminiService;
    private final SubscriptionService subscriptionService;
    private final ProfileService profileService;

    public MonthlyForecastDTO getMonthlyForecast(int year, int month) {
        ProfileEntity profile = profileService.getCurrentProfile();
        subscriptionService.ensureCanUseForecast(profile);

        YearMonth targetMonth = YearMonth.of(year, month);
        LocalDate startDate = targetMonth.minusMonths(6).atDay(1);
        LocalDate endDate = targetMonth.minusMonths(1).atEndOfMonth();

        List<ExpenseEntity> historicalExpenses = expenseRepository.findByProfileIdAndDateBetween(
                profile.getId(), startDate, endDate);

        Map<Long, String> categoryNames = new HashMap<>();
        Map<Long, List<MonthlyTotal>> categoryHistory = new HashMap<>();

        for (ExpenseEntity e : historicalExpenses) {
            if (e.getCategory() == null) continue;
            Long catId = e.getCategory().getId();
            categoryNames.putIfAbsent(catId, e.getCategory().getName());

            YearMonth ym = YearMonth.from(e.getDate());
            categoryHistory.putIfAbsent(catId, new ArrayList<>());
            
            MonthlyTotal mt = categoryHistory.get(catId).stream()
                    .filter(m -> m.yearMonth.equals(ym))
                    .findFirst()
                    .orElseGet(() -> {
                        MonthlyTotal newMt = new MonthlyTotal(ym, BigDecimal.ZERO);
                        categoryHistory.get(catId).add(newMt);
                        return newMt;
                    });
            mt.total = mt.total.add(e.getAmount());
        }

        List<CategoryForecastItem> categories = new ArrayList<>();
        for (Map.Entry<Long, List<MonthlyTotal>> entry : categoryHistory.entrySet()) {
            Long catId = entry.getKey();
            List<MonthlyTotal> history = entry.getValue();
            
            if (history.isEmpty()) continue;

            BigDecimal sum = history.stream().map(h -> h.total).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal avg = sum.divide(BigDecimal.valueOf(history.size()), 2, RoundingMode.HALF_UP);

            // Simple trend: comparing last month to average
            MonthlyTotal lastMonthTotal = history.stream()
                    .filter(h -> h.yearMonth.equals(targetMonth.minusMonths(1)))
                    .findFirst()
                    .orElse(new MonthlyTotal(targetMonth.minusMonths(1), BigDecimal.ZERO));

            String trend = "STABLE";
            if (lastMonthTotal.total.compareTo(avg.multiply(BigDecimal.valueOf(1.1))) > 0) trend = "UP";
            else if (lastMonthTotal.total.compareTo(avg.multiply(BigDecimal.valueOf(0.9))) < 0) trend = "DOWN";

            // Prediction: simple moving average + trend adjustment
            BigDecimal predicted = avg;
            if (trend.equals("UP")) predicted = avg.multiply(BigDecimal.valueOf(1.05));
            else if (trend.equals("DOWN")) predicted = avg.multiply(BigDecimal.valueOf(0.95));

            categories.add(CategoryForecastItem.builder()
                    .categoryId(catId)
                    .categoryName(categoryNames.get(catId))
                    .predictedAmount(predicted)
                    .historicalAverage(avg)
                    .trend(trend)
                    .build());
        }

        return MonthlyForecastDTO.builder()
                .year(year)
                .month(month)
                .categories(categories)
                .build();
    }

    public List<AnomalyDTO> detectAnomalies() {
        ProfileEntity profile = profileService.getCurrentProfile();
        subscriptionService.ensureCanUseForecast(profile);

        LocalDate startDate = LocalDate.now().minusMonths(3).withDayOfMonth(1);
        LocalDate endDate = LocalDate.now();

        List<ExpenseEntity> expenses = expenseRepository.findByProfileIdAndDateBetween(
                profile.getId(), startDate, endDate);

        Map<Long, List<BigDecimal>> categoryAmounts = new HashMap<>();
        Map<Long, String> categoryNames = new HashMap<>();

        for (ExpenseEntity e : expenses) {
            if (e.getCategory() == null) continue;
            categoryAmounts.computeIfAbsent(e.getCategory().getId(), k -> new ArrayList<>()).add(e.getAmount());
            categoryNames.putIfAbsent(e.getCategory().getId(), e.getCategory().getName());
        }

        List<AnomalyDTO> anomalies = new ArrayList<>();

        for (ExpenseEntity e : expenses) {
            if (e.getCategory() == null) continue;
            Long catId = e.getCategory().getId();
            List<BigDecimal> amounts = categoryAmounts.get(catId);

            if (amounts.size() < 3) continue; // Need enough data points

            // Leave-one-out: compute mean/stdDev excluding the current expense
            List<BigDecimal> others = amounts.stream()
                    .filter(a -> a != e.getAmount()) // identity comparison (same reference from list)
                    .collect(Collectors.toList());
            // Fallback: if all amounts are identical objects, remove one by index
            if (others.size() == amounts.size()) {
                others = new ArrayList<>(amounts);
                others.remove(amounts.indexOf(e.getAmount()));
            }
            if (others.isEmpty()) continue;

            double otherSum = others.stream().mapToDouble(BigDecimal::doubleValue).sum();
            double otherMean = otherSum / others.size();

            double otherVariance = others.stream()
                    .mapToDouble(a -> Math.pow(a.doubleValue() - otherMean, 2))
                    .sum() / others.size();
            double otherStdDev = Math.sqrt(otherVariance);

            if (e.getAmount().doubleValue() > otherMean + 2 * otherStdDev && e.getAmount().doubleValue() > 50000) {
                anomalies.add(AnomalyDTO.builder()
                        .transactionId(e.getId())
                        .type("EXPENSE")
                        .amount(e.getAmount())
                        .categoryName(e.getCategory().getName())
                        .date(e.getDate().toString())
                        .meanAmount(BigDecimal.valueOf(otherMean))
                        .stdDev(BigDecimal.valueOf(otherStdDev))
                        .build());
            }
        }

        // Return top 5 most recent
        return anomalies.stream()
                .sorted(Comparator.comparing(AnomalyDTO::getDate).reversed())
                .limit(5)
                .toList();
    }

    public CategoryTrendDTO getCategoryTrend(Long categoryId, int months) {
        ProfileEntity profile = profileService.getCurrentProfile();
        subscriptionService.ensureCanUseForecast(profile);

        LocalDate startDate = LocalDate.now().minusMonths(months).withDayOfMonth(1);
        LocalDate endDate = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        List<ExpenseEntity> expenses = expenseRepository.findByProfileIdAndDateBetween(
                profile.getId(), startDate, endDate);
        
        expenses = expenses.stream()
                .filter(e -> e.getCategory() != null && e.getCategory().getId().equals(categoryId))
                .toList();

        String categoryName = expenses.isEmpty() ? "Unknown" : expenses.get(0).getCategory().getName();
        
        Map<YearMonth, BigDecimal> monthlyTotals = new TreeMap<>();
        for (ExpenseEntity e : expenses) {
            YearMonth ym = YearMonth.from(e.getDate());
            monthlyTotals.merge(ym, e.getAmount(), BigDecimal::add);
        }

        List<MonthlyDataPoint> dataPoints = new ArrayList<>();
        YearMonth current = YearMonth.from(startDate);
        YearMonth end = YearMonth.from(endDate);
        
        while (!current.isAfter(end)) {
            dataPoints.add(MonthlyDataPoint.builder()
                    .yearMonth(current.toString())
                    .actual(monthlyTotals.getOrDefault(current, BigDecimal.ZERO))
                    .predicted(BigDecimal.ZERO) // Simplified for trend
                    .build());
            current = current.plusMonths(1);
        }

        return CategoryTrendDTO.builder()
                .categoryName(categoryName)
                .dataPoints(dataPoints)
                .build();
    }

    public ForecastInsightDTO getGeminiInsights(MonthlyForecastDTO forecast) {
        ProfileEntity profile = profileService.getCurrentProfile();
        subscriptionService.ensureCanUseForecast(profile);

        StringBuilder prompt = new StringBuilder();
        prompt.append("Tôi có số liệu dự báo chi tiêu tháng ").append(forecast.getMonth()).append("/").append(forecast.getYear()).append(":\n");
        
        for (CategoryForecastItem item : forecast.getCategories()) {
            prompt.append("- ").append(item.getCategoryName()).append(": dự báo ")
                  .append(item.getPredictedAmount()).append("đ (Trung bình lịch sử: ")
                  .append(item.getHistoricalAverage()).append("đ, Xu hướng: ").append(item.getTrend()).append(")\n");
        }
        
        prompt.append("Dựa vào thông tin trên, hãy viết một đoạn phân tích ngắn gọn, bằng tiếng Việt, thân thiện và đưa ra lời khuyên thực tế để tiết kiệm chi phí trong tháng này. Trả lời tối đa 100 chữ.");

        String insight = geminiService.chat(prompt.toString()).getReply();

        return ForecastInsightDTO.builder()
                .narrative(insight)
                .generatedAt(java.time.LocalDateTime.now())
                .build();
    }

    private static class MonthlyTotal {
        YearMonth yearMonth;
        BigDecimal total;
        MonthlyTotal(YearMonth ym, BigDecimal t) { this.yearMonth = ym; this.total = t; }
    }
}
