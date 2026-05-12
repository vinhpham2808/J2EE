package com.example.moneymanager.service;

import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.entity.SubscriptionStatus;
import com.example.moneymanager.repository.CategoryRepository;
import com.example.moneymanager.repository.ExpenseRepository;
import com.example.moneymanager.repository.IncomeRepository;
import com.example.moneymanager.repository.ProfileRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final ProfileRepository profileRepository;
    private final CategoryRepository categoryRepository;
    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;

    public PlanFeatures getPlanFeatures(ProfileEntity profile) {
        refreshSubscriptionIfExpired(profile);

        SubscriptionPlan effectivePlan = profile.getSubscriptionStatus() == SubscriptionStatus.ACTIVE
                ? profile.getSubscriptionPlan()
                : SubscriptionPlan.FREE;

        return switch (effectivePlan) {
            case BASIC -> new PlanFeatures(SubscriptionPlan.BASIC, 30, 1000, 12, true, true, true, false, true);
            case PREMIUM -> new PlanFeatures(SubscriptionPlan.PREMIUM, -1, -1, -1, true, true, true, true, true);
            case FREE -> new PlanFeatures(SubscriptionPlan.FREE, 10, 100, 3, false, false, false, false, false);
        };
    }

    public PlanCatalogItem getPlanCatalogItem(String planId) {
        if (planId == null || planId.isBlank()) {
            throw new RuntimeException("Vui lòng chọn gói dịch vụ.");
        }

        return switch (planId.trim().toLowerCase()) {
            case "basic" -> new PlanCatalogItem("basic", "Gói Cơ Bản", "Gói Cơ Bản", 2000L, 1, SubscriptionPlan.BASIC);
            case "premium" -> new PlanCatalogItem("premium", "Gói Premium", "Gói Premium", 299000L, 12, SubscriptionPlan.PREMIUM);
            default -> throw new RuntimeException("Gói dịch vụ không hợp lệ.");
        };
    }

    public void ensureCanCreateCategory(ProfileEntity profile) {
        PlanFeatures features = getPlanFeatures(profile);
        if (features.categoryLimit < 0) {
            return;
        }

        long currentCategories = categoryRepository.countByProfileId(profile.getId());
        if (currentCategories >= features.categoryLimit) {
            throw new RuntimeException("Bạn đã đạt đến giới hạn danh mục của gói hiện tại. Vui lòng nâng cấp để thêm nhiều danh mục hơn.");
        }
    }

    public void ensureCanCreateTransaction(ProfileEntity profile, LocalDate transactionDate) {
        PlanFeatures features = getPlanFeatures(profile);
        if (features.monthlyTransactionLimit < 0) {
            return;
        }

        LocalDate effectiveDate = transactionDate != null ? transactionDate : LocalDate.now();
        LocalDate startOfMonth = effectiveDate.withDayOfMonth(1);
        LocalDate endOfMonth = effectiveDate.withDayOfMonth(effectiveDate.lengthOfMonth());

        long monthlyIncomeCount = incomeRepository.countByProfileIdAndDateBetween(profile.getId(), startOfMonth, endOfMonth);
        long monthlyExpenseCount = expenseRepository.countByProfileIdAndDateBetween(profile.getId(), startOfMonth, endOfMonth);
        long monthlyTransactionCount = monthlyIncomeCount + monthlyExpenseCount;

        if (monthlyTransactionCount >= features.monthlyTransactionLimit) {
            throw new RuntimeException("Bạn đã đạt đến giới hạn giao dịch trong tháng của gói hiện tại. Vui lòng nâng cấp để tiếp tục.");
        }
    }

    public void ensureCanUseFilters(ProfileEntity profile, LocalDate startDate) {
        PlanFeatures features = getPlanFeatures(profile);
        if (features.canUseAdvancedFilters) {
            return;
        }

        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.now();
        LocalDate earliestAllowedDate = LocalDate.now().minusMonths(features.historyMonths).withDayOfMonth(1);
        if (effectiveStartDate.isBefore(earliestAllowedDate)) {
            throw new RuntimeException("Gói hiện tại chỉ hỗ trợ lọc dữ liệu trong 3 tháng gần nhất. Vui lòng nâng cấp để xem lịch sử dài hơn.");
        }
    }

    public void ensureCanExport(ProfileEntity profile) {
        PlanFeatures features = getPlanFeatures(profile);
        if (!features.canExportReports) {
            throw new RuntimeException("Tính năng xuất báo cáo chỉ có từ gói Cơ Bản. Vui lòng nâng cấp để tiếp tục.");
        }
    }

    public void ensureCanImportReceipt(ProfileEntity profile) {
        PlanFeatures features = getPlanFeatures(profile);
        if (!features.canImportReceipt) {
            throw new RuntimeException("Tính năng import hóa đơn bằng ảnh chỉ có ở gói Premium. Vui lòng nâng cấp để sử dụng.");
        }
    }

    public void ensureCanUseDetailedAi(ProfileEntity profile) {
        PlanFeatures features = getPlanFeatures(profile);
        if (!features.canUseDetailedAi) {
            throw new RuntimeException("Tính năng phân tích tài chính chuyên sâu bằng AI chỉ dành cho gói trả phí. Vui lòng nâng cấp để tiếp tục.");
        }
    }

    public void ensureCanUseForecast(ProfileEntity profile) {
        PlanFeatures features = getPlanFeatures(profile);
        if (features.getPlan() != SubscriptionPlan.PREMIUM) {
            throw new RuntimeException("Tính năng Dự báo và Cảnh báo bất thường chỉ có ở gói Premium. Vui lòng nâng cấp để sử dụng.");
        }
    }

    @Transactional
    public ProfileEntity activatePaidSubscription(ProfileEntity profile, String planId) {
        PlanCatalogItem plan = getPlanCatalogItem(planId);
        LocalDate today = LocalDate.now();
        LocalDate baseDate = profile.getSubscriptionExpiresAt() != null && profile.getSubscriptionExpiresAt().isAfter(today)
                ? profile.getSubscriptionExpiresAt()
                : today;

        profile.setSubscriptionPlan(plan.subscriptionPlan);
        profile.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        profile.setSubscriptionActivatedAt(today);
        profile.setSubscriptionExpiresAt(baseDate.plusMonths(plan.cycleMonths));
        if (profile.getAutoRenew() == null) {
            profile.setAutoRenew(false);
        }
        return profileRepository.save(profile);
    }

    @Transactional
    public ProfileEntity refreshSubscriptionIfExpired(ProfileEntity profile) {
        if (profile.getSubscriptionStatus() == SubscriptionStatus.ACTIVE
                && profile.getSubscriptionExpiresAt() != null
                && profile.getSubscriptionExpiresAt().isBefore(LocalDate.now())) {
            profile.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
            profile.setSubscriptionPlan(SubscriptionPlan.FREE);
            profile.setAutoRenew(false);
            return profileRepository.save(profile);
        }
        return profile;
    }

    @Getter
    public static class PlanFeatures {
        private final SubscriptionPlan plan;
        private final int categoryLimit;
        private final int monthlyTransactionLimit;
        private final int historyMonths;
        private final boolean canExportReports;
        private final boolean canUseAdvancedFilters;
        private final boolean canEmailReports;
        private final boolean canImportReceipt;
        private final boolean canUseDetailedAi;

        public PlanFeatures(
                SubscriptionPlan plan,
                int categoryLimit,
                int monthlyTransactionLimit,
                int historyMonths,
                boolean canExportReports,
                boolean canUseAdvancedFilters,
                boolean canEmailReports,
                boolean canImportReceipt,
                boolean canUseDetailedAi
        ) {
            this.plan = plan;
            this.categoryLimit = categoryLimit;
            this.monthlyTransactionLimit = monthlyTransactionLimit;
            this.historyMonths = historyMonths;
            this.canExportReports = canExportReports;
            this.canUseAdvancedFilters = canUseAdvancedFilters;
            this.canEmailReports = canEmailReports;
            this.canImportReceipt = canImportReceipt;
            this.canUseDetailedAi = canUseDetailedAi;
        }
    }

    public record PlanCatalogItem(
            String id,
            String displayName,
            String paymentDescription,
            Long amount,
            Integer cycleMonths,
            SubscriptionPlan subscriptionPlan
    ) {
    }
}
