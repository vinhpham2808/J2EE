package com.example.moneymanager.controller;

import com.example.moneymanager.dto.AssistantChatRequestDTO;
import com.example.moneymanager.dto.AssistantChatResponseDTO;
import com.example.moneymanager.dto.VoiceParseResponseDTO;
import com.example.moneymanager.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/gemini")
public class GeminiController {

    private final GeminiService geminiService;

    @GetMapping("/test")
    public ResponseEntity<AssistantChatResponseDTO> testGemini(
            @RequestParam(required = false) String message
    ) {
        return ResponseEntity.ok(geminiService.testConnection(message));
    }

    @PostMapping("/chat")
    public ResponseEntity<AssistantChatResponseDTO> chat(
            @RequestBody AssistantChatRequestDTO requestDTO
    ) {
        return ResponseEntity.ok(geminiService.chat(requestDTO.getMessage()));
    }

    @PostMapping("/voice-parse")
    public ResponseEntity<VoiceParseResponseDTO> parseVoice(
            @RequestBody Map<String, String> request
    ) {
        String text = request.get("text");
        return ResponseEntity.ok(geminiService.parseVoiceCommand(text));
    }
}
