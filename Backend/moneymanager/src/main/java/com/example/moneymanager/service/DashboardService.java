package com.example.moneymanager.service;

import com.example.moneymanager.dto.*;
import com.example.moneymanager.entity.ProfileEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static java.util.stream.Stream.concat;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    public Long getProfileId() {
        ProfileEntity profile = profileService.getCurrentProfile();
        return profile != null ? profile.getId() : null;
    }

    private final IncomeService incomeService;
    private final ExpenseService expenseService;
    private final ProfileService profileService;
    private final SavingGoalService savingGoalService;
    private final BudgetService budgetService;
    private final GeminiService geminiService;
    private final GptOssService gptOssService;

    @Transactional(readOnly = true)
    @Cacheable(value = "dashboard", key = "#root.target.getProfileId()", unless = "#result == null or #result.isEmpty()")
    public Map<String, Object> getDashboardData() {
        try {
            ProfileEntity profile = profileService.getCurrentProfile();
            if (profile == null) {
                log.error("Profile not found when getting dashboard data");
                return new HashMap<>();
            }

            Map<String, Object> returnValue = new LinkedHashMap<>();
            List<IncomeDTO> latestIncomes = incomeService.getLatest5IncomesForCurrentUser();
            List<ExpenseDTO> latestExpenses = expenseService.getLatest5ExpensesForCurrentUser();

            List<RecentTransactionDTO> recentTransactions = concat(
                    latestIncomes.stream().map(income ->
                            RecentTransactionDTO.builder()
                                    .id(income.getId())
                                    .profileId(profile.getId())
                                    .icon(income.getIcon())
                                    .name(income.getName())
                                    .amount(income.getAmount())
                                    .date(income.getDate())
                                    .createdAt(income.getCreatedAt())
                                    .updatedAt(income.getUpdatedAt())
                                    .type("income")
                                    .build()
                    ),
                    latestExpenses.stream().map(expense ->
                            RecentTransactionDTO.builder()
                                    .id(expense.getId() != null ? -expense.getId() : null)
                                    .profileId(profile.getId())
                                    .icon(expense.getIcon())
                                    .name(expense.getName())
                                    .amount(expense.getAmount())
                                    .date(expense.getDate())
                                    .createdAt(expense.getCreatedAt())
                                    .updatedAt(expense.getUpdatedAt())
                                    .type("expense")
                                    .build()
                    )
            ).sorted((a, b) -> {
                int cmp = b.getDate().compareTo(a.getDate());
                if (cmp == 0 && a.getCreatedAt() != null && b.getCreatedAt() != null) {
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                }
                return cmp;
            }).collect(Collectors.toList());

            // Tối ưu: gọi 1 lần thay vì 2 lần
            java.math.BigDecimal totalIncome = incomeService.getTotalIncomeForCurrentUser();
            java.math.BigDecimal totalExpense = expenseService.getTotalExpenseForCurrentUser();
            
            returnValue.put("totalBalance", totalIncome.subtract(totalExpense));
            returnValue.put("totalIncome", totalIncome);
            returnValue.put("totalExpense", totalExpense);
            returnValue.put("recent5Expenses", latestExpenses);
            returnValue.put("recent5Incomes", latestIncomes);
            returnValue.put("recentTransactions", recentTransactions);

            // Saving Goals summary
            Map<String, Object> savingGoalSummary = savingGoalService.getSavingGoalSummary();
            returnValue.put("savingGoalActiveCount", savingGoalSummary.getOrDefault("activeCount", 0));
            returnValue.put("savingGoalCompletedCount", savingGoalSummary.getOrDefault("completedCount", 0));
            returnValue.put("savingGoalTotalSaved", savingGoalSummary.getOrDefault("totalSaved", 0));

            // Budgets for current month
            returnValue.put("budgets", budgetService.getBudgetsForCurrentMonth());

            // Priority Saving Goal
            List<SavingGoalDTO> allGoals = savingGoalService.getAllGoals();
            returnValue.put("priorityGoal", allGoals.isEmpty() ? null : allGoals.get(0));

            // Tối ưu: dùng aggregate query thay vì loop 6 lần
            List<Map<String, Object>> monthlyHistory = new ArrayList<>();
            LocalDate now = LocalDate.now();
            LocalDate startDate = now.minusMonths(5).withDayOfMonth(1);
            LocalDate endDate = now.withDayOfMonth(now.lengthOfMonth());
            
            // Lấy tất cả monthly totals trong 2 queries
            Map<String, java.math.BigDecimal> incomeByMonth = incomeService.getMonthlyTotalsForCurrentUser(startDate, endDate);
            Map<String, java.math.BigDecimal> expenseByMonth = expenseService.getMonthlyTotalsForCurrentUser(startDate, endDate);
            
            for (int i = 5; i >= 0; i--) {
                LocalDate date = now.minusMonths(i);
                String monthKey = date.getYear() + "-" + String.format("%02d", date.getMonthValue());
                
                Map<String, Object> history = new HashMap<>();
                history.put("month", "T" + date.getMonthValue());
                history.put("income", incomeByMonth.getOrDefault(monthKey, java.math.BigDecimal.ZERO));
                history.put("expense", expenseByMonth.getOrDefault(monthKey, java.math.BigDecimal.ZERO));
                monthlyHistory.add(history);
            }
            returnValue.put("monthlyHistory", monthlyHistory);

            return returnValue;

        } catch (Exception e) {
            log.error("Error getting dashboard data: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get dashboard data: " + e.getMessage());
        }
    }

    // AI Insight ngắn gọn (hiển thị ban đầu)
    public Map<String, String> getAiInsight() {
        try {
            ProfileEntity profile = profileService.getCurrentProfile();
            if (profile == null) {
                log.error("Profile not found when getting AI insight");
                return Map.of("insight", "Vui lòng đăng nhập để sử dụng tính năng này");
            }

            String userName = profile.getFullName() != null ? profile.getFullName() : "bạn";
            Map<String, Object> currentData = getDashboardData();

            if (currentData == null || currentData.isEmpty()) {
                log.warn("Dashboard data is empty");
                return Map.of("insight", "Chưa có dữ liệu để phân tích. Hãy thêm giao dịch đầu tiên!");
            }

            AssistantChatResponseDTO aiResponse = gptOssService.getDashboardInsight(currentData, userName);

            if (aiResponse == null || aiResponse.getReply() == null) {
                return Map.of("insight", "AI đang cập nhật, vui lòng thử lại sau");
            }

            return Map.of("insight", aiResponse.getReply());

        } catch (Exception e) {
            log.error("Error getting AI insight: {}", e.getMessage(), e);
            return Map.of("insight", "Hệ thống AI đang bảo trì, vui lòng thử lại sau");
        }
    }

    // AI Insight CHI TIẾT - DỰ ĐOÁN TƯƠNG LAI
    public Map<String, Object> getDetailedAiInsight() {
        try {
            ProfileEntity profile = profileService.getCurrentProfile();
            if (profile == null) {
                log.error("Profile not found when getting detailed AI insight");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "User not authenticated");
                errorResponse.put("message", "Vui lòng đăng nhập để sử dụng tính năng này");
                return errorResponse;
            }

            String userName = profile.getFullName() != null ? profile.getFullName() : "bạn";
            log.info("Getting detailed insight for user: {}", userName);

            Map<String, Object> currentData = getDashboardData();
            if (currentData == null || currentData.isEmpty()) {
                log.warn("Dashboard data is empty for user: {}", userName);
                Map<String, Object> emptyResponse = new HashMap<>();
                emptyResponse.put("message", "Chưa có đủ dữ liệu để phân tích chi tiết");
                emptyResponse.put("status", "insufficient_data");
                return emptyResponse;
            }

            Map<String, Object> detailedInsight = geminiService.getDetailedDashboardInsight(currentData, userName);

            if (detailedInsight == null || detailedInsight.isEmpty()) {
                log.warn("Detailed insight is empty for user: {}", userName);
                Map<String, Object> emptyResponse = new HashMap<>();
                emptyResponse.put("message", "Không thể tạo phân tích chi tiết. Vui lòng thử lại sau");
                emptyResponse.put("status", "analysis_failed");
                return emptyResponse;
            }

            log.info("Detailed insight generated successfully for user: {}", userName);
            return detailedInsight;

        } catch (Exception e) {
            log.error("Error getting detailed AI insight: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Không thể tải phân tích chi tiết: " + e.getMessage());
            return errorResponse;
        }
    }
}