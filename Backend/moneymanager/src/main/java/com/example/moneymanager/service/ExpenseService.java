package com.example.moneymanager.service;

import com.example.moneymanager.dto.BudgetStatusDTO;
import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.dto.ExpenseResponseDTO;
import com.example.moneymanager.entity.BudgetEntity;
import com.example.moneymanager.entity.CategoryEntity;
import com.example.moneymanager.entity.ExpenseEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.entity.JarEntity;
import com.example.moneymanager.event.TransactionEvents;
import com.example.moneymanager.repository.BudgetRepository;
import com.example.moneymanager.repository.CategoryRepository;
import com.example.moneymanager.repository.ExpenseRepository;
import com.example.moneymanager.repository.JarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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
    private final JarRepository jarRepository;
    private final ApplicationEventPublisher eventPublisher;

    // Adds a new expense and checks budget status
    @Transactional
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
        
        if (dto.getJarId() != null) {
            com.example.moneymanager.entity.JarEntity jar = jarRepository.findById(dto.getJarId())
                .orElseThrow(() -> new RuntimeException("Jar not found"));
            if (!jar.getProfile().getId().equals(profile.getId())) {
                throw new RuntimeException("Unauthorized jar access");
            }
            jar.setCurrentBalance(jar.getCurrentBalance().subtract(dto.getAmount()));
            newExpense.setJar(jar);
            jarRepository.save(jar);
        }

        newExpense = expenseRepository.save(newExpense);

        // Lấy tháng/năm của giao dịch vừa thêm
        LocalDate expenseDate = newExpense.getDate() != null ? newExpense.getDate() : LocalDate.now();

        // Publish event — side-effects chạy async sau khi transaction commit
        eventPublisher.publishEvent(new TransactionEvents.ExpenseCreated(
                profile, newExpense.getName(), newExpense.getAmount(), category, expenseDate));

        // Vẫn trả BudgetStatus đồng bộ cho response (chỉ đọc, không write)
        BudgetStatusDTO budgetStatus = budgetService.checkBudgetStatus(
                profile.getId(), category.getId(), expenseDate.getMonthValue(), expenseDate.getYear());

        return toResponseDTO(newExpense, budgetStatus);
    }

    // Retrieves all expenses for current month/based on the start date and end date
    @Transactional(readOnly = true)
    public List<ExpenseDTO> getCurrentMonthExpensesForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        LocalDate now = LocalDate.now();
        LocalDate startDate = now.withDayOfMonth(1);
        LocalDate endDate = now.withDayOfMonth(now.lengthOfMonth());
        List<ExpenseEntity> list = expenseRepository.findByProfileIdAndDateBetween(profile.getId(), startDate, endDate);
        return list.stream().map(this::toDTO).toList();
    }

    // Retrieves all expenses for current user
    @Transactional(readOnly = true)
    public List<ExpenseDTO> getAllExpensesForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<ExpenseEntity> list = expenseRepository.findByProfileIdOrderByDateDesc(profile.getId());
        return list.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ExpenseDTO> getExpensesForCurrentUser(Boolean all, int page, int size) {
        ProfileEntity profile = profileService.getCurrentProfile();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        
        org.springframework.data.domain.Page<ExpenseEntity> expensePage;
        if (Boolean.TRUE.equals(all)) {
            expensePage = expenseRepository.findByProfileIdOrderByDateDesc(profile.getId(), pageable);
        } else {
            LocalDate now = LocalDate.now();
            LocalDate startDate = now.withDayOfMonth(1);
            LocalDate endDate = now.withDayOfMonth(now.lengthOfMonth());
            expensePage = expenseRepository.findByProfileIdAndDateBetween(profile.getId(), startDate, endDate, pageable);
        }
        return expensePage.getContent().stream().map(this::toDTO).toList();
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
        
        if (entity.getJar() != null) {
            com.example.moneymanager.entity.JarEntity jar = entity.getJar();
            jar.setCurrentBalance(jar.getCurrentBalance().add(entity.getAmount()));
            jarRepository.save(jar);
        }
        
        expenseRepository.delete(entity);
    }

    // Update expense by id for current user
    @Transactional
    public ExpenseResponseDTO updateExpense(Long expenseId, ExpenseDTO dto) {
        ProfileEntity profile = profileService.getCurrentProfile();
        ExpenseEntity expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getProfile().getId().equals(profile.getId())) {
            throw new RuntimeException("Unauthorized to update this expense");
        }

        // Keep track of old state to adjust Jar balances
        BigDecimal oldAmount = expense.getAmount();
        JarEntity oldJar = expense.getJar();

        CategoryEntity category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        expense.setName(dto.getName());
        expense.setIcon(dto.getIcon());
        expense.setDate(dto.getDate());
        expense.setAmount(dto.getAmount());
        expense.setCategory(category);

        JarEntity newJar = null;
        if (dto.getJarId() != null) {
            newJar = jarRepository.findById(dto.getJarId())
                    .orElseThrow(() -> new RuntimeException("Jar not found"));
            if (!newJar.getProfile().getId().equals(profile.getId())) {
                throw new RuntimeException("Unauthorized jar access");
            }
        }

        // Adjust Jar balance
        if (oldJar != null && (newJar == null || !oldJar.getId().equals(newJar.getId()))) {
            // Refund the old jar
            oldJar.setCurrentBalance(oldJar.getCurrentBalance().add(oldAmount));
            jarRepository.save(oldJar);

            // Deduct from the new jar
            if (newJar != null) {
                newJar.setCurrentBalance(newJar.getCurrentBalance().subtract(dto.getAmount()));
                jarRepository.save(newJar);
            }
        } else if (oldJar == null && newJar != null) {
            // Deduct from the new jar
            newJar.setCurrentBalance(newJar.getCurrentBalance().subtract(dto.getAmount()));
            jarRepository.save(newJar);
        } else if (oldJar != null && oldJar.getId().equals(newJar.getId())) {
            // Same jar, adjust by difference
            BigDecimal difference = dto.getAmount().subtract(oldAmount);
            oldJar.setCurrentBalance(oldJar.getCurrentBalance().subtract(difference));
            jarRepository.save(oldJar);
        }

        expense.setJar(newJar);
        expense = expenseRepository.save(expense);

        LocalDate expenseDate = expense.getDate() != null ? expense.getDate() : LocalDate.now();

        // Vẫn check budget status đồng bộ cho response
        BudgetStatusDTO budgetStatus = budgetService.checkBudgetStatus(
                profile.getId(), category.getId(), expenseDate.getMonthValue(), expenseDate.getYear());

        // Publish event — side-effects chạy async sau khi transaction commit
        eventPublisher.publishEvent(new TransactionEvents.ExpenseUpdated(
                profile, expense.getName(), expense.getAmount(), category, expenseDate));

        return toResponseDTO(expense, budgetStatus);
    }

    // Get latest 5 expenses for current user
    @Transactional(readOnly = true)
    public List<ExpenseDTO> getLatest5ExpensesForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<ExpenseEntity> list = expenseRepository.findTop5ByProfileIdOrderByDateDesc(profile.getId());
        return list.stream().map(this::toDTO).toList();
    }

    // Get total expenses for current user
    @Transactional(readOnly = true)
    public BigDecimal getTotalExpenseForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        BigDecimal total = expenseRepository.findTotalExpenseByProfileId(profile.getId());
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public long getTotalExpenseCountForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        return expenseRepository.countByProfileId(profile.getId());
    }

    // Filter expenses
    @Transactional(readOnly = true)
    public List<ExpenseDTO> filterExpenses(LocalDate startDate, LocalDate endDate, String keyword, Sort sort) {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<ExpenseEntity> list = expenseRepository.findByProfileIdAndDateBetweenAndNameContainingIgnoreCase(
                profile.getId(), startDate, endDate, keyword, sort);
        return list.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ExpenseDTO> filterExpenses(LocalDate startDate, LocalDate endDate, String keyword, Sort sort, int page, int size) {
        ProfileEntity profile = profileService.getCurrentProfile();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);
        org.springframework.data.domain.Page<ExpenseEntity> expensePage = expenseRepository.findByProfileIdAndDateBetweenAndNameContainingIgnoreCase(
                profile.getId(), startDate, endDate, keyword, pageable);
        return expensePage.getContent().stream().map(this::toDTO).toList();
    }

    // Notifications
    @Transactional(readOnly = true)
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
                .jarId(entity.getJar() != null ? entity.getJar().getId() : null)
                .jarName(entity.getJar() != null ? entity.getJar().getName() : null)
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

    public Map<String, BigDecimal> getMonthlyTotalsForCurrentUser(LocalDate startDate, LocalDate endDate) {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<Object[]> results = expenseRepository.findMonthlyExpenseTotals(profile.getId(), startDate, endDate);
        
        Map<String, BigDecimal> totals = new java.util.HashMap<>();
        for (Object[] row : results) {
            Integer month = (Integer) row[0];
            Integer year = (Integer) row[1];
            BigDecimal amount = (BigDecimal) row[2];
            String key = year + "-" + String.format("%02d", month);
            totals.put(key, amount);
        }
        return totals;
    }
}
