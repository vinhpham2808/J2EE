package com.example.moneymanager.service;

import com.example.moneymanager.config.GeminiKeyRotator;
import com.example.moneymanager.config.GeminiProperties;
import com.example.moneymanager.config.GptOssKeyRotator;
import com.example.moneymanager.config.GptOssProperties;
import com.example.moneymanager.config.OcrKeyRotator;
import com.example.moneymanager.config.OcrProperties;
import com.example.moneymanager.dto.ReceiptImportAnalyzeResponseDTO;
import com.example.moneymanager.entity.CategoryEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReceiptImportServiceOcrRoutingRegressionTest {

    @Mock private RestClient ocrRestClient;
    @Mock private RestClient gptOssRestClient;
    @Mock private RestClient geminiRestClient;
    @Mock private ProfileService profileService;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ExpenseService expenseService;
    @Mock private SubscriptionService subscriptionService;

    @Mock private RestClient.RequestBodyUriSpec geminiRequestBodyUriSpec;
    @Mock private RestClient.RequestBodySpec geminiRequestBodySpec;
    @Mock private RestClient.ResponseSpec geminiResponseSpec;

    private ReceiptImportService receiptImportService;

    @BeforeEach
    void setUp() {
        OcrProperties ocrProperties = new OcrProperties(
                List.of("ocr-key"),
                "gemini-3.1-flash-lite",
                "https://generativelanguage.googleapis.com",
                45
        );
        GptOssProperties gptOssProperties = new GptOssProperties(
                List.of("gpt-key"),
                "openai/gpt-oss-120b:free",
                "https://openrouter.ai/api/v1",
                60
        );
        GeminiProperties geminiProperties = new GeminiProperties(
                List.of("gemini-key"),
                "gemini-2.0-flash-lite",
                "https://generativelanguage.googleapis.com",
                45
        );

        receiptImportService = new ReceiptImportService(
                ocrRestClient,
                ocrProperties,
                new OcrKeyRotator(ocrProperties),
                gptOssRestClient,
                gptOssProperties,
                new GptOssKeyRotator(gptOssProperties),
                geminiRestClient,
                geminiProperties,
                new GeminiKeyRotator(geminiProperties),
                new ObjectMapper(),
                profileService,
                categoryRepository,
                expenseService,
                subscriptionService
        );
    }

    @Test
    @DisplayName("REGRESSION: receipt OCR must route through Gemini when analyzeReceipt is called")
    void analyzeReceipt_mustUseGeminiRestClient() {
        ProfileEntity profile = ProfileEntity.builder().id(7L).build();
        CategoryEntity foodCategory = CategoryEntity.builder().id(11L).name("Ăn uống").type("expense").icon("Utensils").profile(profile).build();
        CategoryEntity otherCategory = CategoryEntity.builder().id(12L).name("Khác").type("expense").icon("CircleHelp").profile(profile).build();
        MockMultipartFile receiptFile = new MockMultipartFile(
                "file",
                "receipt.png",
                "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x00, 0x01, 0x02, 0x03}
        );

        when(profileService.getCurrentProfile()).thenReturn(profile);
        when(categoryRepository.findByTypeAndProfileId("expense", 7L)).thenReturn(List.of(foodCategory, otherCategory));
        when(categoryRepository.findByNameIgnoreCaseAndTypeAndProfileId("Khác", "expense", 7L)).thenReturn(Optional.of(otherCategory));

        when(geminiRestClient.post()).thenReturn(geminiRequestBodyUriSpec);
        when(geminiRequestBodyUriSpec.uri(any(Function.class))).thenReturn(geminiRequestBodySpec);
        when(geminiRequestBodySpec.body(any(String.class))).thenReturn(geminiRequestBodySpec);
        when(geminiRequestBodySpec.retrieve()).thenReturn(geminiResponseSpec);
        when(geminiResponseSpec.body(String.class)).thenReturn("""
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "{\\"merchant\\":\\"Bach Hoa\\",\\"location\\":\\"Quan 1\\",\\"receiptDate\\":\\"2026-05-29\\",\\"items\\":[{\\"name\\":\\"Bun bo\\",\\"amount\\":45000,\\"categoryHint\\":\\"food\\"}]}"
                          }
                        ]
                      }
                    }
                  ]
                }
                """);

        ReceiptImportAnalyzeResponseDTO result = receiptImportService.analyzeReceipt(receiptFile);

        assertNotNull(result);
        assertEquals("Bach Hoa", result.getMerchant());
        assertEquals(LocalDate.of(2026, 5, 29), result.getReceiptDate());
        assertEquals(1, result.getItems().size());
        assertEquals("Bun bo", result.getItems().get(0).getName());
        assertEquals(otherCategory.getId(), result.getItems().get(0).getCategoryId());

        verify(geminiRestClient).post();
        verify(ocrRestClient, never()).post();
        verify(gptOssRestClient, never()).post();
    }
}
