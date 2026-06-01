package com.example.moneymanager.controller;

import com.example.moneymanager.dto.*;
import com.example.moneymanager.service.AIChatService;
import com.example.moneymanager.service.AIOrchestrationService;
import com.example.moneymanager.service.CategoryService;
import com.example.moneymanager.service.ChatHistoryService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.service.SavingGoalService;
import com.example.moneymanager.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ai")
public class AIChatController {

    private static final Pattern OBJECT_ID_PATTERN = Pattern.compile("^[a-fA-F0-9]{24}$");

    private final AIChatService aiChatService;
    private final AIOrchestrationService aiOrchestrationService;
    private final CategoryService categoryService;
    private final SavingGoalService savingGoalService;
    private final ChatHistoryService chatHistoryService;
    private final ProfileService profileService;
    private final SubscriptionService subscriptionService;

    private void validateSessionId(String sessionId) {
        if (sessionId == null || !OBJECT_ID_PATTERN.matcher(sessionId).matches()) {
            throw new IllegalArgumentException("sessionId không hợp lệ");
        }
    }

    private void checkAiAccess() {
        subscriptionService.ensureCanUseDetailedAi(profileService.getCurrentProfile());
    }

    @PostMapping("/chat")
    public ResponseEntity<AIChatResponseDTO> chat(@RequestBody AIChatRequestDTO dto) {
        checkAiAccess();
        return ResponseEntity.ok(aiChatService.chat(dto));
    }

    @PostMapping("/parse-intent")
    public ResponseEntity<AIIntentResponseDTO> parseIntent(@RequestBody AIIntentRequestDTO dto) {
        checkAiAccess();
        return ResponseEntity.ok(aiOrchestrationService.parseIntentFromChat(dto));
    }

    @PostMapping("/confirm-action")
    public ResponseEntity<AIConfirmActionResponseDTO> confirmAction(@RequestBody AIConfirmActionRequestDTO dto) {
        checkAiAccess();
        return ResponseEntity.ok(aiOrchestrationService.executeConfirmedIntent(dto));
    }

    @GetMapping("/page-context")
    public ResponseEntity<Map<String, Object>> getPageContext(@RequestParam(defaultValue = "dashboard") String page) {
        checkAiAccess();
        Map<String, Object> context = new HashMap<>();
        context.put("page", page);

        try {
            List<CategoryDTO> categories = categoryService.getCategoriesForCurrentUser();
            context.put("categories", categories);
        } catch (Exception e) {
            context.put("categories", List.of());
        }

        try {
            context.put("savingGoals", savingGoalService.getAllGoals());
        } catch (Exception e) {
            context.put("savingGoals", List.of());
        }

        return ResponseEntity.ok(context);
    }

    @GetMapping("/chat/sessions")
    public ResponseEntity<List<ChatSessionDTO>> getSessions() {
        checkAiAccess();
        Long userId = profileService.getCurrentProfile().getId();
        return ResponseEntity.ok(chatHistoryService.getSessionsByUserId(userId));
    }

    @GetMapping("/chat/sessions/{sessionId}/messages")
    public ResponseEntity<List<Map<String, Object>>> getMessages(@PathVariable String sessionId) {
        validateSessionId(sessionId);
        checkAiAccess();
        Long userId = profileService.getCurrentProfile().getId();
        return ResponseEntity.ok(chatHistoryService.getMessagesBySessionId(sessionId, userId));
    }

    @PutMapping("/chat/sessions/{sessionId}/messages")
    public ResponseEntity<Map<String, Object>> replaceMessages(
            @PathVariable String sessionId,
            @RequestBody AIChatSessionMessagesRequestDTO body
    ) {
        validateSessionId(sessionId);
        checkAiAccess();
        Long userId = profileService.getCurrentProfile().getId();
        chatHistoryService.replaceSessionMessages(sessionId, userId, body.getMessages());
        return ResponseEntity.ok(Map.of("message", "Da cap nhat lich su cuoc tro chuyen"));
    }

    @PutMapping("/chat/sessions/{sessionId}/rename")
    public ResponseEntity<Map<String, Object>> renameSession(@PathVariable String sessionId, @RequestBody Map<String, String> body) {
        validateSessionId(sessionId);
        checkAiAccess();
        Long userId = profileService.getCurrentProfile().getId();
        chatHistoryService.renameSession(sessionId, body.get("title"), userId);
        return ResponseEntity.ok(Map.of("message", "Đã đổi tên cuộc trò chuyện"));
    }

    @DeleteMapping("/chat/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> deleteSession(@PathVariable String sessionId) {
        validateSessionId(sessionId);
        checkAiAccess();
        Long userId = profileService.getCurrentProfile().getId();
        chatHistoryService.deleteSession(sessionId, userId);
        return ResponseEntity.ok(Map.of("message", "Đã xoá cuộc trò chuyện"));
    }
}
