package com.example.moneymanager.service;

import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.dto.SpendingTipsResponseDTO;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.entity.SpendingTipEntity;
import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.repository.SpendingTipsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpendingTipsService {

    private static final String DISCLAIMER = "⚠️ Trợ lý AI có thể mắc sai sót, hãy kiểm tra lại câu trả lời trước khi quyết định.";

    private final ProfileService profileService;
    private final ExpenseService expenseService;
    private final GeminiService geminiService;
    private final SpendingTipsRepository repository;

    public SpendingTipsResponseDTO generateSmartTips() {
        ProfileEntity profile = profileService.getCurrentProfile();

        Optional<SpendingTipEntity> cached = repository.findTopByProfileIdOrderByGeneratedAtDesc(profile.getId());
        if (cached.isPresent() && isCacheValid(cached.get(), profile.getSubscriptionPlan())) {
            return parseToResponseDTO(cached.get().getTipsContent(), cached.get().getGeneratedAt());
        }

        String expenseData = parseExpenseData();

        if (expenseData == null) {
            return SpendingTipsResponseDTO.builder()
                    .tips(List.of("Bạn chưa có dữ liệu chi tiêu. Hãy thêm transaction để tôi có thể phân tích và gợi ý tiết kiệm!"))
                    .timestamp(LocalDateTime.now())
                    .disclaimer(DISCLAIMER)
                    .build();
        }

        String prompt = buildGeminiPrompt(profile, expenseData);
        String tipsContent = geminiService.callGeminiWithPrompt(
                prompt,
                "Phân tích chi tiêu và đưa ra gợi ý tiết kiệm cụ thể cho tôi.",
                1024
        );

        if (tipsContent == null || tipsContent.isBlank()) {
            throw new RuntimeException("Trợ lý đang bận, thử lại sau.");
        }

        SpendingTipEntity entity = SpendingTipEntity.builder()
                .profile(profile)
                .tipsContent(tipsContent)
                .build();
        repository.save(entity);

        return parseToResponseDTO(tipsContent, LocalDateTime.now());
    }

    private boolean isCacheValid(SpendingTipEntity cached, SubscriptionPlan plan) {
        if (plan == SubscriptionPlan.PREMIUM) {
            return false;
        }
        LocalDateTime generatedAt = cached.getGeneratedAt();
        LocalDateTime now = LocalDateTime.now();
        return switch (plan) {
            case FREE -> generatedAt.isAfter(now.minusHours(24));
            case BASIC -> generatedAt.isAfter(now.minusHours(6));
            default -> false;
        };
    }

    private String parseExpenseData() {
        LocalDate now = LocalDate.now();
        List<List<ExpenseDTO>> monthlyExpenses = new ArrayList<>();
        List<String> monthNames = new ArrayList<>();

        for (int i = 2; i >= 0; i--) {
            LocalDate targetDate = now.minusMonths(i);
            YearMonth ym = YearMonth.from(targetDate);
            List<ExpenseDTO> expenses = expenseService.getExpensesByMonthForCurrentUser(ym.getYear(), ym.getMonthValue());
            monthlyExpenses.add(expenses);
            monthNames.add(String.format("Tháng %d/%d", ym.getMonthValue(), ym.getYear()));
        }

        boolean hasData = monthlyExpenses.stream().anyMatch(list -> !list.isEmpty());
        if (!hasData) {
            return null;
        }

        Set<String> allCategories = new LinkedHashSet<>();
        List<Map<String, BigDecimal>> monthlyCategoryMaps = new ArrayList<>();

        for (List<ExpenseDTO> expenses : monthlyExpenses) {
            Map<String, BigDecimal> categoryMap = expenses.stream()
                    .filter(e -> e.getCategoryName() != null && e.getAmount() != null)
                    .collect(Collectors.groupingBy(
                            ExpenseDTO::getCategoryName,
                            Collectors.reducing(BigDecimal.ZERO, ExpenseDTO::getAmount, BigDecimal::add)
                    ));
            monthlyCategoryMaps.add(categoryMap);
            allCategories.addAll(categoryMap.keySet());
        }

        BigDecimal[] monthlyTotals = new BigDecimal[3];
        for (int i = 0; i < 3; i++) {
            monthlyTotals[i] = monthlyCategoryMaps.get(i).values().stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Tổng chi tiêu:\n");
        for (int i = 0; i < 3; i++) {
            sb.append(String.format("- %s: %s VND\n", monthNames.get(i), formatCurrency(monthlyTotals[i])));
        }

        BigDecimal prevSum = BigDecimal.ZERO;
        int prevCount = 0;
        for (int i = 0; i < 2; i++) {
            if (monthlyTotals[i].compareTo(BigDecimal.ZERO) > 0) {
                prevSum = prevSum.add(monthlyTotals[i]);
                prevCount++;
            }
        }
        if (prevCount > 0 && monthlyTotals[2].compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal prevAvg = prevSum.divide(BigDecimal.valueOf(prevCount), 0, RoundingMode.HALF_UP);
            BigDecimal changePercent = monthlyTotals[2].subtract(prevAvg)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(prevAvg, 1, RoundingMode.HALF_UP);
            sb.append(String.format("So với trung bình 2 tháng trước: %s%.1f%%\n",
                    changePercent.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "", changePercent));
        }

        sb.append("\nChi tiêu theo danh mục (tháng hiện tại / trung bình 2 tháng trước):\n");
        for (String category : allCategories) {
            BigDecimal currentAmt = monthlyCategoryMaps.get(2).getOrDefault(category, BigDecimal.ZERO);

            BigDecimal catPrevSum = BigDecimal.ZERO;
            int catPrevCount = 0;
            for (int i = 0; i < 2; i++) {
                BigDecimal amt = monthlyCategoryMaps.get(i).getOrDefault(category, BigDecimal.ZERO);
                if (amt.compareTo(BigDecimal.ZERO) > 0) {
                    catPrevSum = catPrevSum.add(amt);
                    catPrevCount++;
                }
            }

            String prevAvgStr = catPrevCount > 0
                    ? formatCurrency(catPrevSum.divide(BigDecimal.valueOf(catPrevCount), 0, RoundingMode.HALF_UP)) + " VND"
                    : "chưa có";

            String trend = "";
            if (catPrevCount > 0 && currentAmt.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal catPrevAvg = catPrevSum.divide(BigDecimal.valueOf(catPrevCount), 0, RoundingMode.HALF_UP);
                BigDecimal changePercent = currentAmt.subtract(catPrevAvg)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(catPrevAvg, 1, RoundingMode.HALF_UP);
                if (changePercent.abs().compareTo(BigDecimal.valueOf(5)) > 0) {
                    trend = String.format(" (%s%.0f%%)", changePercent.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "", changePercent);
                }
            }

            sb.append(String.format("- %s: %s VND / TB: %s%s\n",
                    category, formatCurrency(currentAmt), prevAvgStr, trend));
        }

        return sb.toString();
    }

    private String buildGeminiPrompt(ProfileEntity profile, String expenseData) {
        return "Bạn là AI Coach tài chính của Money Manager.\n" +
                "Phân tích chi tiêu của người dùng (" + safeValue(profile.getFullName()) + ") và đưa ra 3-5 gợi ý tiết kiệm CỤ THỂ, THIẾT THỰC và KHẢ THI.\n\n" +
                "=== CHI TIÊU HIỆN TẠI ===\n" +
                expenseData + "\n" +
                "=== TIÊU CHÍ PHÂN TÍCH ===\n" +
                "1. So sánh tháng này với trung bình 2 tháng trước\n" +
                "2. Xác định category tăng 20%+ → ưu tiên gợi ý\n" +
                "3. Nếu tiết kiệm tốt → khen ngợi và khuyến khích\n" +
                "4. Nếu tổng chi tiêu giảm → ghi nhận điểm sáng này\n\n" +
                "=== QUY TẮC TRÌNH BÀY ===\n" +
                "Mỗi gợi ý trên một dòng riêng biệt, tối đa 2 câu mỗi gợi ý.\n" +
                "Không dùng markdown (*, #, **, __), không đánh số thứ tự.\n" +
                "Không dùng ký tự đặc biệt ngoài → và ký hiệu tiền tệ.\n\n" +
                "=== KẾT THÚC ===\n" +
                "Bắt buộc kết thúc bằng dòng trống rồi: ⚠️ Trợ lý AI có thể mắc sai sót, hãy kiểm tra lại câu trả lời.";
    }

    private SpendingTipsResponseDTO parseToResponseDTO(String tipsContent, LocalDateTime timestamp) {
        List<String> tips = Arrays.stream(tipsContent.split("\n"))
                .map(String::trim)
                .filter(line -> !line.isEmpty() && !line.equals(DISCLAIMER))
                .collect(Collectors.toList());

        return SpendingTipsResponseDTO.builder()
                .tips(tips)
                .timestamp(timestamp)
                .disclaimer(DISCLAIMER)
                .build();
    }

    private String formatCurrency(BigDecimal amount) {
        BigDecimal safeAmount = amount != null ? amount : BigDecimal.ZERO;
        NumberFormat formatter = NumberFormat.getNumberInstance(new Locale("vi", "VN"));
        return formatter.format(safeAmount);
    }

    private String safeValue(String value) {
        return value == null || value.isBlank() ? "bạn" : value;
    }
}
