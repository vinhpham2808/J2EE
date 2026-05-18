package com.example.moneymanager.service;

import com.example.moneymanager.config.GptOssKeyRotator;
import com.example.moneymanager.config.GptOssProperties;
import com.example.moneymanager.dto.AIChatMessageDTO;
import com.example.moneymanager.dto.AIChatRequestDTO;
import com.example.moneymanager.dto.AIChatResponseDTO;
import com.example.moneymanager.util.OpenRouterResponseParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIChatService {

    private static final String SYSTEM_PROMPT =
            "B\u1EA1n l\u00E0 Nova \u2014 tr\u1EE3 l\u00FD AI \u0111\u1ED3ng h\u00E0nh c\u1EE7a Money Manager.\n" +
            "H\u1ED7 tr\u1EE3: t\u00E0i ch\u00EDnh c\u00E1 nh\u00E2n, t\u00E2m l\u00FD chi ti\u00EAu, h\u1ED7 tr\u1EE3 c\u1EA3m x\u00FAc/stress, l\u1EDDi khuy\u00EAn cu\u1ED9c s\u1ED1ng, h\u01B0\u1EDBng d\u1EABn app.\n" +
            "T\u1EEB ch\u1ED1i l\u1ECBch s\u1EF1: ch\u00EDnh tr\u1ECB, ch\u1EA9n \u0111o\u00E1n y t\u1EBF, t\u01B0 v\u1EA5n ph\u00E1p l\u00FD c\u1EE5 th\u1EC3.\n" +
            "Phong c\u00E1ch: ti\u1EBFng Vi\u1EC7t, th\u00E2n thi\u1EC7n, kh\u00F4ng ph\u00E1n x\u00E9t, kh\u00F4ng d\u00F9ng markdown (**, #, `).\n" +
            "T\u1ED1i \u0111a 200 ch\u1EEF tr\u1EEB khi \u0111\u01B0\u1EE3c y\u00EAu c\u1EA7u gi\u1EA3i th\u00EDch d\u00E0i h\u01A1n.";

    private static final int MAX_HISTORY_TURNS = 20;

    private final GeminiService geminiService;
    private final RestClient gptOssRestClient;
    private final GptOssProperties gptOssProperties;
    private final GptOssKeyRotator gptOssKeyRotator;
    private final ObjectMapper objectMapper;

    public AIChatResponseDTO chat(AIChatRequestDTO request) {
        validateRequest(request);
        List<AIChatMessageDTO> trimmedMessages = trimHistory(request.getMessages());

        String provider = request.getProvider();
        if ("gptoss".equalsIgnoreCase(provider)) {
            return chatWithGptOss(trimmedMessages);
        }
        return chatWithGemini(trimmedMessages);
    }

    public String chatWithSystemPrompt(String systemPrompt, AIChatRequestDTO request) {
        validateRequest(request);
        List<AIChatMessageDTO> trimmedMessages = trimHistory(request.getMessages());

        return geminiService.generateMultiTurn(systemPrompt, trimmedMessages, 1024);
    }

    private void validateRequest(AIChatRequestDTO request) {
        if (request == null) {
            throw new RuntimeException("Y\u00EAu c\u1EA7u kh\u00F4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
        }
        if (request.getMessages() == null || request.getMessages().isEmpty()) {
            throw new RuntimeException("Danh s\u00E1ch tin nh\u1EAFn kh\u00F4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
        }
        AIChatMessageDTO lastMessage = request.getMessages().get(request.getMessages().size() - 1);
        if (!"user".equals(lastMessage.getRole())) {
            throw new RuntimeException("Tin nh\u1EAFn cu\u1ED1i c\u00F9ng ph\u1EA3i c\u00F3 role=user.");
        }
    }

    private List<AIChatMessageDTO> trimHistory(List<AIChatMessageDTO> messages) {
        int size = messages.size();
        if (size <= MAX_HISTORY_TURNS) {
            return messages;
        }
        return messages.subList(size - MAX_HISTORY_TURNS, size);
    }

    private AIChatResponseDTO chatWithGemini(List<AIChatMessageDTO> messages) {
        try {
            String reply = geminiService.generateMultiTurn(SYSTEM_PROMPT, messages, 1024);
            return AIChatResponseDTO.builder()
                    .reply(reply)
                    .provider("gemini")
                    .modelUsed("gemini-2.5-flash")
                    .build();
        } catch (Exception e) {
            log.error("Gemini chat error: {}", e.getMessage(), e);
            return AIChatResponseDTO.builder()
                    .reply("Xin l\u1ED7i, t\u00F4i \u0111ang g\u1EB7p s\u1EF1 c\u1ED1. B\u1EA1n th\u1EED l\u1EA1i sau nh\u00E9.")
                    .provider("gemini")
                    .modelUsed("gemini-2.5-flash")
                    .build();
        }
    }

    private AIChatResponseDTO chatWithGptOss(List<AIChatMessageDTO> messages) {
        if (!gptOssKeyRotator.hasKeys()) {
            return AIChatResponseDTO.builder()
                    .reply("GPT-OSS ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\u00ECnh. Vui l\u00F2ng d\u00F9ng Gemini ho\u1EB7c li\u00EAn h\u1EC7 qu\u1EA3n tr\u1ECB vi\u00EAn.")
                    .provider("gptoss")
                    .modelUsed(gptOssProperties.model())
                    .build();
        }
        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", gptOssProperties.model());

            ArrayNode msgArray = objectMapper.createArrayNode();
            ObjectNode systemMsg = objectMapper.createObjectNode();
            systemMsg.put("role", "system");
            systemMsg.put("content", SYSTEM_PROMPT);
            msgArray.add(systemMsg);

            for (AIChatMessageDTO msg : messages) {
                ObjectNode msgNode = objectMapper.createObjectNode();
                msgNode.put("role", msg.getRole());
                msgNode.put("content", msg.getContent());
                msgArray.add(msgNode);
            }
            requestBody.set("messages", msgArray);

            String requestJson = objectMapper.writeValueAsString(requestBody);
            log.debug("GPT-OSS request body: {}", requestJson);

            // Read raw string first to avoid deserialization issues
            String rawResponse = gptOssRestClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + gptOssKeyRotator.nextKey())
                    .body(requestJson)
                    .retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                        String errorBody = "";
                        try { errorBody = new String(res.getBody().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8); } catch (Exception ignored) {}
                        log.error("GPT-OSS HTTP error {}: {}", res.getStatusCode().value(), errorBody);
                        throw new RuntimeException("GPT-OSS API HTTP " + res.getStatusCode().value() + ": " + errorBody);
                    })
                    .body(String.class);

            if (rawResponse == null || rawResponse.isBlank()) {
                log.error("GPT-OSS returned null/empty response body");
                return AIChatResponseDTO.builder()
                        .reply("Xin l\u1ED7i, d\u1ECBch v\u1EE5 AI \u0111ang b\u1EADn. B\u1EA1n th\u1EED l\u1EA1i sau nh\u00E9.")
                        .provider("gptoss")
                        .modelUsed(gptOssProperties.model())
                        .build();
            }
            log.info("GPT-OSS raw response (first 500 chars): {}", rawResponse.length() > 500 ? rawResponse.substring(0, 500) : rawResponse);

            JsonNode root;
            try {
                root = objectMapper.readTree(rawResponse);
            } catch (Exception parseEx) {
                log.error("GPT-OSS JSON parse failed. Raw response: {}", rawResponse, parseEx);
                // If raw response looks like plain text, return it directly
                String cleaned = rawResponse.trim();
                if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
                    return AIChatResponseDTO.builder()
                            .reply(cleaned)
                            .provider("gptoss")
                            .modelUsed(gptOssProperties.model())
                            .build();
                }
                throw parseEx;
            }

            JsonNode errorNode = root.get("error");
            if (errorNode != null && !errorNode.isNull()) {
                String errorMsg = errorNode.has("message") ? errorNode.get("message").asText() : errorNode.asText();
                String errorCode = errorNode.has("code") ? errorNode.get("code").asText() : "unknown";
                log.error("GPT-OSS API error [code={}]: {}", errorCode, errorMsg);
                return AIChatResponseDTO.builder()
                        .reply("Xin l\u1ED7i, d\u1ECBch v\u1EE5 AI \u0111ang b\u1EADn. B\u1EA1n th\u1EED l\u1EA1i sau nh\u00E9.")
                        .provider("gptoss")
                        .modelUsed(gptOssProperties.model())
                        .build();
            }

            String reply = OpenRouterResponseParser.extractAssistantText(root);

            if (reply == null || reply.isBlank()) {
                log.warn("GPT-OSS returned empty content. Full response: {}", root.toString());
                reply = "T\u00F4i \u0111\u00E3 nh\u1EADn c\u00E2u h\u1ECFi nh\u01B0ng ch\u01B0a t\u1EA1o \u0111\u01B0\u1EE3c c\u00E2u tr\u1EA3 l\u1EDDi ph\u00F9 h\u1EE3p.";
            }

            return AIChatResponseDTO.builder()
                    .reply(reply)
                    .provider("gptoss")
                    .modelUsed(gptOssProperties.model())
                    .build();
        } catch (Exception e) {
            log.error("GPT-OSS chat error: {}", e.getMessage(), e);
            return AIChatResponseDTO.builder()
                    .reply("Xin l\u1ED7i, t\u00F4i \u0111ang g\u1EB7p s\u1EF1 c\u1ED1 v\u1EDBi GPT-OSS. B\u1EA1n th\u1EED l\u1EA1i sau nh\u00E9.")
                    .provider("gptoss")
                    .modelUsed(gptOssProperties.model())
                    .build();
        }
    }
}
