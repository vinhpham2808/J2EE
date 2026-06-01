package com.example.moneymanager.security;

import com.example.moneymanager.controller.DocumentController;

import com.example.moneymanager.entity.PaymentEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.service.DocumentService;
import com.example.moneymanager.service.ExpenseService;
import com.example.moneymanager.service.IncomeService;
import com.example.moneymanager.service.PaymentService;
import com.example.moneymanager.service.ProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DocumentControllerInvoiceRegressionTest {

    @Mock ProfileService profileService;
    @Mock PaymentService paymentService;
    @Mock DocumentService documentService;
    @Mock ExpenseService expenseService;
    @Mock IncomeService incomeService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                new DocumentController(documentService, profileService, paymentService, expenseService, incomeService)
        ).build();
    }

    @Test
    @DisplayName("REGRESSION: invoice endpoint must ignore client-supplied amount/planName/paidDate and only use server data")
    void generateInvoice_mustIgnoreClientBillingFields() throws Exception {
        ProfileEntity profile = ProfileEntity.builder().id(1L).email("owner@example.com").build();
        LocalDateTime paidTime = LocalDateTime.of(2026, 5, 28, 10, 0, 0);
        PaymentEntity payment = PaymentEntity.builder()
                .orderCode(999L)
                .amount(199000L)
                .planName("Premium Server")
                .status("PAID")
                .profile(profile)
                .updatedAt(paidTime)
                .build();

        when(profileService.getCurrentProfile()).thenReturn(profile);
        when(paymentService.findOwnedPaidPayment(eq(999L))).thenReturn(payment);
        when(documentService.generateInvoice(anyLong(), anyLong(), anyString(), anyString(), any(LocalDate.class)))
                .thenReturn(Map.of("s3Key", "k", "presignedUrl", "u"));

        String maliciousPayload = "{\"orderCode\":999,\"amount\":1,\"planName\":\"Fake Cheap Plan\",\"paidDate\":\"2000-01-01\"}";

        mockMvc.perform(post("/documents/invoice")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(maliciousPayload))
                .andExpect(status().isOk());

        verify(documentService).generateInvoice(
                eq(999L),
                eq(199000L),
                eq("Premium Server"),
                eq("owner@example.com"),
                eq(paidTime.toLocalDate())
        );
    }

    @Test
    @DisplayName("REGRESSION: invoice endpoint must reject non-PAID payments")
    void generateInvoice_mustRejectUnpaidPayment() throws Exception {
        when(paymentService.findOwnedPaidPayment(eq(999L)))
                .thenThrow(new RuntimeException("Giao dịch thanh toán chưa được hoàn tất."));

        mockMvc.perform(post("/documents/invoice")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderCode\":999}"))
                .andExpect(status().isBadRequest());

        verify(documentService, never()).generateInvoice(anyLong(), anyLong(), anyString(), anyString(), any(LocalDate.class));
    }
}
