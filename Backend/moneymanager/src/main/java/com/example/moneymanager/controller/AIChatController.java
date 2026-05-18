package com.example.moneymanager.controller;

import com.example.moneymanager.dto.*;
import com.example.moneymanager.service.AIChatService;
import com.example.moneymanager.service.AIOrchestrationService;
import com.example.moneymanager.service.AIRateLimitService;
import com.example.moneymanager.service.CategoryService;
import com.example.moneymanager.service.SavingGoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ai")
public class AIChatController {

    private final AIChatService aiChatService;
    private final AIOrchestrationService aiOrchestrationService;
    private final CategoryService categoryService;
    private final SavingGoalService savingGoalService;
    private final AIRateLimitService aiRateLimitService;

    @PostMapping("/chat")
    public ResponseEntity<AIChatResponseDTO> chat(@RequestBody AIChatRequestDTO dto) {
        aiRateLimitService.checkLimit("CHAT");
        return ResponseEntity.ok(aiChatService.chat(dto));
    }

    @PostMapping("/parse-intent")
    public ResponseEntity<AIIntentResponseDTO> parseIntent(@RequestBody AIIntentRequestDTO dto) {
        aiRateLimitService.checkLimit("AGENT");
        return ResponseEntity.ok(aiOrchestrationService.parseIntentFromChat(dto));
    }

    @PostMapping("/confirm-action")
    public ResponseEntity<AIConfirmActionResponseDTO> confirmAction(@RequestBody AIConfirmActionRequestDTO dto) {
        return ResponseEntity.ok(aiOrchestrationService.executeConfirmedIntent(dto));
    }

    @GetMapping("/page-context")
    public ResponseEntity<Map<String, Object>> getPageContext(@RequestParam(defaultValue = "dashboard") String page) {
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
}
