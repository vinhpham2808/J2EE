package com.example.moneymanager.service;

import com.example.moneymanager.dto.*;
import com.example.moneymanager.entity.*;
import com.example.moneymanager.exception.ForbiddenException;
import com.example.moneymanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ProfileService profileService;
    private final ProfileRepository profileRepository;
    private final RoleRepository roleRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final SavingGoalRepository savingGoalRepository;
    private final SavingGoalContributionRepository savingGoalContributionRepository;
    private final EmailNotificationPreferenceRepository emailNotificationPreferenceRepository;

    @Transactional(readOnly = true)
    public AdminOverviewDTO getOverview() {
        ensureAdmin();

        return AdminOverviewDTO.builder()
                .totalUsers(profileRepository.count())
                .activeSubscriptions(profileRepository.countBySubscriptionStatus(SubscriptionStatus.ACTIVE))
                .totalPayments(paymentRepository.count())
                .paidPayments(paymentRepository.countByStatusIgnoreCase("PAID"))
                .systemStatus("Online")
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminPaymentDTO> getPayments(String status, String search, Integer limit) {
        ensureAdmin();

        List<PaymentEntity> payments = (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status))
                ? paymentRepository.findAllWithProfileOrderByCreatedAtDesc()
                : paymentRepository.findByStatusWithProfileOrderByCreatedAtDesc(status);

        Stream<PaymentEntity> stream = payments.stream();

        if (search != null && !search.isBlank()) {
            String keyword = search.trim().toLowerCase(Locale.ROOT);
            stream = stream.filter(payment -> containsKeyword(payment, keyword));
        }

        if (limit != null && limit > 0) {
            stream = stream.limit(limit);
        }

        return stream.map(this::toAdminPaymentDTO).toList();
    }

    private boolean containsKeyword(PaymentEntity payment, String keyword) {
        String orderCode = payment.getOrderCode() != null ? String.valueOf(payment.getOrderCode()) : "";
        String description = payment.getDescription() != null ? payment.getDescription().toLowerCase(Locale.ROOT) : "";
        String planName = payment.getPlanName() != null ? payment.getPlanName().toLowerCase(Locale.ROOT) : "";
        String email = payment.getProfile() != null && payment.getProfile().getEmail() != null
                ? payment.getProfile().getEmail().toLowerCase(Locale.ROOT)
                : "";
        String fullName = payment.getProfile() != null && payment.getProfile().getFullName() != null
                ? payment.getProfile().getFullName().toLowerCase(Locale.ROOT)
                : "";

        return orderCode.contains(keyword)
                || description.contains(keyword)
                || planName.contains(keyword)
                || email.contains(keyword)
                || fullName.contains(keyword);
    }

    private AdminPaymentDTO toAdminPaymentDTO(PaymentEntity paymentEntity) {
        return AdminPaymentDTO.builder()
                .orderCode(paymentEntity.getOrderCode())
                .amount(paymentEntity.getAmount())
                .description(paymentEntity.getDescription())
                .status(paymentEntity.getStatus())
                .planId(paymentEntity.getPlanId())
                .planName(paymentEntity.getPlanName())
                .cycleMonths(paymentEntity.getCycleMonths())
                .payerEmail(paymentEntity.getProfile() != null ? paymentEntity.getProfile().getEmail() : null)
                .payerName(paymentEntity.getProfile() != null ? paymentEntity.getProfile().getFullName() : null)
                .createdAt(paymentEntity.getCreatedAt())
                .updatedAt(paymentEntity.getUpdatedAt())
                .build();
    }

    public void sendBroadcast(AdminBroadcastDTO dto) {
        ensureAdmin();
        notificationService.createBroadcast(dto.getTitle(), dto.getMessage());
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getBroadcasts() {
        ensureAdmin();
        List<NotificationEntity> broadcasts = notificationRepository.findByProfileIsNullOrderByCreatedAtDesc();
        return broadcasts.stream().map(n -> NotificationDTO.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType().name())
                .isRead(true) // Not applicable for admin view really
                .createdAt(n.getCreatedAt())
                .build()).toList();
    }

    @Transactional
    public void updateBroadcast(Long id, AdminBroadcastDTO dto) {
        ensureAdmin();
        NotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));
        if (notification.getProfile() != null) {
            throw new RuntimeException("Chỉ có thể chỉnh sửa thông báo broadcast");
        }
        notification.setTitle(dto.getTitle());
        notification.setMessage(dto.getMessage());
        notificationRepository.save(notification);
    }

    @Transactional
    public void deleteBroadcast(Long id) {
        ensureAdmin();
        NotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));
        if (notification.getProfile() != null) {
            throw new RuntimeException("Chỉ có thể xoá thông báo broadcast");
        }
        // Delete all read records first
        notificationReadRepository.deleteByNotificationId(id);
        notificationRepository.delete(notification);
    }

    // ─── User CRUD ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminUserDTO> getUsers(String search, String plan, String status, Integer limit) {
        ensureAdmin();

        Stream<ProfileEntity> stream = profileRepository.findAll().stream();

        if (search != null && !search.isBlank()) {
            String kw = search.trim().toLowerCase(Locale.ROOT);
            stream = stream.filter(p ->
                    (p.getFullName() != null && p.getFullName().toLowerCase(Locale.ROOT).contains(kw))
                    || (p.getEmail() != null && p.getEmail().toLowerCase(Locale.ROOT).contains(kw)));
        }
        if (plan != null && !plan.isBlank() && !"ALL".equalsIgnoreCase(plan)) {
            stream = stream.filter(p -> plan.equalsIgnoreCase(p.getSubscriptionPlan() != null ? p.getSubscriptionPlan().name() : ""));
        }
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            if ("active".equalsIgnoreCase(status)) stream = stream.filter(p -> Boolean.TRUE.equals(p.getIsActive()));
            else if ("inactive".equalsIgnoreCase(status)) stream = stream.filter(p -> !Boolean.TRUE.equals(p.getIsActive()));
        }
        if (limit != null && limit > 0) stream = stream.limit(limit);

        return stream.map(this::toAdminUserDTO).toList();
    }

    @Transactional(readOnly = true)
    public AdminUserDTO getUserById(Long id) {
        ensureAdmin();
        ProfileEntity profile = profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
        return toAdminUserDTO(profile);
    }

    @Transactional
    public AdminUserDTO updateUser(Long id, AdminUserUpdateDTO dto) {
        ensureAdmin();
        ProfileEntity profile = profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        // Prevent admin from deactivating themselves
        ProfileEntity self = profileService.getCurrentProfile();
        if (self.getId().equals(id) && Boolean.FALSE.equals(dto.getIsActive())) {
            throw new RuntimeException("Không thể vô hiệu hóa tài khoản của chính mình.");
        }

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            profile.setFullName(dto.getFullName().trim());
        }
        if (dto.getIsActive() != null) {
            profile.setIsActive(dto.getIsActive());
        }
        if (dto.getSubscriptionPlan() != null && !dto.getSubscriptionPlan().isBlank()) {
            SubscriptionPlan newPlan;
            try {
                newPlan = SubscriptionPlan.valueOf(dto.getSubscriptionPlan().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Gói đăng ký không hợp lệ: " + dto.getSubscriptionPlan());
            }
            profile.setSubscriptionPlan(newPlan);
            if (newPlan == SubscriptionPlan.FREE) {
                profile.setSubscriptionStatus(SubscriptionStatus.INACTIVE);
                profile.setSubscriptionActivatedAt(null);
                profile.setSubscriptionExpiresAt(null);
            } else {
                // Admin-granted paid plan: activate immediately with appropriate cycle
                java.time.LocalDate today = java.time.LocalDate.now();
                int cycleMonths = (newPlan == SubscriptionPlan.PREMIUM) ? 12 : 1;
                profile.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
                profile.setSubscriptionActivatedAt(today);
                profile.setSubscriptionExpiresAt(today.plusMonths(cycleMonths));
            }
        }
        if (dto.getRole() != null && !dto.getRole().isBlank()) {
            String roleName = "admin".equalsIgnoreCase(dto.getRole()) ? "admin" : "user";
            RoleEntity role = roleRepository.findByNameIgnoreCase(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            profile.setRole(role);
        }

        return toAdminUserDTO(profileRepository.save(profile));
    }

    @Transactional
    public void deleteUser(Long id) {
        ensureAdmin();
        ProfileEntity self = profileService.getCurrentProfile();
        if (self.getId().equals(id)) {
            throw new RuntimeException("Không thể xóa tài khoản của chính mình.");
        }
        if (!profileRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy người dùng.");
        }

        // Delete in dependency order to satisfy FK constraints
        notificationReadRepository.deleteByProfileId(id);
        notificationRepository.deleteByProfileId(id);

        List<Long> goalIds = savingGoalRepository.findByProfileId(id)
                .stream().map(SavingGoalEntity::getId).toList();
        if (!goalIds.isEmpty()) {
            savingGoalContributionRepository.deleteByGoalIdIn(goalIds);
        }
        savingGoalRepository.deleteByProfileId(id);

        expenseRepository.deleteByProfileId(id);
        incomeRepository.deleteByProfileId(id);
        budgetRepository.deleteByProfileId(id);
        categoryRepository.deleteByProfileId(id);
        paymentRepository.deleteByProfileId(id);
        emailNotificationPreferenceRepository.deleteByProfileId(id);

        profileRepository.deleteById(id);
    }

    private AdminUserDTO toAdminUserDTO(ProfileEntity p) {
        return AdminUserDTO.builder()
                .id(p.getId())
                .fullName(p.getFullName())
                .email(p.getEmail())
                .profileImageUrl(p.getProfileImageUrl())
                .isActive(p.getIsActive())
                .role(p.getRole() != null ? p.getRole().getName() : "user")
                .subscriptionPlan(p.getSubscriptionPlan())
                .subscriptionStatus(p.getSubscriptionStatus())
                .subscriptionExpiresAt(p.getSubscriptionExpiresAt())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private void ensureAdmin() {
        ProfileEntity currentProfile = profileService.getCurrentProfile();
        String roleName = currentProfile.getRole() != null ? currentProfile.getRole().getName() : "";
        if (!"admin".equalsIgnoreCase(roleName)) {
            throw new ForbiddenException("Bạn không có quyền truy cập chức năng này.");
        }
    }
}
