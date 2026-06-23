package com.example.moneymanager.service;

import com.example.moneymanager.config.GeminiKeyRotator;
import com.example.moneymanager.config.GeminiProperties;
import com.example.moneymanager.config.GptOssKeyRotator;
import com.example.moneymanager.config.GptOssProperties;
import com.example.moneymanager.config.OcrKeyRotator;
import com.example.moneymanager.config.OcrProperties;
import com.example.moneymanager.dto.ForecastDTOs.ForecastInsightDTO;
import com.example.moneymanager.dto.MonthlyReportAiAnalysisRequestDTO;
import com.example.moneymanager.dto.SpendingTipsResponseDTO;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.exception.ForbiddenException;
import com.example.moneymanager.repository.BudgetRepository;
import com.example.moneymanager.repository.CategoryRepository;
import com.example.moneymanager.repository.ExpenseRepository;
import com.example.moneymanager.repository.IncomeRepository;
import com.example.moneymanager.repository.SavingGoalContributionRepository;
import com.example.moneymanager.repository.SavingGoalRepository;
import com.example.moneymanager.repository.SpendingTipsRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiFeatureBlockRegressionTest {

    @Mock private IncomeService incomeService;
    @Mock private ExpenseService expenseService;
    @Mock private ProfileService profileService;
    @Mock private SavingGoalService savingGoalService;
    @Mock private BudgetService budgetService;
    @Mock private GeminiService geminiService;
    @Mock private GptOssService gptOssService;
    @Mock private AiViolationService aiViolationService;
    @Mock private SpendingTipsRepository spendingTipsRepository;
    @Mock private SubscriptionService subscriptionService;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private BudgetRepository budgetRepository;
    @Mock private IncomeRepository incomeRepository;
    @Mock private SavingGoalRepository savingGoalRepository;
    @Mock private SavingGoalContributionRepository savingGoalContributionRepository;
    @Mock private RestClient ocrRestClient;
    @Mock private RestClient gptOssRestClient;
    @Mock private RestClient geminiRestClient;
    @Mock private CategoryRepository categoryRepository;
    @Mock private S3Service s3Service;

    @Test
    @DisplayName("REGRESSION: dashboard insight must stop when AI access is blocked")
    void dashboardInsight_returnsPlaceholderWhenBlocked() {
        ProfileEntity profile = ProfileEntity.builder().id(1L).fullName("Nova").build();
        DashboardService service = new DashboardService(
                incomeService,
                expenseService,
                profileService,
                savingGoalService,
                budgetService,
                expenseRepository,
                incomeRepository
        );
        org.springframework.test.util.ReflectionTestUtils.setField(service, "geminiService", geminiService);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "gptOssService", gptOssService);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "aiViolationService", aiViolationService);

        when(profileService.getCurrentProfile()).thenReturn(profile);
        when(aiViolationService.isAiBlocked(profile)).thenReturn(true);

        Map<String, String> response = service.getAiInsight();

        assertEquals("Tính năng AI tạm thời không khả dụng.", response.get("insight"));
        verify(gptOssService, never()).getDashboardInsight(any(), any());
    }

    @Test
    @DisplayName("REGRESSION: spending tips must return locked response when AI access is blocked")
    void spendingTips_returnsLockedResponseWhenBlocked() {
        ProfileEntity profile = ProfileEntity.builder().id(2L).build();
        SpendingTipsService service = new SpendingTipsService(
                profileService,
                expenseService,
                gptOssService,
                spendingTipsRepository,
                subscriptionService,
                aiViolationService
        );

        when(profileService.getCurrentProfile()).thenReturn(profile);
        when(aiViolationService.isAiBlocked(profile)).thenReturn(true);

        SpendingTipsResponseDTO response = service.generateSmartTips();

        assertTrue(response.getTips().get(0).contains("không khả dụng"));
        assertTrue(response.getDisclaimer().contains("bị khóa"));
        verify(gptOssService, never()).callWithPrompt(any(), any(), anyInt());
    }

    @Test
    @DisplayName("REGRESSION: forecast AI insight must throw forbidden when AI access is blocked")
    void forecastInsight_throwsWhenBlocked() {
        ForecastService service = new ForecastService(
                expenseRepository,
                profileService,
                gptOssService,
                aiViolationService
        );
        ProfileEntity profile = ProfileEntity.builder().id(3L).build();

        when(profileService.getCurrentProfile()).thenReturn(profile);
        when(aiViolationService.isAiBlocked(profile)).thenReturn(true);

        ForbiddenException exception = assertThrows(
                ForbiddenException.class,
                () -> service.analyzeForecastWithAi(null)
        );

        assertTrue(exception.getMessage().contains("dự báo"));
    }

    @Test
    @DisplayName("REGRESSION: monthly report AI analysis must throw forbidden when AI access is blocked")
    void monthlyReportAi_throwsWhenBlocked() {
        MonthlyReportCardService service = new MonthlyReportCardService(
                profileService,
                expenseRepository,
                incomeRepository,
                budgetRepository,
                savingGoalRepository,
                savingGoalContributionRepository,
                subscriptionService,
                gptOssService,
                aiViolationService
        );
        ProfileEntity profile = ProfileEntity.builder().id(4L).build();

        when(profileService.getCurrentProfile()).thenReturn(profile);
        when(aiViolationService.isAiBlocked(profile)).thenReturn(true);

        ForbiddenException exception = assertThrows(
                ForbiddenException.class,
                () -> service.analyzeReportWithAi(MonthlyReportAiAnalysisRequestDTO.builder().prompt("test").build())
        );

        assertTrue(exception.getMessage().contains("báo cáo tháng"));
    }

    @Test
    @DisplayName("REGRESSION: receipt analyze must throw forbidden when AI access is blocked")
    void receiptAnalyze_throwsWhenBlocked() {
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
        ReceiptImportService service = new ReceiptImportService(
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
        ProfileEntity profile = ProfileEntity.builder().id(5L).build();

        when(profileService.getCurrentProfile()).thenReturn(profile);
        when(aiViolationService.isAiBlocked(profile)).thenReturn(true);

        ForbiddenException exception = assertThrows(
                ForbiddenException.class,
                () -> service.analyzeReceipt(new MockMultipartFile("file", "receipt.png", "image/png", new byte[]{1, 2, 3}))
        );

        assertTrue(exception.getMessage().contains("hóa đơn"));
        verify(subscriptionService, never()).ensureCanImportReceipt(any());
    }
}
