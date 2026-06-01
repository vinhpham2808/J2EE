package com.example.moneymanager.service;

import com.example.moneymanager.dto.BudgetDTO;
import com.example.moneymanager.dto.BudgetStatusDTO;
import com.example.moneymanager.entity.BudgetEntity;
import com.example.moneymanager.entity.CategoryEntity;
import com.example.moneymanager.entity.EmailNotificationType;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.BudgetRepository;
import com.example.moneymanager.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final ProfileService profileService;
    private final EmailService emailService;
    private final EmailNotificationPreferenceService emailNotificationPreferenceService;
    private final MailTemplateService mailTemplateService;

    // ─────────────────────────────────────────────────────────────
    // LUỒNG 1: THIẾT LẬP HẠN MỨC
    // ─────────────────────────────────────────────────────────────

    /**
     * Tạo mới hoặc cập nhật hạn mức ngân sách.
     * Chỉ chấp nhận danh mục loại "expense".
     */
    @Transactional
    public BudgetDTO setBudget(BudgetDTO dto) {
        ProfileEntity profile = profileService.getCurrentProfile();

        CategoryEntity category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));

        // Chỉ cho phép loại Expense
        if (!"expense".equalsIgnoreCase(category.getType())) {
            throw new RuntimeException("Chỉ có thể đặt hạn mức cho danh mục Chi tiêu (Expense)");
        }

        if (dto.getAmountLimit() == null || dto.getAmountLimit().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền hạn mức phải lớn hơn 0");
        }

        int month = dto.getMonth() != null ? dto.getMonth() : LocalDate.now().getMonthValue();
        int year  = dto.getYear()  != null ? dto.getYear()  : LocalDate.now().getYear();

        // Kiểm tra tháng đó đã có hạn mức chưa (Upsert)
        Optional<BudgetEntity> existing = budgetRepository
                .findByProfileIdAndCategoryIdAndMonthAndYear(profile.getId(), category.getId(), month, year);

        BudgetEntity entity;
        if (existing.isPresent()) {
            // Cập nhật
            entity = existing.get();
            entity.setAmountLimit(dto.getAmountLimit());
        } else {
            // Tạo mới
            entity = BudgetEntity.builder()
                    .profile(profile)
                    .category(category)
                    .amountLimit(dto.getAmountLimit())
                    .month(month)
                    .year(year)
                    .build();
        }

        entity = budgetRepository.save(entity);
        BigDecimal spent = getTotalSpent(profile.getId(), category.getId(), month, year);
        return toDTO(entity, spent);
    }

    /**
     * Lấy danh sách hạn mức của tháng/năm hiện tại.
     */
    @Transactional(readOnly = true)
    public List<BudgetDTO> getBudgetsForCurrentMonth() {
        ProfileEntity profile = profileService.getCurrentProfile();
        int month = LocalDate.now().getMonthValue();
        int year  = LocalDate.now().getYear();

        List<BudgetEntity> budgets = budgetRepository.findByProfileIdAndMonthAndYear(profile.getId(), month, year);

        // Batch load all spent amounts in a single query (avoid N+1)
        Map<Long, BigDecimal> spentByCategoryId = budgetRepository
                .getTotalSpentByCategoryForProfileAndMonth(profile.getId(), month, year)
                .stream()
                .filter(row -> row[0] != null)
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> {
                            Object val = row[1];
                            if (val instanceof BigDecimal) {
                                return (BigDecimal) val;
                            } else if (val instanceof Number) {
                                return new BigDecimal(val.toString());
                            }
                            return BigDecimal.ZERO;
                        },
                        (a, b) -> a
                ));

        return budgets.stream().map(b -> {
            BigDecimal spent = spentByCategoryId.getOrDefault(b.getCategory().getId(), BigDecimal.ZERO);
            return toDTO(b, spent);
        }).toList();
    }

    /**
     * Xóa một hạn mức.
     */
    @Transactional
    public void deleteBudget(Long budgetId) {
        ProfileEntity profile = profileService.getCurrentProfile();
        BudgetEntity entity = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Hạn mức không tồn tại"));
        if (!entity.getProfile().getId().equals(profile.getId())) {
            throw new RuntimeException("Không có quyền xóa hạn mức này");
        }
        budgetRepository.delete(entity);
    }

    // ─────────────────────────────────────────────────────────────
    // LUỒNG 2: KIỂM TRA (Được gọi từ ExpenseService sau addExpense)
    // ─────────────────────────────────────────────────────────────

    /**
     * Kiểm tra trạng thái ngân sách sau khi thêm expense.
     * Trả về BudgetStatusDTO để nhúng vào response của addExpense.
     */
    public BudgetStatusDTO checkBudgetStatus(Long profileId, Long categoryId, int month, int year) {
        Optional<BudgetEntity> budgetOpt = budgetRepository
                .findByProfileIdAndCategoryIdAndMonthAndYear(profileId, categoryId, month, year);

        if (budgetOpt.isEmpty()) {
            return BudgetStatusDTO.builder()
                    .hasBudget(false)
                    .isExceeded(false)
                    .isWarning(false)
                    .usageRatio(0.0)
                    .build();
        }

        BudgetEntity budget = budgetOpt.get();
        BigDecimal limit = budget.getAmountLimit();
        BigDecimal spent = getTotalSpent(profileId, categoryId, month, year);

        double ratio = 0.0;
        if (limit.compareTo(BigDecimal.ZERO) > 0) {
            ratio = spent.divide(limit, 4, RoundingMode.HALF_UP).doubleValue();
        }

        boolean isExceeded = ratio >= 1.0;
        boolean isWarning  = !isExceeded && ratio >= 0.8;

        return BudgetStatusDTO.builder()
                .hasBudget(true)
                .isExceeded(isExceeded)
                .isWarning(isWarning)
                .usageRatio(ratio)
                .amountLimit(limit)
                .totalSpent(spent)
                .categoryName(budget.getCategory().getName())
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // LUỒNG 3: GỬI EMAIL CẢNH BÁO (Async - không block response)
    // ─────────────────────────────────────────────────────────────

    /**
     * Gửi email cảnh báo ngân sách bất đồng bộ.
     * Được gọi sau khi xác định trạng thái IsExceeded hoặc IsWarning.
     */
    @Async
    public void sendBudgetAlertEmailAsync(ProfileEntity profile, BudgetStatusDTO status) {
        if (!status.isHasBudget()) return;
        if (!status.isExceeded() && !status.isWarning()) return;
        if (!emailNotificationPreferenceService.isNotificationEnabled(profile.getId(), EmailNotificationType.BUDGET_ALERTS)) {
            log.info("Budget alert email skipped for profile {} (disabled by preference)", profile.getId());
            return;
        }

        try {
            String alertType  = status.isExceeded() ? "VƯỢT NGƯỠNG" : "SẮP HẾT HẠN MỨC";
            String colorHex   = status.isExceeded() ? "#dc2626" : "#d97706";
            String percentage = String.format("%.1f%%", status.getUsageRatio() * 100);

            java.text.NumberFormat nf = java.text.NumberFormat.getInstance(new java.util.Locale("vi", "VN"));
            String limitStr = nf.format(status.getAmountLimit());
            String spentStr = nf.format(status.getTotalSpent());

            String htmlBody = mailTemplateService.buildBudgetAlertEmail(
                    profile.getFullName(), alertType, colorHex,
                    status.getCategoryName(), limitStr, spentStr, percentage);

            String subject = "[Money Manager] " + alertType + " – Ngân sách: " + status.getCategoryName();
            emailService.sendHtmlEmail(profile.getEmail(), subject, htmlBody);
            log.info("Budget alert email sent to {} for category {}", profile.getEmail(), status.getCategoryName());
        } catch (Exception e) {
            log.error("Failed to send budget alert email: {}", e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Helper methods
    // ─────────────────────────────────────────────────────────────

    private BigDecimal getTotalSpent(Long profileId, Long categoryId, int month, int year) {
        BigDecimal spent = budgetRepository.getTotalSpentByProfileAndCategoryAndMonthAndYear(
                profileId, categoryId, month, year);
        return spent != null ? spent : BigDecimal.ZERO;
    }

    private BudgetDTO toDTO(BudgetEntity entity, BigDecimal totalSpent) {
        return BudgetDTO.builder()
                .id(entity.getId())
                .categoryId(entity.getCategory().getId())
                .categoryName(entity.getCategory().getName())
                .categoryIcon(entity.getCategory().getIcon())
                .amountLimit(entity.getAmountLimit())
                .totalSpent(totalSpent)
                .month(entity.getMonth())
                .year(entity.getYear())
                .build();
    }
}
