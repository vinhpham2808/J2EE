package com.example.moneymanager.controller;

import com.example.moneymanager.dto.CreatePaymentRequestDTO;
import com.example.moneymanager.dto.CreatePaymentResponseDTO;
import com.example.moneymanager.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.model.webhooks.ConfirmWebhookResponse;
import vn.payos.model.webhooks.Webhook;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/payos/create")
    public ResponseEntity<?> createPaymentLink(@RequestBody CreatePaymentRequestDTO requestDTO) {
        try {
            CreatePaymentResponseDTO responseDTO = paymentService.createPaymentLink(requestDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<?> getPaymentByOrderCode(@PathVariable Long orderCode) {
        try {
            CreatePaymentResponseDTO responseDTO = paymentService.getPaymentByOrderCode(orderCode);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/{orderCode}/status")
    public ResponseEntity<?> syncPaymentStatus(@PathVariable Long orderCode) {
        try {
            CreatePaymentResponseDTO responseDTO = paymentService.syncPaymentStatus(orderCode);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : "Lỗi không xác định khi đồng bộ trạng thái.";
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", errorMsg
            ));
        }
    }

    @PostMapping("/payos/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody Webhook webhook) {
        try {
            paymentService.handleWebhook(webhook);
            return ResponseEntity.ok(Map.of(
                    "message", "Xử lý webhook thành công."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/payos/confirm-webhook")
    public ResponseEntity<?> confirmWebhook() {
        try {
            ConfirmWebhookResponse response = paymentService.confirmWebhook();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage()
            ));
        }
    }
}
