package com.example.moneymanager.service;

import com.example.moneymanager.dto.ForecastDTOs.*;
import com.example.moneymanager.entity.ExpenseEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.text.NumberFormat;
import java.util.Locale;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ForecastService {

    private final ExpenseRepository expenseRepository;
    private final ProfileService profileService;
    private final GptOssService gptOssService;

    public MonthlyForecastDTO getMonthlyForecast(int year, int month) {
        ProfileEntity profile = profileService.getCurrentProfile();
        
        LocalDate startDate = LocalDate.now().minusMonths(6).withDayOfMonth(1);
        LocalDate endDate = LocalDate.now();
        
        List<ExpenseEntity> expenses = expenseRepository.findByProfileIdAndDateBetween(
                profile.getId(), startDate, endDate);

        // Group by category and month using Map
        Map<Long, Map<YearMonth, BigDecimal>> categoryMonthTotals = new HashMap<>();
        Map<Long, String> categoryNames = new HashMap<>();
        
        for (ExpenseEntity expense : expenses) {
            Long catId = expense.getCategory().getId();
            YearMonth ym = YearMonth.from(expense.getDate());
            
            categoryNames.putIfAbsent(catId, expense.getCategory().getName());
            categoryMonthTotals.computeIfAbsent(catId, k -> new HashMap<>())
                    .merge(ym, expense.getAmount(), BigDecimal::add);
        }

        List<CategoryForecastItem> forecasts = new ArrayList<>();
        YearMonth targetMonth = YearMonth.of(year, month);
        
        for (Map.Entry<Long, Map<YearMonth, BigDecimal>> entry : categoryMonthTotals.entrySet()) {
            Long catId = entry.getKey();
            Map<YearMonth, BigDecimal> monthTotals = entry.getValue();
            
            // Calculate average and trend
            BigDecimal total = monthTotals.values().stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal avg = total.divide(BigDecimal.valueOf(monthTotals.size()), 2, RoundingMode.HALF_UP);
            
            // Trend: compare last 3 months to previous 3 months
            BigDecimal recentSum = BigDecimal.ZERO;
            BigDecimal olderSum = BigDecimal.ZERO;
            int recentCount = 0, olderCount = 0;
            
            for (Map.Entry<YearMonth, BigDecimal> mt : monthTotals.entrySet()) {
                YearMonth ym = mt.getKey();
                long monthsDiff = java.time.temporal.ChronoUnit.MONTHS.between(ym, LocalDate.now());
                if (monthsDiff <= 3) {
                    recentSum = recentSum.add(mt.getValue());
                    recentCount++;
                } else if (monthsDiff <= 6) {
                    olderSum = olderSum.add(mt.getValue());
                    olderCount++;
                }
            }
            
            BigDecimal recentAvg = recentCount > 0 ? recentSum.divide(BigDecimal.valueOf(recentCount), 2, RoundingMode.HALF_UP) : avg;
            BigDecimal olderAvg = olderCount > 0 ? olderSum.divide(BigDecimal.valueOf(olderCount), 2, RoundingMode.HALF_UP) : avg;
            
            String trend = recentAvg.compareTo(olderAvg.multiply(new BigDecimal("1.1"))) > 0 ? "UP" :
                          recentAvg.compareTo(olderAvg.multiply(new BigDecimal("0.9"))) < 0 ? "DOWN" : "STABLE";
            
            // Forecast: use recent average * trend factor
            BigDecimal predicted = trend.equals("UP") ? recentAvg.multiply(new BigDecimal("1.05")) :
                                   trend.equals("DOWN") ? recentAvg.multiply(new BigDecimal("0.95")) : recentAvg;
            
            CategoryForecastItem item = CategoryForecastItem.builder()
                    .categoryId(catId)
                    .categoryName(categoryNames.get(catId))
                    .predictedAmount(predicted)
                    .historicalAverage(avg)
                    .trend(trend)
                    .build();
            
            forecasts.add(item);
        }

        return MonthlyForecastDTO.builder()
                .year(year)
                .month(month)
                .categories(forecasts)
                .build();
    }

    public List<AnomalyDTO> detectAnomalies() {
        return detectAnomalies(null, null);
    }

    public List<AnomalyDTO> detectAnomalies(Integer year, Integer month) {
        if (year != null && month != null) {
            LocalDate startDate = LocalDate.of(year, month, 1).minusMonths(3);
            LocalDate endDate = LocalDate.of(year, month, 1).plusMonths(1).minusDays(1);
            return detectAnomaliesInRange(startDate, endDate);
        }
        return detectAnomaliesInRange(
                LocalDate.now().minusMonths(3).withDayOfMonth(1),
                LocalDate.now()
        );
    }

    private List<AnomalyDTO> detectAnomaliesInRange(LocalDate startDate, LocalDate endDate) {
        ProfileEntity profile = profileService.getCurrentProfile();
        
        List<ExpenseEntity> expenses = expenseRepository.findByProfileIdAndDateBetween(
                profile.getId(), startDate, endDate);

        // Group by category and month using Map
        Map<Long, Map<YearMonth, List<BigDecimal>>> categoryMonthAmounts = new HashMap<>();
        Map<Long, String> categoryNames = new HashMap<>();
        
        for (ExpenseEntity expense : expenses) {
            if (expense.getCategory() == null) continue;
            
            Long catId = expense.getCategory().getId();
            YearMonth ym = YearMonth.from(expense.getDate());
            
            categoryNames.putIfAbsent(catId, expense.getCategory().getName());
            categoryMonthAmounts.computeIfAbsent(catId, k -> new HashMap<>())
                    .computeIfAbsent(ym, k -> new ArrayList<>())
                    .add(expense.getAmount());
        }

        List<AnomalyDTO> anomalies = new ArrayList<>();
        
        for (Map.Entry<Long, Map<YearMonth, List<BigDecimal>>> catEntry : categoryMonthAmounts.entrySet()) {
            Long catId = catEntry.getKey();
            Map<YearMonth, List<BigDecimal>> monthAmounts = catEntry.getValue();
            
            // Calculate global stats for this category (avoid O(n²) leave-one-out)
            List<BigDecimal> allAmounts = monthAmounts.values().stream()
                    .flatMap(Collection::stream)
                    .collect(Collectors.toList());
            
            if (allAmounts.size() < 3) continue;
            
            BigDecimal sum = allAmounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal mean = sum.divide(BigDecimal.valueOf(allAmounts.size()), 2, RoundingMode.HALF_UP);
            
            BigDecimal varianceSum = allAmounts.stream()
                    .map(amount -> {
                        BigDecimal diff = amount.subtract(mean);
                        return diff.multiply(diff);
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal stdDev = new BigDecimal(Math.sqrt(varianceSum.divide(BigDecimal.valueOf(allAmounts.size()), 4, RoundingMode.HALF_UP).doubleValue()));
            
            // Detect anomalies: amount > mean + 2*stdDev
            BigDecimal threshold = mean.add(stdDev.multiply(new BigDecimal("2")));
            
            for (ExpenseEntity expense : expenses) {
                if (expense.getCategory() == null || !expense.getCategory().getId().equals(catId)) continue;
                if (expense.getAmount().compareTo(threshold) > 0 && expense.getAmount().compareTo(new BigDecimal("50000")) > 0) {
                    anomalies.add(AnomalyDTO.builder()
                            .transactionId(expense.getId())
                            .type("EXPENSE")
                            .amount(expense.getAmount())
                            .categoryName(expense.getCategory().getName())
                            .date(expense.getDate().toString())
                            .meanAmount(mean)
                            .stdDev(stdDev)
                            .build());
                }
            }
        }
        
        return anomalies.stream()
                .sorted(Comparator.comparing(AnomalyDTO::getDate).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }

    public CategoryTrendDTO getCategoryTrend(Long categoryId, int months) {
        ProfileEntity profile = profileService.getCurrentProfile();
        
        LocalDate startDate = LocalDate.now().minusMonths(months).withDayOfMonth(1);
        LocalDate endDate = LocalDate.now();
        
        List<ExpenseEntity> expenses = expenseRepository.findByProfileIdAndDateBetween(
                profile.getId(), startDate, endDate)
                .stream()
                .filter(e -> e.getCategory() != null && e.getCategory().getId().equals(categoryId))
                .toList();
        
        String categoryName = expenses.isEmpty() ? "Unknown" : expenses.get(0).getCategory().getName();
        
        // Group by month using Map
        Map<YearMonth, BigDecimal> monthlyTotals = new HashMap<>();
        for (ExpenseEntity expense : expenses) {
            YearMonth ym = YearMonth.from(expense.getDate());
            monthlyTotals.merge(ym, expense.getAmount(), BigDecimal::add);
        }
        
        List<MonthlyDataPoint> dataPoints = new ArrayList<>();
        YearMonth current = YearMonth.from(startDate);
        YearMonth end = YearMonth.from(endDate);
        
        while (!current.isAfter(end)) {
            dataPoints.add(MonthlyDataPoint.builder()
                    .yearMonth(current.toString())
                    .actual(monthlyTotals.getOrDefault(current, BigDecimal.ZERO))
                    .predicted(BigDecimal.ZERO)
                    .build());
            current = current.plusMonths(1);
        }
        
        return CategoryTrendDTO.builder()
                .categoryName(categoryName)
                .dataPoints(dataPoints)
                .build();
    }

    public ForecastInsightDTO analyzeForecastWithAi(MonthlyForecastDTO forecast) {
        try {
            if (forecast == null || forecast.getCategories() == null || forecast.getCategories().isEmpty()) {
                return ForecastInsightDTO.builder()
                        .narrative("Chưa có đủ dữ liệu lịch sử để tạo phân tích. Hãy thêm nhiều giao dịch hơn!")
                        .generatedAt(LocalDateTime.now())
                        .build();
            }

            NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
            StringBuilder sb = new StringBuilder();
            sb.append("Dữ liệu dự báo chi tiêu tháng ").append(forecast.getMonth()).append("/").append(forecast.getYear()).append(":\n");
            forecast.getCategories().forEach(c -> {
                sb.append("- Danh mục ").append(c.getCategoryName())
                  .append(": dự báo ").append(nf.format(c.getPredictedAmount())).append("đ")
                  .append(" (trung bình ").append(nf.format(c.getHistoricalAverage())).append("đ")
                  .append(", xu hướng: ").append(c.getTrend()).append(")\n");
            });

            String systemPrompt = "Bạn là chuyên gia tài chính cá nhân của ứng dụng Money Manager. "
                    + "Phân tích dữ liệu dự báo chi tiêu sau và đưa ra nhận xét ngắn gọn, thực tế bằng tiếng Việt. "
                    + "Tập trung vào: 1) Danh mục nào đang có xu hướng tăng đáng lo ngại? 2) Lời khuyên cụ thể để kiểm soát chi tiêu tháng tới. "
                    + "Trả lời tối đa 120 từ. Không dùng markdown. Viết thân thiện, súc tích.";

            String narrative = gptOssService.callWithPrompt(systemPrompt, sb.toString(), 512);
            if (narrative == null || narrative.isBlank()) {
                narrative = "Chưa thể tạo phân tích AI lúc này. Vui lòng thử lại sau.";
            }

            return ForecastInsightDTO.builder()
                    .narrative(narrative)
                    .generatedAt(LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.error("Error generating GPT-OSS forecast insight: {}", e.getMessage(), e);
            return ForecastInsightDTO.builder()
                    .narrative("AI đang bảo trì, vui lòng thử lại sau.")
                    .generatedAt(LocalDateTime.now())
                    .build();
        }
    }
}
