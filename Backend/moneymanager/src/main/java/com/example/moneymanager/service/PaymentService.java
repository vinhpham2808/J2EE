package com.example.moneymanager.service;

import com.example.moneymanager.dto.CreatePaymentRequestDTO;
import com.example.moneymanager.dto.CreatePaymentResponseDTO;
import com.example.moneymanager.entity.PaymentEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
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
    private final EmailService emailService;
    private final PdfReceiptService pdfReceiptService;

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
                .description(plan.paymentDescription())
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
            throw new RuntimeException("Không thể tạo liên kết thanh toán PayOS: " + e.getMessage(), e);
        }
    }

    public CreatePaymentResponseDTO getPaymentByOrderCode(Long orderCode) {
        PaymentEntity paymentEntity = findOwnedPayment(orderCode);
        return toDTO(paymentEntity);
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
            throw new RuntimeException("Không thể đồng bộ trạng thái thanh toán: " + e.getMessage(), e);
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
            throw new RuntimeException("Không thể xử lý webhook PayOS: " + e.getMessage(), e);
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
            throw new RuntimeException("Không thể xác nhận webhook PayOS: " + e.getMessage(), e);
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

    private long generateOrderCode() {
        long orderCode = System.currentTimeMillis();
        while (paymentRepository.findByOrderCode(orderCode).isPresent()) {
            orderCode++;
        }
        return orderCode;
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
            System.err.println("Không thể tự động đồng bộ giao dịch " + paymentEntity.getOrderCode() + ": " + e.getMessage());
        }
    }

    private void activateSubscriptionIfPaid(PaymentEntity paymentEntity, boolean wasPaidBefore) {
        if (STATUS_PAID.equalsIgnoreCase(paymentEntity.getStatus())
                && paymentEntity.getProfile() != null
                && paymentEntity.getPlanId() != null
                && !paymentEntity.getPlanId().isBlank()) {
            subscriptionService.activatePaidSubscription(paymentEntity.getProfile(), paymentEntity.getPlanId());
            if (!wasPaidBefore) {
                notificationService.notifyPaymentSuccess(paymentEntity.getProfile(), paymentEntity.getPlanName());
                try {
                    byte[] pdfBytes = pdfReceiptService.generatePaymentReceipt(paymentEntity);
                    String fullName = paymentEntity.getProfile().getFullName() != null ? paymentEntity.getProfile().getFullName() : "Quý khách";
                    String subject = "Biên lai thanh toán dịch vụ - MoneyManager";
                    String body = "Kính gửi " + fullName + ",\n\n"
                            + "Cảm ơn bạn đã sử dụng dịch vụ của MoneyManager.\n"
                            + "Giao dịch thanh toán gói " + paymentEntity.getPlanName() + " (Mã ĐH: " + paymentEntity.getOrderCode() + ") của bạn đã hoàn tất thành công.\n"
                            + "Vui lòng kiểm tra file biên lai định dạng PDF được đính kèm trong email này.\n\n"
                            + "Trân trọng,\nMoneyManager Team";
                    emailService.sendEmailWithAttachment(paymentEntity.getProfile().getEmail(), subject, body, pdfBytes, "Bien_lai_" + paymentEntity.getOrderCode() + ".pdf");
                } catch (Exception e) {
                    System.err.println("Lỗi khi tạo và gửi PDF biên lai cho giao dịch " + paymentEntity.getOrderCode() + ": " + e.getMessage());
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
