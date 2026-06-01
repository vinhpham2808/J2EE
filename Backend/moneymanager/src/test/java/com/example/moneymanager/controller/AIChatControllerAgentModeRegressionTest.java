package com.example.moneymanager.controller;

import com.example.moneymanager.dto.AIChatRequestDTO;
import com.example.moneymanager.dto.AIChatResponseDTO;
import com.example.moneymanager.dto.AIConfirmActionRequestDTO;
import com.example.moneymanager.dto.AIConfirmActionResponseDTO;
import com.example.moneymanager.dto.AIIntentRequestDTO;
import com.example.moneymanager.dto.AIIntentResponseDTO;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.service.AIChatService;
import com.example.moneymanager.service.AIOrchestrationService;
import com.example.moneymanager.service.CategoryService;
import com.example.moneymanager.service.ChatHistoryService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.service.SavingGoalService;
import com.example.moneymanager.service.SubscriptionService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AIChatControllerAgentModeRegressionTest {

    @Mock private AIChatService aiChatService;
    @Mock private AIOrchestrationService aiOrchestrationService;
    @Mock private CategoryService categoryService;
    @Mock private SavingGoalService savingGoalService;
    @Mock private ChatHistoryService chatHistoryService;
    @Mock private ProfileService profileService;
    @Mock private SubscriptionService subscriptionService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                new AIChatController(
                        aiChatService,
                        aiOrchestrationService,
                        categoryService,
                        savingGoalService,
                        chatHistoryService,
                        profileService,
                        subscriptionService
                )
        ).build();

        when(profileService.getCurrentProfile()).thenReturn(ProfileEntity.builder().id(7L).build());
    }

    @Test
    @DisplayName("REGRESSION: POST /ai/chat must delegate to AI chat service for agent-mode screen")
    void postChat_returnsAiReply() throws Exception {
        when(aiChatService.chat(any(AIChatRequestDTO.class))).thenReturn(
                AIChatResponseDTO.builder()
                        .reply("Nova da tra loi")
                        .provider("gptoss")
                        .modelUsed("gpt-oss-120b")
                        .sessionId("chat-session")
                        .build()
        );

        mockMvc.perform(post("/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "provider": "gptoss",
                                  "model": "gpt-oss-120b",
                                  "messages": [
                                    {"role": "user", "content": "phan tich chi tieu thang nay"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Nova da tra loi"))
                .andExpect(jsonPath("$.provider").value("gptoss"))
                .andExpect(jsonPath("$.modelUsed").value("gpt-oss-120b"));

        verify(subscriptionService).ensureCanUseDetailedAi(any(ProfileEntity.class));
        verify(aiChatService).chat(any(AIChatRequestDTO.class));
    }

    @Test
    @DisplayName("REGRESSION: POST /ai/parse-intent must return agent intent payload")
    void postParseIntent_returnsAgentIntentResponse() throws Exception {
        when(aiOrchestrationService.parseIntentFromChat(any(AIIntentRequestDTO.class))).thenReturn(
                AIIntentResponseDTO.builder()
                        .status("NEED_CONFIRMATION")
                        .intent("CREATE_EXPENSE")
                        .intentType("ACTION")
                        .confidence(0.93)
                        .build()
        );

        mockMvc.perform(post("/ai/parse-intent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "provider": "gemini",
                                  "model": "gemini-3.1-flash-lite",
                                  "pageContext": "aiChat",
                                  "userMessage": "Them chi tieu an trua 75k hom nay"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEED_CONFIRMATION"))
                .andExpect(jsonPath("$.intent").value("CREATE_EXPENSE"))
                .andExpect(jsonPath("$.intentType").value("ACTION"))
                .andExpect(jsonPath("$.confidence").value(0.93));

        verify(subscriptionService).ensureCanUseDetailedAi(any(ProfileEntity.class));
        verify(aiOrchestrationService).parseIntentFromChat(any(AIIntentRequestDTO.class));
    }

    @Test
    @DisplayName("REGRESSION: POST /ai/confirm-action must return backend execution result")
    void postConfirmAction_returnsExecutionResponse() throws Exception {
        when(aiOrchestrationService.executeConfirmedIntent(any(AIConfirmActionRequestDTO.class))).thenReturn(
                AIConfirmActionResponseDTO.builder()
                        .status("SUCCESS")
                        .message("Da tao chi tieu")
                        .undoable(false)
                        .build()
        );

        mockMvc.perform(post("/ai/confirm-action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "intent": "CREATE_EXPENSE",
                                  "sessionId": "session-confirm",
                                  "extractedData": {
                                    "amount": 75000,
                                    "categoryName": "An uong",
                                    "date": "2026-05-30"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.message").value("Da tao chi tieu"))
                .andExpect(jsonPath("$.undoable").value(false));

        verify(subscriptionService).ensureCanUseDetailedAi(any(ProfileEntity.class));
        verify(aiOrchestrationService).executeConfirmedIntent(any(AIConfirmActionRequestDTO.class));
    }

    @Test
    @DisplayName("REGRESSION: PUT /ai/chat/sessions/{sessionId}/messages must replace stored session history")
    void putReplaceMessages_updatesStoredSessionHistory() throws Exception {
        mockMvc.perform(put("/ai/chat/sessions/507f1f77bcf86cd799439011/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "messages": [
                                    {"role": "user", "content": "sua lai cau hoi"},
                                    {"role": "assistant", "content": "phan hoi moi"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Da cap nhat lich su cuoc tro chuyen"));

        verify(subscriptionService).ensureCanUseDetailedAi(any(ProfileEntity.class));
        verify(chatHistoryService).replaceSessionMessages(
                eq("507f1f77bcf86cd799439011"),
                eq(7L),
                any()
        );
    }
}
