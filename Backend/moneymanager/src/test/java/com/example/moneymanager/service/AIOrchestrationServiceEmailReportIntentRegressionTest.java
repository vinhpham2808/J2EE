package com.example.moneymanager.service;

import com.example.moneymanager.config.GeminiProperties;
import com.example.moneymanager.dto.AIChatMessageDTO;
import com.example.moneymanager.dto.AIChatRequestDTO;
import com.example.moneymanager.dto.AIConfirmActionRequestDTO;
import com.example.moneymanager.dto.AIConfirmActionResponseDTO;
import com.example.moneymanager.dto.AIIntentRequestDTO;
import com.example.moneymanager.dto.AIIntentResponseDTO;
import com.example.moneymanager.dto.CategoryDTO;
import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.entity.CategoryEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.model.ChatMessage;
import com.example.moneymanager.repository.BudgetRepository;
import com.example.moneymanager.repository.CategoryRepository;
import com.example.moneymanager.repository.ExpenseRepository;
import com.example.moneymanager.repository.IncomeRepository;
import com.example.moneymanager.repository.JarRepository;
import com.example.moneymanager.repository.ProfileRepository;
import com.example.moneymanager.repository.SavingGoalRepository;
import com.example.moneymanager.util.AIInstructionPromptBuilder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIOrchestrationServiceEmailReportIntentRegressionTest {

    @Mock private AIChatService aiChatService;
    @Mock private GeminiProperties geminiProperties;
    @Mock private ProfileService profileService;
    @Mock private ChatHistoryService chatHistoryService;
    @Mock private ExpenseService expenseService;
    @Mock private IncomeService incomeService;
    @Mock private CategoryService categoryService;
    @Mock private BudgetService budgetService;
    @Mock private SavingGoalService savingGoalService;
    @Mock private JarService jarService;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private IncomeRepository incomeRepository;
    @Mock private BudgetRepository budgetRepository;
    @Mock private SavingGoalRepository savingGoalRepository;
    @Mock private ProfileRepository profileRepository;
    @Mock private JarRepository jarRepository;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AIOrchestrationService aiOrchestrationService;

    @Test
    @DisplayName("REGRESSION: follow-up email request after export history must become EMAIL_EXPENSE_REPORT")
    void parseIntentFromChat_reclassifiesEmailFollowUpFromRecentExportHistory() {
        ProfileEntity basicProfile = ProfileEntity.builder()
                .id(7L)
                .subscriptionPlan(SubscriptionPlan.BASIC)
                .build();

        AIIntentRequestDTO request = AIIntentRequestDTO.builder()
                .provider("gemini")
                .model("gemini-3.1-flash-lite")
                .sessionId("session-1")
                .pageContext("aiChat")
                .userMessage("email luon nhe")
                .conversationHistory(List.of(
                        AIChatMessageDTO.builder().role("user").content("xuat bao cao qua excel cho toi di").build(),
                        AIChatMessageDTO.builder().role("assistant").content("Da xac nhan xuat Excel chi tieu").build()
                ))
                .build();

        stubAiChatBaseContext(basicProfile);
        when(chatHistoryService.addMessage(anyString(), anyString(), anyString()))
                .thenReturn(ChatMessage.builder().id("msg-1").build());
        when(aiChatService.chatWithSystemPrompt(anyString(), any(AIChatRequestDTO.class)))
                .thenReturn("{\"intent\":\"ANSWER_QUESTION\",\"intentType\":\"QUESTION\",\"answer\":\"Minh se ho tro ban.\"}");

        AIIntentResponseDTO response = aiOrchestrationService.parseIntentFromChat(request);

        assertEquals("EMAIL_EXPENSE_REPORT", response.getIntent());
        assertEquals("ACTION", response.getIntentType());
        assertEquals("NEED_CONFIRMATION", response.getStatus());
        assertTrue(response.getMissingFields() == null || response.getMissingFields().isEmpty());
    }

    @Test
    @DisplayName("REGRESSION: export request on aiChat must become EXPORT_EXCEL_EXPENSE when AI falls back to question")
    void parseIntentFromChat_reclassifiesExportRequestOnAiChat() {
        ProfileEntity basicProfile = ProfileEntity.builder()
                .id(7L)
                .subscriptionPlan(SubscriptionPlan.BASIC)
                .build();

        AIIntentRequestDTO request = AIIntentRequestDTO.builder()
                .provider("gemini")
                .model("gemini-3.1-flash-lite")
                .sessionId("session-export")
                .pageContext("aiChat")
                .userMessage("xuat bao cao chi tieu thang nay ra file Excel")
                .build();

        stubAiChatBaseContext(basicProfile);
        when(categoryService.getCategoriesForCurrentUser()).thenReturn(List.of());
        when(chatHistoryService.addMessage(anyString(), anyString(), anyString()))
                .thenReturn(ChatMessage.builder().id("msg-export").build());
        when(aiChatService.chatWithSystemPrompt(anyString(), any(AIChatRequestDTO.class)))
                .thenReturn("{\"intent\":\"ANSWER_QUESTION\",\"intentType\":\"QUESTION\",\"answer\":\"Minh se ho tro ban.\"}");

        AIIntentResponseDTO response = aiOrchestrationService.parseIntentFromChat(request);

        assertEquals("EXPORT_EXCEL_EXPENSE", response.getIntent());
        assertEquals("ACTION", response.getIntentType());
        assertEquals("NEED_CONFIRMATION", response.getStatus());
    }

    @Test
    @DisplayName("REGRESSION: intent prompt must include aiChat shorthand normalization guidance")
    void buildSystemPrompt_includesAiChatPromptGuidance() {
        String prompt = AIInstructionPromptBuilder.buildSystemPrompt("aiChat", Map.of());

        assertTrue(prompt.contains("EMAIL_EXPENSE_REPORT"));
        assertTrue(prompt.contains("75k"));
        assertTrue(prompt.contains("75000"));
        assertTrue(prompt.contains("1.5tr"));
        assertTrue(prompt.contains("1500000"));
    }

    @Test
    @DisplayName("REGRESSION: aiChat context must load categories into the intent prompt")
    void parseIntentFromChat_aiChatPromptIncludesCategories() {
        ProfileEntity basicProfile = ProfileEntity.builder()
                .id(7L)
                .subscriptionPlan(SubscriptionPlan.BASIC)
                .build();

        AIIntentRequestDTO request = AIIntentRequestDTO.builder()
                .provider("gemini")
                .model("gemini-3.1-flash-lite")
                .sessionId("session-2")
                .pageContext("aiChat")
                .userMessage("Them chi tieu an trua 75k hom nay")
                .build();

        stubAiChatBaseContext(basicProfile);
        when(categoryService.getCategoriesForCurrentUser()).thenReturn(List.of(
                CategoryDTO.builder().id(1L).name("An uong").type("expense").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build(),
                CategoryDTO.builder().id(2L).name("Luong").type("income").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build()
        ));
        when(chatHistoryService.addMessage(anyString(), anyString(), anyString()))
                .thenReturn(ChatMessage.builder().id("msg-2").build());
        when(aiChatService.chatWithSystemPrompt(anyString(), any(AIChatRequestDTO.class)))
                .thenReturn("{\"intent\":\"ANSWER_QUESTION\",\"intentType\":\"QUESTION\",\"answer\":\"Minh se ho tro ban.\"}");

        aiOrchestrationService.parseIntentFromChat(request);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiChatService).chatWithSystemPrompt(promptCaptor.capture(), any(AIChatRequestDTO.class));
        String prompt = promptCaptor.getValue();

        assertTrue(prompt.contains("An uong"));
        assertTrue(prompt.contains("Luong"));
        assertTrue(prompt.contains("expense"));
        assertTrue(prompt.contains("income"));
    }

    @Test
    @DisplayName("REGRESSION: aiChat intent request must keep 10 history messages and remind integer amounts")
    void parseIntentFromChat_keepsLongerHistoryAndAddsAmountReminder() {
        ProfileEntity basicProfile = ProfileEntity.builder()
                .id(7L)
                .subscriptionPlan(SubscriptionPlan.BASIC)
                .build();

        List<AIChatMessageDTO> history = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            history.add(AIChatMessageDTO.builder()
                    .role(i % 2 == 0 ? "assistant" : "user")
                    .content("history-" + i)
                    .build());
        }

        AIIntentRequestDTO request = AIIntentRequestDTO.builder()
                .provider("gemini")
                .model("gemini-3.1-flash-lite")
                .sessionId("session-3")
                .pageContext("aiChat")
                .userMessage("Them chi tieu an trua 75k hom nay")
                .conversationHistory(history)
                .build();

        stubAiChatBaseContext(basicProfile);
        when(categoryService.getCategoriesForCurrentUser()).thenReturn(List.of());
        when(chatHistoryService.addMessage(anyString(), anyString(), anyString()))
                .thenReturn(ChatMessage.builder().id("msg-3").build());
        when(aiChatService.chatWithSystemPrompt(anyString(), any(AIChatRequestDTO.class)))
                .thenReturn("{\"intent\":\"ANSWER_QUESTION\",\"intentType\":\"QUESTION\",\"answer\":\"Minh se ho tro ban.\"}");

        aiOrchestrationService.parseIntentFromChat(request);

        ArgumentCaptor<AIChatRequestDTO> chatRequestCaptor = ArgumentCaptor.forClass(AIChatRequestDTO.class);
        verify(aiChatService).chatWithSystemPrompt(anyString(), chatRequestCaptor.capture());
        AIChatRequestDTO chatRequest = chatRequestCaptor.getValue();

        assertEquals(11, chatRequest.getMessages().size());
        assertTrue(chatRequest.getMessages().get(chatRequest.getMessages().size() - 1).getContent().contains("amount/targetAmount/currentAmount"));
        assertTrue(chatRequest.getMessages().get(chatRequest.getMessages().size() - 1).getContent().contains("75000"));
    }

    @Test
    @DisplayName("REGRESSION: confirm action must normalize shorthand amount payloads from agent mode")
    void executeConfirmedIntent_normalizesShorthandAmountPayload() {
        ProfileEntity basicProfile = ProfileEntity.builder()
                .id(7L)
                .subscriptionPlan(SubscriptionPlan.BASIC)
                .build();

        AIConfirmActionRequestDTO request = AIConfirmActionRequestDTO.builder()
                .intent("CREATE_EXPENSE")
                .sessionId("session-confirm")
                .extractedData(Map.of(
                        "amount", "80k",
                        "categoryName", "An uong",
                        "date", "2026-05-30",
                        "description", "An trua"
                ))
                .build();

        when(profileService.getCurrentProfile()).thenReturn(basicProfile);
        when(categoryRepository.findByNameIgnoreCaseAndTypeAndProfileId("An uong", "expense", 7L))
                .thenReturn(Optional.of(CategoryEntity.builder().id(11L).name("An uong").type("expense").build()));
        when(expenseService.addExpense(any(ExpenseDTO.class))).thenReturn(null);

        AIConfirmActionResponseDTO response = aiOrchestrationService.executeConfirmedIntent(request);

        ArgumentCaptor<ExpenseDTO> expenseCaptor = ArgumentCaptor.forClass(ExpenseDTO.class);
        verify(expenseService).addExpense(expenseCaptor.capture());
        ExpenseDTO savedExpense = expenseCaptor.getValue();

        assertEquals("SUCCESS", response.getStatus());
        assertEquals(new BigDecimal("80000"), savedExpense.getAmount());
        assertEquals("An uong", savedExpense.getCategoryName());
    }

    private void stubAiChatBaseContext(ProfileEntity basicProfile) {
        when(profileService.getCurrentProfile()).thenReturn(basicProfile);
        when(geminiProperties.model()).thenReturn("gemini-3.1-flash-lite");
        when(expenseService.getTotalExpenseCountForCurrentUser()).thenReturn(0L);
        when(expenseService.getTotalExpenseForCurrentUser()).thenReturn(BigDecimal.ZERO);
        when(expenseService.getLatest5ExpensesForCurrentUser()).thenReturn(List.of());
        when(incomeService.getTotalIncomeCountForCurrentUser()).thenReturn(0L);
        when(incomeService.getTotalIncomeForCurrentUser()).thenReturn(BigDecimal.ZERO);
        when(incomeService.getLatest5IncomesForCurrentUser()).thenReturn(List.of());
    }
}
