package com.example.moneymanager.service;

import com.example.moneymanager.dto.BudgetStatusDTO;
import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.dto.ExpenseResponseDTO;
import com.example.moneymanager.entity.BudgetEntity;
import com.example.moneymanager.entity.CategoryEntity;
import com.example.moneymanager.entity.ExpenseEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.BudgetRepository;
import com.example.moneymanager.repository.CategoryRepository;
import com.example.moneymanager.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final ProfileService profileService;
    private final SubscriptionService subscriptionService;
    private final BudgetService budgetService;
    private final NotificationService notificationService;
    private final BudgetRepository budgetRepository;

    // Adds a new expense and checks budget status
    public ExpenseResponseDTO addExpense(ExpenseDTO dto) {
        ProfileEntity profile = profileService.getCurrentProfile();
        subscriptionService.ensureCanCreateTransaction(profile, dto.getDate());
        return addExpenseInternal(dto, profile);
    }

    // Internal method bypassing plan limits (used by cron)
    @Transactional
    public ExpenseResponseDTO addExpenseInternal(ExpenseDTO dto, ProfileEntity profile) {
        CategoryEntity category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        ExpenseEntity newExpense = toEntity(dto, profile, category);
        newExpense = expenseRepository.save(newExpense);

        // Lấy tháng/năm của giao dịch vừa thêm
        LocalDate expenseDate = newExpense.getDate() != null ? newExpense.getDate() : LocalDate.now();
        int month = expenseDate.getMonthValue();
        int year  = expenseDate.getYear();

        // Kiểm tra trạng thái ngân sách
        BudgetStatusDTO budgetStatus = budgetService.checkBudgetStatus(
                profile.getId(), category.getId(), month, year);

        // Notify expense added
        notificationService.notifyExpenseAdded(profile, newExpense.getName(), newExpense.getAmount());

        // Notify budget warning
        notificationService.notifyBudgetWarning(profile, budgetStatus);

        // Gửi email cảnh báo bất đồng bộ nếu có cảnh báo
        if (budgetStatus.isHasBudget() && (budgetStatus.isExceeded() || budgetStatus.isWarning())) {
            budgetService.sendBudgetAlertEmailAsync(profile, budgetStatus);
        }

        // ─── Smart Notification: Budget Threshold (70/80/90%) ─────
        checkBudgetThresholds(profile, category.getId(), month, year);

        // ─── Smart Notification: Abnormal Spending Check ──────────
        notificationService.checkAbnormalSpendingAsync(profile, expenseDate);

        return toResponseDTO(newExpense, budgetStatus);
    }

    // Retrieves all expenses for current month/based on the start date and end date
    public List<ExpenseDTO> getCurrentMonthExpensesForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        LocalDate now = LocalDate.now();
        LocalDate startDate = now.withDayOfMonth(1);
        LocalDate endDate = now.withDayOfMonth(now.lengthOfMonth());
        List<ExpenseEntity> list = expenseRepository.findByProfileIdAndDateBetween(profile.getId(), startDate, endDate);
        return list.stream().map(this::toDTO).toList();
    }

    // Retrieves all expenses for current user
    public List<ExpenseDTO> getAllExpensesForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<ExpenseEntity> list = expenseRepository.findByProfileIdOrderByDateDesc(profile.getId());
        return list.stream().map(this::toDTO).toList();
    }

    // Delete expense by id for current user
    @Transactional
    public void deleteExpense(Long expenseId) {
        ProfileEntity profile = profileService.getCurrentProfile();
        ExpenseEntity entity = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        if (!entity.getProfile().getId().equals(profile.getId())) {
            throw new RuntimeException("Unauthorized to delete this expense");
        }
        expenseRepository.delete(entity);
    }

    // Get latest 5 expenses for current user
    public List<ExpenseDTO> getLatest5ExpensesForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<ExpenseEntity> list = expenseRepository.findTop5ByProfileIdOrderByDateDesc(profile.getId());
        return list.stream().map(this::toDTO).toList();
    }

    // Get total expenses for current user
    public BigDecimal getTotalExpenseForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        BigDecimal total = expenseRepository.findTotalExpenseByProfileId(profile.getId());
        return total != null ? total : BigDecimal.ZERO;
    }

    public long getTotalExpenseCountForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        return expenseRepository.countByProfileId(profile.getId());
    }

    // Filter expenses
    public List<ExpenseDTO> filterExpenses(LocalDate startDate, LocalDate endDate, String keyword, Sort sort) {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<ExpenseEntity> list = expenseRepository.findByProfileIdAndDateBetweenAndNameContainingIgnoreCase(
                profile.getId(), startDate, endDate, keyword, sort);
        return list.stream().map(this::toDTO).toList();
    }

    // Notifications
    public List<ExpenseDTO> getExpensesForUserOnDate(Long profileId, LocalDate date) {
        List<ExpenseEntity> list = expenseRepository.findByProfileIdAndDate(profileId, date);
        return list.stream().map(this::toDTO).toList();
    }

    // ─── Smart Notification: Budget Threshold (70/80/90%) ─────────

    private void checkBudgetThresholds(ProfileEntity profile, Long categoryId, int month, int year) {
        Optional<BudgetEntity> budgetOpt = budgetRepository
                .findByProfileIdAndCategoryIdAndMonthAndYear(profile.getId(), categoryId, month, year);

        if (budgetOpt.isEmpty()) return;

        BudgetEntity budget = budgetOpt.get();
        BigDecimal limit = budget.getAmountLimit();
        BigDecimal spent = budgetRepository.getTotalSpentByProfileAndCategoryAndMonthAndYear(
                profile.getId(), categoryId, month, year);

        if (limit.compareTo(BigDecimal.ZERO) <= 0) return;

        double ratio = spent.divide(limit, 4, RoundingMode.HALF_UP).doubleValue();

        // Check 70% threshold
        if (ratio >= 0.7 && !budget.isNotified70()) {
            notificationService.notifyBudgetThreshold(profile, budget.getCategory().getName(), 70, spent, limit);
            budget.setNotified70(true);
            budgetRepository.save(budget);
        }
        // Check 80% threshold
        if (ratio >= 0.8 && !budget.isNotified80()) {
            notificationService.notifyBudgetThreshold(profile, budget.getCategory().getName(), 80, spent, limit);
            budget.setNotified80(true);
            budgetRepository.save(budget);
        }
        // Check 90% threshold
        if (ratio >= 0.9 && !budget.isNotified90()) {
            notificationService.notifyBudgetThreshold(profile, budget.getCategory().getName(), 90, spent, limit);
            budget.setNotified90(true);
            budgetRepository.save(budget);
        }
    }

    // Helper methods
    private ExpenseEntity toEntity(ExpenseDTO dto, ProfileEntity profile, CategoryEntity category) {
        return ExpenseEntity.builder()
                .name(dto.getName())
                .icon(dto.getIcon())
                .receiptLocation(dto.getReceiptLocation())
                .amount(dto.getAmount())
                .date(dto.getDate())
                .profile(profile)
                .category(category)
                .build();
    }

    public ExpenseDTO toDTO(ExpenseEntity entity) {
        return ExpenseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .icon(entity.getIcon())
            .receiptLocation(entity.getReceiptLocation())
                .categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null)
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : "N/A")
                .amount(entity.getAmount())
                .date(entity.getDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private ExpenseResponseDTO toResponseDTO(ExpenseEntity entity, BudgetStatusDTO budgetStatus) {
        return ExpenseResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .icon(entity.getIcon())
            .receiptLocation(entity.getReceiptLocation())
                .categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null)
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : "N/A")
                .amount(entity.getAmount())
                .date(entity.getDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .budgetStatus(budgetStatus)
                .build();
    }

    public List<ExpenseDTO> getExpensesByMonthForCurrentUser(int year, int monthValue) {
        ProfileEntity profile = profileService.getCurrentProfile();

        // Tạo ngày bắt đầu và kết thúc của tháng cần lấy
        LocalDate startDate = LocalDate.of(year, monthValue, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        // Lấy danh sách chi tiêu trong khoảng thời gian đó
        List<ExpenseEntity> expenses = expenseRepository.findByProfileIdAndDateBetween(
                profile.getId(),
                startDate,
                endDate
        );

        // Chuyển đổi sang DTO và trả về
        return expenses.stream()
                .map(this::toDTO)
                .collect(java.util.stream.Collectors.toList());
    }
}
