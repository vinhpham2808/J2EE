package com.example.moneymanager.service;

import com.example.moneymanager.config.GptOssKeyRotator;
import com.example.moneymanager.config.GptOssProperties;
import com.example.moneymanager.config.OcrKeyRotator;
import com.example.moneymanager.config.OcrProperties;
import com.example.moneymanager.config.GeminiKeyRotator;
import com.example.moneymanager.config.GeminiProperties;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
    @Mock private AiViolationService aiViolationService;
    @Mock private S3Service s3Service;

    @Mock private RestClient.RequestBodyUriSpec ocrRequestBodyUriSpec;
    @Mock private RestClient.RequestBodySpec ocrRequestBodySpec;
    @Mock private RestClient.ResponseSpec ocrResponseSpec;

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
                "gemini-3.1-flash-lite",
                "https://generativelanguage.googleapis.com",
                60
        );

        try {
            when(s3Service.uploadFile(any(), any())).thenReturn("https://test-bucket.s3.amazonaws.com/test.png");
        } catch (java.io.IOException e) {
            // Ignored in test setup
        }

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
                subscriptionService,
                aiViolationService,
                s3Service
        );
    }

    @Test
    @DisplayName("REGRESSION: receipt OCR must route through Gemini flash-lite when OCR config is present")
    void analyzeReceipt_mustUseDedicatedOcrConfigWhenAvailable() {
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
        when(aiViolationService.isAiBlocked(profile)).thenReturn(false);
        when(categoryRepository.findByTypeAndProfileId("expense", 7L)).thenReturn(List.of(foodCategory, otherCategory));
        when(categoryRepository.findByNameIgnoreCaseAndTypeAndProfileId(anyString(), eq("expense"), eq(7L))).thenReturn(Optional.of(otherCategory));

        when(ocrRestClient.post()).thenReturn(ocrRequestBodyUriSpec);
        when(ocrRequestBodyUriSpec.uri(any(Function.class))).thenReturn(ocrRequestBodySpec);
        when(ocrRequestBodySpec.body(any(String.class))).thenReturn(ocrRequestBodySpec);
        when(ocrRequestBodySpec.retrieve()).thenReturn(ocrResponseSpec);
        when(ocrResponseSpec.body(String.class)).thenReturn("""
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

        verify(ocrRestClient).post();
        verify(gptOssRestClient, never()).post();
        verify(geminiRestClient, never()).post();
    }

    @Test
    @DisplayName("REGRESSION: receipt OCR must rotate to the next OCR key when the first key fails")
    void analyzeReceipt_mustRetryWithNextOcrKeyWhenFirstAttemptFails() {
        OcrProperties rotatingOcrProperties = new OcrProperties(
                List.of("ocr-key-1", "ocr-key-2"),
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
                "gemini-3.1-flash-lite",
                "https://generativelanguage.googleapis.com",
                60
        );

        receiptImportService = new ReceiptImportService(
                ocrRestClient,
                rotatingOcrProperties,
                new OcrKeyRotator(rotatingOcrProperties),
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
                subscriptionService,
                aiViolationService,
                s3Service
        );

        ProfileEntity profile = ProfileEntity.builder().id(7L).build();
        CategoryEntity foodCategory = CategoryEntity.builder().id(11L).name("Meals").type("expense").icon("Utensils").profile(profile).build();
        CategoryEntity otherCategory = CategoryEntity.builder().id(12L).name("Other").type("expense").icon("CircleHelp").profile(profile).build();
        MockMultipartFile receiptFile = new MockMultipartFile(
                "file",
                "receipt.png",
                "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x00, 0x01, 0x02, 0x03}
        );

        when(profileService.getCurrentProfile()).thenReturn(profile);
        when(aiViolationService.isAiBlocked(profile)).thenReturn(false);
        when(categoryRepository.findByTypeAndProfileId("expense", 7L)).thenReturn(List.of(foodCategory, otherCategory));
        when(categoryRepository.findByNameIgnoreCaseAndTypeAndProfileId(anyString(), eq("expense"), eq(7L))).thenReturn(Optional.of(otherCategory));

        when(ocrRestClient.post()).thenReturn(ocrRequestBodyUriSpec);
        when(ocrRequestBodyUriSpec.uri(any(Function.class))).thenReturn(ocrRequestBodySpec);
        when(ocrRequestBodySpec.body(any(String.class))).thenReturn(ocrRequestBodySpec);
        when(ocrRequestBodySpec.retrieve()).thenReturn(ocrResponseSpec);
        when(ocrResponseSpec.body(String.class))
                .thenReturn("")
                .thenReturn("""
                        {
                          "candidates": [
                            {
                              "content": {
                                "parts": [
                                  {
                                    "text": "{\\"merchant\\":\\"Coopmart\\",\\"location\\":\\"Thu Duc\\",\\"receiptDate\\":\\"2026-06-01\\",\\"items\\":[{\\"name\\":\\"Sua tuoi\\",\\"amount\\":32000,\\"categoryHint\\":\\"food\\"}]}"
                                  }
                                ]
                              }
                            }
                          ]
                        }
                        """);

        ReceiptImportAnalyzeResponseDTO result = receiptImportService.analyzeReceipt(receiptFile);

        assertNotNull(result);
        assertEquals("Coopmart", result.getMerchant());
        assertEquals(LocalDate.of(2026, 6, 1), result.getReceiptDate());
        assertEquals(1, result.getItems().size());
        assertEquals("Sua tuoi", result.getItems().get(0).getName());

        verify(ocrRestClient, times(2)).post();
        verify(geminiRestClient, never()).post();
        verify(gptOssRestClient, never()).post();
    }
}
