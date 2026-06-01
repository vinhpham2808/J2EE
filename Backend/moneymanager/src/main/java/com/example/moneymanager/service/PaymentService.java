package com.example.moneymanager.service;

import com.example.moneymanager.dto.CreatePaymentRequestDTO;
import com.example.moneymanager.dto.CreatePaymentResponseDTO;
import com.example.moneymanager.entity.PaymentEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.exception.PaymentException;
import com.example.moneymanager.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.ConfirmWebhookResponse;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_PROCESSING = "PROCESSING";
    private static final String STATUS_PAID = "PAID";
    private static final String STATUS_FAILED = "FAILED";
    private static final String STATUS_CANCELLED = "CANCELLED";
    private static final String STATUS_EXPIRED = "EXPIRED";
    private static final String STATUS_UNDERPAID = "UNDERPAID";

    private final PayOS payOS;
    private final PaymentRepository paymentRepository;
    private final ProfileService profileService;
    private final SubscriptionService subscriptionService;
    private final NotificationService notificationService;
    private final DocumentService documentService;

    @Value("${payos.return-url}")
    private String returnUrl;

    @Value("${payos.cancel-url}")
    private String cancelUrl;

    @Value("${payos.webhook-url}")
    private String webhookUrl;

    @Transactional
    public CreatePaymentResponseDTO createPaymentLink(CreatePaymentRequestDTO requestDTO) {
        validateRequest(requestDTO);

        ProfileEntity currentProfile = profileService.getCurrentProfile();
        SubscriptionService.PlanCatalogItem plan = subscriptionService.getPlanCatalogItem(requestDTO.getPlanId());
        long orderCode = generateOrderCode();

        CreatePaymentLinkRequest paymentRequest = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(plan.amount())
                .description(sanitizeDescription(plan.paymentDescription()))
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .build();

        try {
            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentRequest);

            PaymentEntity paymentEntity = PaymentEntity.builder()
                    .orderCode(response.getOrderCode())
                    .amount(response.getAmount())
                    .description(response.getDescription())
                    .status(String.valueOf(response.getStatus()))
                    .paymentLinkId(response.getPaymentLinkId())
                    .checkoutUrl(response.getCheckoutUrl())
                    .planId(plan.id())
                    .planName(plan.displayName())
                    .cycleMonths(plan.cycleMonths())
                    .profile(currentProfile)
                    .build();

            paymentEntity = paymentRepository.save(paymentEntity);
            return toDTO(paymentEntity);
        } catch (Exception e) {
            log.error("PayOS create payment error for order {}: {}", orderCode, e.getMessage(), e);
            throw new PaymentException("Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.", e);
        }
    }

    public CreatePaymentResponseDTO getPaymentByOrderCode(Long orderCode) {
        PaymentEntity paymentEntity = findOwnedPayment(orderCode);
        return toDTO(paymentEntity);
    }

    public java.util.List<CreatePaymentResponseDTO> getPaymentsForCurrentUser() {
        ProfileEntity currentProfile = profileService.getCurrentProfile();
        java.util.List<PaymentEntity> payments = paymentRepository.findByProfileIdOrderByCreatedAtDesc(currentProfile.getId());
        return payments.stream().map(this::toDTO).toList();
    }

    @Transactional
    public void deletePayment(Long orderCode) {
        PaymentEntity payment = findOwnedPayment(orderCode);
        paymentRepository.delete(payment);
    }

    @Transactional
    public CreatePaymentResponseDTO syncPaymentStatus(Long orderCode) {
        PaymentEntity paymentEntity = findOwnedPayment(orderCode);
        boolean wasPaidBefore = STATUS_PAID.equalsIgnoreCase(paymentEntity.getStatus());

        try {
            PaymentLink paymentLink = payOS.paymentRequests().get(orderCode);
            paymentEntity.setStatus(normalizeStatus(String.valueOf(paymentLink.getStatus())));
            activateSubscriptionIfPaid(paymentEntity, wasPaidBefore);
            paymentEntity = paymentRepository.save(paymentEntity);
            return toDTO(paymentEntity);
        } catch (Exception e) {
            log.error("PayOS sync payment status error for order {}: {}", orderCode, e.getMessage(), e);
            throw new PaymentException("Không thể đồng bộ trạng thái thanh toán. Vui lòng thử lại sau.", e);
        }
    }

    @Transactional
    public void handleWebhook(Webhook webhook) {
        try {
            WebhookData webhookData = payOS.webhooks().verify(webhook);

            PaymentEntity paymentEntity = paymentRepository.findByOrderCode(webhookData.getOrderCode())
                    .orElseGet(() -> paymentRepository.findByPaymentLinkId(webhookData.getPaymentLinkId())
                            .orElse(null));

            if (paymentEntity == null) {
                return;
            }

            boolean wasPaidBefore = STATUS_PAID.equalsIgnoreCase(paymentEntity.getStatus());

            paymentEntity.setPaymentLinkId(webhookData.getPaymentLinkId());
            paymentEntity.setAmount(webhookData.getAmount());
            paymentEntity.setDescription(webhookData.getDescription());

            if ("00".equals(webhookData.getCode())) {
                paymentEntity.setStatus(STATUS_PAID);
                activateSubscriptionIfPaid(paymentEntity, wasPaidBefore);
            } else {
                paymentEntity.setStatus(STATUS_FAILED);
            }

            paymentRepository.save(paymentEntity);
        } catch (Exception e) {
            log.error("PayOS webhook processing error: {}", e.getMessage(), e);
            throw new PaymentException("Không thể xử lý webhook thanh toán.", e);
        }
    }

    @Scheduled(fixedDelayString = "${payos.status-sync-delay-ms:30000}")
    @Transactional
    public void syncPendingPayments() {
        paymentRepository.findByStatusIn(java.util.List.of(STATUS_PENDING, STATUS_PROCESSING, STATUS_UNDERPAID))
                .forEach(this::syncPaymentStatusSilently);
    }

    public ConfirmWebhookResponse confirmWebhook() {
        validateWebhookUrl();

        try {
            return payOS.webhooks().confirm(webhookUrl);
        } catch (Exception e) {
            log.error("PayOS webhook confirm error: {}", e.getMessage(), e);
            throw new PaymentException("Không thể xác nhận webhook. Vui lòng thử lại sau.", e);
        }
    }

    private void validateRequest(CreatePaymentRequestDTO requestDTO) {
        if (requestDTO == null) {
            throw new RuntimeException("Thiếu thông tin yêu cầu thanh toán.");
        }
        if (requestDTO.getPlanId() == null || requestDTO.getPlanId().isBlank()) {
            throw new RuntimeException("Vui lòng chọn gói dịch vụ.");
        }
    }

    private static final int ORDERCODE_MAX_ATTEMPTS = 5;
    private static final java.security.SecureRandom ORDERCODE_SECURE_RANDOM = new java.security.SecureRandom();

    private long generateOrderCode() {
        for (int attempt = 1; attempt <= ORDERCODE_MAX_ATTEMPTS; attempt++) {
            // PayOS requires orderCode <= 9007199254740991 (Number.MAX_SAFE_INTEGER in JS)
            // A secure random number in range [1, 9007199254740991] provides maximum entropy
            // and completely eliminates collision risk for sequential/concurrent generations.
            long candidate = (ORDERCODE_SECURE_RANDOM.nextLong() & Long.MAX_VALUE) % 9007199254740991L + 1;
            if (!paymentRepository.existsByOrderCode(candidate)) {
                return candidate;
            }
            log.warn("orderCode collision on attempt {}/{}", attempt, ORDERCODE_MAX_ATTEMPTS);
        }
        throw new PaymentException("Không thể sinh mã giao dịch duy nhất sau nhiều lần thử. Vui lòng thử lại sau.");
    }

    private PaymentEntity findOwnedPayment(Long orderCode) {
        ProfileEntity currentProfile = profileService.getCurrentProfile();
        PaymentEntity paymentEntity = paymentRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch thanh toán."));

        if (paymentEntity.getProfile() == null || !paymentEntity.getProfile().getId().equals(currentProfile.getId())) {
            throw new RuntimeException("Bạn không có quyền truy cập giao dịch thanh toán này.");
        }

        return paymentEntity;
    }

    public PaymentEntity findOwnedPaidPayment(Long orderCode) {
        PaymentEntity paymentEntity = findOwnedPayment(orderCode);
        if (!STATUS_PAID.equalsIgnoreCase(paymentEntity.getStatus())) {
            throw new RuntimeException("Giao dịch thanh toán chưa được hoàn tất.");
        }
        return paymentEntity;
    }

    private void validateWebhookUrl() {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            throw new RuntimeException("Thiếu URL webhook.");
        }
        if (webhookUrl.contains("your-public-domain")) {
            throw new RuntimeException("Vui lòng cập nhật PAYOS_WEBHOOK_URL bằng một URL public hợp lệ.");
        }
    }

    private void syncPaymentStatusSilently(PaymentEntity paymentEntity) {
        try {
            boolean wasPaidBefore = STATUS_PAID.equalsIgnoreCase(paymentEntity.getStatus());
            PaymentLink paymentLink = payOS.paymentRequests().get(paymentEntity.getOrderCode());
            paymentEntity.setStatus(normalizeStatus(String.valueOf(paymentLink.getStatus())));
            activateSubscriptionIfPaid(paymentEntity, wasPaidBefore);
            paymentRepository.save(paymentEntity);
        } catch (Exception e) {
            log.warn("Auto-sync failed for order {}: {}", paymentEntity.getOrderCode(), e.getMessage());
        }
    }

    private void activateSubscriptionIfPaid(PaymentEntity paymentEntity, boolean wasPaidBefore) {
        if (STATUS_PAID.equalsIgnoreCase(paymentEntity.getStatus())
                && paymentEntity.getProfile() != null
                && paymentEntity.getPlanId() != null
                && !paymentEntity.getPlanId().isBlank()
                && !wasPaidBefore                          // Guard: must be a fresh PAID transition
                && !paymentEntity.isSubscriptionActivated()) {  // Guard: defense-in-depth
            subscriptionService.activatePaidSubscription(paymentEntity.getProfile(), paymentEntity.getPlanId());
            paymentEntity.setSubscriptionActivated(true);
            if (!wasPaidBefore) {
                notificationService.notifyPaymentSuccess(paymentEntity.getProfile(), paymentEntity.getPlanName());
                // Sinh hóa đơn PDF qua AWS Lambda (không block flow chính)
                try {
                    documentService.generateInvoice(
                            paymentEntity.getOrderCode(),
                            paymentEntity.getAmount(),
                            paymentEntity.getPlanName(),
                            paymentEntity.getProfile().getEmail(),
                            java.time.LocalDate.now()
                    );
                } catch (Exception e) {
                    log.warn("Invoice generation failed for order {}: {}", paymentEntity.getOrderCode(), e.getMessage());
                }
            }
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return STATUS_PENDING;
        }

        return switch (status.toUpperCase()) {
            case STATUS_PAID -> STATUS_PAID;
            case STATUS_CANCELLED -> STATUS_CANCELLED;
            case STATUS_EXPIRED -> STATUS_EXPIRED;
            case STATUS_FAILED -> STATUS_FAILED;
            case STATUS_UNDERPAID -> STATUS_UNDERPAID;
            case STATUS_PROCESSING -> STATUS_PROCESSING;
            default -> STATUS_PENDING;
        };
    }

    private String sanitizeDescription(String input) {
        if (input == null) return "Thanh toan";
        String decomposed = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        String result = decomposed
                .replace("đ", "d")
                .replace("Đ", "D")
                .replaceAll("[^a-zA-Z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (result.length() > 25) {
            result = result.substring(0, 25).trim();
        }
        return result.isEmpty() ? "Thanh toan" : result;
    }

    private CreatePaymentResponseDTO toDTO(PaymentEntity entity) {
        return CreatePaymentResponseDTO.builder()
                .orderCode(entity.getOrderCode())
                .amount(entity.getAmount())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .paymentLinkId(entity.getPaymentLinkId())
                .checkoutUrl(entity.getCheckoutUrl())
                .planId(entity.getPlanId())
                .planName(entity.getPlanName())
                .cycleMonths(entity.getCycleMonths())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
