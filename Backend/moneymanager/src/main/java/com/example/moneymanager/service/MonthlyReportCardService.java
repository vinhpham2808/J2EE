package com.example.moneymanager.service;

import com.example.moneymanager.dto.MonthlyReportCardDTO;
import com.example.moneymanager.dto.MonthlyReportAiAnalysisRequestDTO;
import com.example.moneymanager.dto.MonthlyReportCardDTO.CategoryBreakdownItem;
import com.example.moneymanager.entity.*;
import com.example.moneymanager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MonthlyReportCardService {

    private final ProfileService profileService;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final BudgetRepository budgetRepository;
    private final SavingGoalRepository savingGoalRepository;
    private final SavingGoalContributionRepository savingGoalContributionRepository;
    private final SubscriptionService subscriptionService;
    private final GptOssService gptOssService;

    /**
     * Get report card for the current month.
     */
    @Transactional(readOnly = true)
    public MonthlyReportCardDTO getReportCard() {
        LocalDate now = LocalDate.now();
        return getReportCard(now.getYear(), now.getMonthValue());
    }

    /**
     * Get report card for a specific month/year.
     */
    @Transactional(readOnly = true)
    public MonthlyReportCardDTO getReportCard(int year, int month) {
        ProfileEntity profile = profileService.getCurrentProfile();

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startOfMonth = yearMonth.atDay(1);
        LocalDate endOfMonth = yearMonth.atEndOfMonth();

        // --- Current month data ---
        BigDecimal totalIncome = getTotalIncome(profile.getId(), startOfMonth, endOfMonth);
        BigDecimal totalExpense = getTotalExpense(profile.getId(), startOfMonth, endOfMonth);
        BigDecimal savings = totalIncome.subtract(totalExpense);
        double savingsRate = calculateSavingsRate(savings, totalIncome);

        // --- Previous month data ---
        YearMonth prevYearMonth = yearMonth.minusMonths(1);
        LocalDate prevStart = prevYearMonth.atDay(1);
        LocalDate prevEnd = prevYearMonth.atEndOfMonth();

        BigDecimal prevIncome = getTotalIncome(profile.getId(), prevStart, prevEnd);
        BigDecimal prevExpense = getTotalExpense(profile.getId(), prevStart, prevEnd);
        BigDecimal prevSavings = prevIncome.subtract(prevExpense);

        double spendingChangePercent = 0.0;
        if (prevExpense.compareTo(BigDecimal.ZERO) > 0) {
            spendingChangePercent = totalExpense.subtract(prevExpense)
                    .divide(prevExpense, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        // --- Category breakdown ---
        List<CategoryBreakdownItem> categoryBreakdown = getCategoryBreakdown(profile.getId(), startOfMonth, endOfMonth, totalExpense);

        // --- Budget tracking (batch query instead of N+1) ---
        List<BudgetEntity> budgets = budgetRepository.findByProfileIdAndMonthAndYear(profile.getId(), month, year);
        int totalBudgets = budgets.size();
        int budgetsOnTrack = 0;
        
        List<Object[]> spentByCategory = budgetRepository.getTotalSpentByCategoryForProfileAndMonth(
                profile.getId(), month, year);
        Map<Long, BigDecimal> spentMap = new java.util.HashMap<>();
        for (Object[] row : spentByCategory) {
            if (row[0] == null) continue;
            Long categoryId = ((Number) row[0]).longValue();
            Object val = row[1];
            BigDecimal amount;
            if (val instanceof BigDecimal) {
                amount = (BigDecimal) val;
            } else if (val instanceof Number) {
                amount = new BigDecimal(val.toString());
            } else {
                amount = BigDecimal.ZERO;
            }
            spentMap.put(categoryId, amount);
        }
        
        for (BudgetEntity budget : budgets) {
            BigDecimal spent = spentMap.getOrDefault(budget.getCategory().getId(), BigDecimal.ZERO);
            if (budget.getAmountLimit().compareTo(BigDecimal.ZERO) > 0) {
                double ratio = spent.divide(budget.getAmountLimit(), 4, RoundingMode.HALF_UP).doubleValue();
                if (ratio < 1.0) {
                    budgetsOnTrack++;
                }
            }
        }

        // --- Saving goals ---
        List<SavingGoalEntity> activeGoals = savingGoalRepository.findByProfileIdAndStatus(profile.getId(), GoalStatus.ACTIVE);
        int totalActiveGoals = activeGoals.size();
        int completedGoalsThisMonth = countCompletedGoalsThisMonth(profile.getId(), startOfMonth, endOfMonth);

        // --- Grade & Labels ---
        String grade = calculateGrade(savingsRate);
        String gradeLabel = getGradeLabel(grade);

        // --- Badges, Strengths, Improvements ---
        List<String> badges = generateBadges(savingsRate, budgetsOnTrack, totalBudgets, completedGoalsThisMonth, spendingChangePercent, totalIncome, savings);
        List<String> strengths = generateStrengths(savingsRate, budgetsOnTrack, totalBudgets, completedGoalsThisMonth, spendingChangePercent);
        List<String> improvements = generateImprovements(savingsRate, budgetsOnTrack, totalBudgets, completedGoalsThisMonth);

        // --- Build DTO ---
        String monthName = yearMonth.format(DateTimeFormatter.ofPattern("MMMM", new Locale("vi", "VN")));

        return MonthlyReportCardDTO.builder()
                .month(month)
                .year(year)
                .monthName(monthName + " " + year)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .savings(savings)
                .savingsRate(savingsRate)
                .grade(grade)
                .gradeLabel(gradeLabel)
                .prevMonthIncome(prevIncome)
                .prevMonthExpense(prevExpense)
                .prevMonthSavings(prevSavings)
                .spendingChangePercent(spendingChangePercent)
                .categoryBreakdown(categoryBreakdown)
                .completedGoalsThisMonth(completedGoalsThisMonth)
                .totalActiveGoals(totalActiveGoals)
                .budgetsOnTrack(budgetsOnTrack)
                .totalBudgets(totalBudgets)
                .badges(badges)
                .strengths(strengths)
                .improvements(improvements)
                .build();
    }

    @Transactional(readOnly = true)
    public String analyzeReportWithAi(MonthlyReportAiAnalysisRequestDTO request) {
        ProfileEntity profile = profileService.getCurrentProfile();
        subscriptionService.ensureCanUseDetailedAi(profile);

        String prompt = request != null ? request.getPrompt() : null;
        if (prompt == null || prompt.isBlank()) {
            throw new RuntimeException("Nội dung phân tích AI không được để trống.");
        }

        String systemPrompt = "Bạn là chuyên gia phân tích hành vi tài chính cá nhân cho Money Manager. " +
                "Luôn trả lời bằng tiếng Việt, chỉ dựa trên dữ liệu người dùng cung cấp, không bịa số liệu. " +
                "Trả lời ngắn gọn kiểu executive summary, tối đa 3 bullet hoặc 3 đoạn ngắn. " +
                "Bắt buộc chỉ gồm: 1) Nhận xét chính về mẫu chi tiêu, 2) Một điểm tốt hoặc rủi ro đáng chú ý nhất, 3) 1-2 khuyến nghị cụ thể cho tháng tới. " +
                "Giọng điệu chuyên nghiệp, thẳng thắn, dễ đọc. Độ dài mục tiêu khoảng 90-140 từ, không viết lan man.";

        return gptOssService.callWithPrompt(systemPrompt, prompt.trim(), 450);
    }

    // ─── Private helpers ────────────────────────────────────────

    private BigDecimal getTotalIncome(Long profileId, LocalDate start, LocalDate end) {
        BigDecimal total = incomeRepository.findTotalIncomeByProfileIdAndDateBetween(profileId, start, end);
        return total != null ? total : BigDecimal.ZERO;
    }

    private BigDecimal getTotalExpense(Long profileId, LocalDate start, LocalDate end) {
        BigDecimal total = expenseRepository.findTotalExpenseByProfileIdAndDateBetween(profileId, start, end);
        return total != null ? total : BigDecimal.ZERO;
    }

    private double calculateSavingsRate(BigDecimal savings, BigDecimal totalIncome) {
        if (totalIncome.compareTo(BigDecimal.ZERO) <= 0) {
            return savings.compareTo(BigDecimal.ZERO) < 0 ? -100.0 : 0.0;
        }
        return savings.multiply(BigDecimal.valueOf(100))
                .divide(totalIncome, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private String calculateGrade(double savingsRate) {
        if (savingsRate > 30) return MonthlyReportCardDTO.GRADE_A;
        if (savingsRate > 20) return MonthlyReportCardDTO.GRADE_B;
        if (savingsRate > 10) return MonthlyReportCardDTO.GRADE_C;
        if (savingsRate >= 0) return MonthlyReportCardDTO.GRADE_D;
        return MonthlyReportCardDTO.GRADE_F;
    }

    private String getGradeLabel(String grade) {
        return switch (grade) {
            case "A" -> "Xuất sắc";
            case "B" -> "Tốt";
            case "C" -> "Khá";
            case "D" -> "Trung bình";
            case "F" -> "Cần cải thiện";
            default -> "Không xác định";
        };
    }

    private List<CategoryBreakdownItem> getCategoryBreakdown(Long profileId, LocalDate start, LocalDate end, BigDecimal totalExpense) {
        // Aggregate query: tránh load toàn bộ entity, nhóm trực tiếp trong DB
        List<Object[]> rows = expenseRepository.findCategoryTotalsByProfileIdAndDateBetween(profileId, start, end);

        List<CategoryBreakdownItem> items = new ArrayList<>();
        for (Object[] row : rows) {
            String categoryName = (String) row[0];
            String categoryIcon = (String) row[1];
            Object val = row[2];
            BigDecimal amount;
            if (val instanceof BigDecimal) {
                amount = (BigDecimal) val;
            } else if (val instanceof Number) {
                amount = new BigDecimal(val.toString());
            } else {
                amount = BigDecimal.ZERO;
            }
            double percent = 0.0;
            if (totalExpense.compareTo(BigDecimal.ZERO) > 0) {
                percent = amount.multiply(BigDecimal.valueOf(100))
                        .divide(totalExpense, 2, RoundingMode.HALF_UP)
                        .doubleValue();
            }
            items.add(CategoryBreakdownItem.builder()
                    .name(categoryName)
                    .amount(amount)
                    .percent(percent)
                    .icon(categoryIcon)
                    .color("#94A3B8")
                    .build());
        }

        // Sort by amount descending
        items.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));
        return items;
    }

    private int countCompletedGoalsThisMonth(Long profileId, LocalDate start, LocalDate end) {
        // Batch query: lấy danh sách goal COMPLETED, rồi dùng 1 query để tìm những goal có contribution trong tháng
        List<SavingGoalEntity> completedGoals = savingGoalRepository.findByProfileIdAndStatus(profileId, GoalStatus.COMPLETED);
        if (completedGoals.isEmpty()) return 0;

        List<Long> completedGoalIds = completedGoals.stream()
                .map(SavingGoalEntity::getId)
                .toList();

        java.util.Set<Long> goalIdsWithContributions = savingGoalContributionRepository
                .findGoalIdsWithContributionsBetween(completedGoalIds, start, end);
        return goalIdsWithContributions.size();
    }

    private List<String> generateBadges(double savingsRate, int budgetsOnTrack, int totalBudgets,
                                         int completedGoals, double spendingChangePercent,
                                         BigDecimal totalIncome, BigDecimal savings) {
        List<String> badges = new ArrayList<>();
        if (savingsRate > 30) badges.add("🏆 Tiết kiệm xuất sắc");
        if (totalBudgets > 0 && budgetsOnTrack == totalBudgets) badges.add("📊 Ngân sách chặt chẽ");
        if (completedGoals > 0) badges.add("🎯 Mục tiêu hoàn thành");
        if (spendingChangePercent < -10) badges.add("📉 Chi tiêu giảm");
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0 && savings.compareTo(BigDecimal.ZERO) > 0)
            badges.add("⚖️ Cân bằng tài chính");
        return badges;
    }

    private List<String> generateStrengths(double savingsRate, int budgetsOnTrack, int totalBudgets,
                                            int completedGoals, double spendingChangePercent) {
        List<String> strengths = new ArrayList<>();
        if (savingsRate > 20) {
            strengths.add("Bạn đang tiết kiệm rất tốt với tỷ lệ " + String.format("%.1f", savingsRate) + "% thu nhập");
        }
        if (totalBudgets > 0 && budgetsOnTrack == totalBudgets) {
            strengths.add("Tất cả ngân sách đều được kiểm soát trong hạn mức");
        }
        if (spendingChangePercent < 0) {
            strengths.add("Chi tiêu giảm " + String.format("%.1f", Math.abs(spendingChangePercent)) + "% so với tháng trước");
        }
        if (completedGoals > 0) {
            strengths.add("Đã hoàn thành " + completedGoals + " mục tiêu tiết kiệm trong tháng");
        }
        if (strengths.isEmpty()) {
            strengths.add("Đã theo dõi tài chính đều đặn trong tháng");
        }
        return strengths;
    }

    private List<String> generateImprovements(double savingsRate, int budgetsOnTrack, int totalBudgets,
                                               int completedGoals) {
        List<String> improvements = new ArrayList<>();
        if (savingsRate < 10) {
            improvements.add("Tỷ lệ tiết kiệm còn thấp (" + String.format("%.1f", savingsRate) + "%), hãy cố gắng cắt giảm chi tiêu không cần thiết");
        }
        if (savingsRate < 0) {
            improvements.add("Bạn đang chi tiêu nhiều hơn thu nhập, cần xem xét lại kế hoạch tài chính");
        }
        if (totalBudgets > 0 && budgetsOnTrack < totalBudgets) {
            improvements.add((totalBudgets - budgetsOnTrack) + " ngân sách đã vượt hạn mức, hãy điều chỉnh chi tiêu");
        }
        if (completedGoals == 0) {
            improvements.add("Chưa có đóng góp nào cho mục tiêu tiết kiệm trong tháng này");
        }
        if (improvements.isEmpty()) {
            improvements.add("Duy trì thói quen quản lý tài chính tốt như hiện tại!");
        }
        return improvements;
    }
}
