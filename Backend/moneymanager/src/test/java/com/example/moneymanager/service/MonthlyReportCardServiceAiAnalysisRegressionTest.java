package com.example.moneymanager.service;

import com.example.moneymanager.dto.MonthlyReportAiAnalysisRequestDTO;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.repository.BudgetRepository;
import com.example.moneymanager.repository.ExpenseRepository;
import com.example.moneymanager.repository.IncomeRepository;
import com.example.moneymanager.repository.SavingGoalContributionRepository;
import com.example.moneymanager.repository.SavingGoalRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonthlyReportCardServiceAiAnalysisRegressionTest {

    @Mock private ProfileService profileService;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private IncomeRepository incomeRepository;
    @Mock private BudgetRepository budgetRepository;
    @Mock private SavingGoalRepository savingGoalRepository;
    @Mock private SavingGoalContributionRepository savingGoalContributionRepository;
    @Mock private SubscriptionService subscriptionService;
    @Mock private GptOssService gptOssService;

    @InjectMocks
    private MonthlyReportCardService monthlyReportCardService;

    @Test
    @DisplayName("REGRESSION: monthly report AI analysis must use GptOssService directly")
    void analyzeReportWithAi_routesDirectlyToGptOssService() {
        ProfileEntity premiumProfile = ProfileEntity.builder()
                .id(5L)
                .subscriptionPlan(SubscriptionPlan.PREMIUM)
                .build();
        MonthlyReportAiAnalysisRequestDTO request = MonthlyReportAiAnalysisRequestDTO.builder()
                .prompt("Phân tích hành vi tài chính tháng 5")
                .build();

        when(profileService.getCurrentProfile()).thenReturn(premiumProfile);
        when(gptOssService.callWithPrompt(anyString(), eq("Phân tích hành vi tài chính tháng 5"), eq(450)))
                .thenReturn("AI analysis");

        String result = monthlyReportCardService.analyzeReportWithAi(request);

        assertEquals("AI analysis", result);
        verify(subscriptionService).ensureCanUseDetailedAi(premiumProfile);
        var systemPromptCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(gptOssService).callWithPrompt(systemPromptCaptor.capture(), eq("Phân tích hành vi tài chính tháng 5"), eq(450));
        assertTrue(systemPromptCaptor.getValue().contains("3 bullet"));
        assertTrue(systemPromptCaptor.getValue().contains("90-140"));
    }
}
