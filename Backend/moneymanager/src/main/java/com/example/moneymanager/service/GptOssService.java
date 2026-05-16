package com.example.moneymanager.service;

import com.example.moneymanager.config.GptOssKeyRotator;
import com.example.moneymanager.config.GptOssProperties;
import com.example.moneymanager.dto.AssistantChatResponseDTO;
import com.example.moneymanager.util.OpenRouterResponseParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class GptOssService {

    private final RestClient gptOssRestClient;
    private final GptOssProperties gptOssProperties;
    private final GptOssKeyRotator gptOssKeyRotator;
    private final ObjectMapper objectMapper;

    public String callWithPrompt(String systemPrompt, String userMessage, int maxTokens) {
        if (!gptOssKeyRotator.hasKeys()) {
            throw new RuntimeException("GPT-OSS ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\u00ECnh API key.");
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", gptOssProperties.model());

            ArrayNode msgArray = objectMapper.createArrayNode();
            ObjectNode sysMsg = objectMapper.createObjectNode();
            sysMsg.put("role", "system");
            sysMsg.put("content", systemPrompt);
            msgArray.add(sysMsg);

            ObjectNode userMsg = objectMapper.createObjectNode();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);
            msgArray.add(userMsg);

            requestBody.set("messages", msgArray);
            requestBody.put("temperature", 0.4);
            if (maxTokens > 0) {
                requestBody.put("max_tokens", maxTokens);
            }

            String requestJson = objectMapper.writeValueAsString(requestBody);
            log.debug("GPT-OSS callWithPrompt request: {}", requestJson);

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
                log.error("GPT-OSS callWithPrompt returned null/empty");
                throw new RuntimeException("GPT-OSS API trả về phản hồi rỗng.");
            }

            log.info("GPT-OSS callWithPrompt response (first 500 chars): {}", rawResponse.length() > 500 ? rawResponse.substring(0, 500) : rawResponse);

            JsonNode root;
            try {
                root = objectMapper.readTree(rawResponse);
            } catch (Exception parseEx) {
                log.error("GPT-OSS JSON parse failed. Raw response: {}", rawResponse, parseEx);
                // If it looks like plain text, return it directly
                String cleaned = rawResponse.trim();
                if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
                    return cleaned;
                }
                throw parseEx;
            }

            JsonNode errorNode = root.get("error");
            if (errorNode != null && !errorNode.isNull()) {
                String errorMsg = errorNode.has("message") ? errorNode.get("message").asText() : errorNode.asText();
                String errorCode = errorNode.has("code") ? errorNode.get("code").asText() : "unknown";
                log.error("GPT-OSS API error [code={}]: {}", errorCode, errorMsg);
                throw new RuntimeException("GPT-OSS API l\u1ED7i: " + errorMsg);
            }

            String reply = OpenRouterResponseParser.extractAssistantText(root);
            if (reply != null && !reply.isBlank()) {
                return reply;
            }

            log.warn("GPT-OSS returned empty content. Full response: {}", root.toString());
            throw new RuntimeException("GPT-OSS kh\u00F4ng tr\u1EA3 v\u1EC1 n\u1ED9i dung h\u1EE3p l\u1EC7.");
        } catch (Exception e) {
            log.error("GPT-OSS call error: {}", e.getMessage(), e);
            throw new RuntimeException("Kh\u00F4ng th\u1EC3 g\u1ECDi GPT-OSS API: " + e.getMessage(), e);
        }
    }

    public AssistantChatResponseDTO chat(String message) {
        try {
            String reply = callWithPrompt(
                    "B\u1EA1n l\u00E0 chuy\u00EAn gia t\u00E0i ch\u00EDnh AI c\u1EE7a Money Manager. Tr\u1EA3 l\u1EDDi b\u1EB1ng ti\u1EBFng Vi\u1EC7t, ng\u1EAFn g\u1ECDn, r\u00F5 r\u00E0ng, kh\u00F4ng d\u00F9ng markdown.",
                    message,
                    800
            );
            return AssistantChatResponseDTO.builder()
                    .reply(reply)
                    .model(gptOssProperties.model())
                    .build();
        } catch (Exception e) {
            log.error("GPT-OSS chat error: {}", e.getMessage(), e);
            return AssistantChatResponseDTO.builder()
                    .reply("Xin l\u1ED7i, AI \u0111ang b\u1EADn. B\u1EA1n th\u1EED l\u1EA1i sau nh\u00E9.")
                    .model(gptOssProperties.model())
                    .build();
        }
    }

    public AssistantChatResponseDTO getDashboardInsight(java.util.Map<String, Object> dashboardData, String fullName) {
        String statsInfo = String.format(
                "Thu nh\u1EADp: %s VND. Chi ti\u00EAu: %s VND. S\u1ED1 d\u01B0: %s VND. S\u1ED1 m\u1EE5c ti\u00EAu ti\u1EBFt ki\u1EC7m \u0111ang ch\u1EA1y: %s. T\u1ED5ng ti\u1EC1n ti\u1EBFt ki\u1EC7m: %s VND.",
                dashboardData.get("totalIncome"),
                dashboardData.get("totalExpense"),
                dashboardData.get("totalBalance"),
                dashboardData.get("savingGoalActiveCount"),
                dashboardData.get("savingGoalTotalSaved")
        );

        String systemPrompt = "B\u1EA1n l\u00E0 chuy\u00EAn gia t\u00E0i ch\u00EDnh AI c\u1EE7a Money Manager. D\u1EF1a v\u00E0o s\u1ED1 li\u1EC7u th\u00E1ng n\u00E0y c\u1EE7a " + fullName + ":\n" +
                statsInfo + "\n" +
                "Nhi\u1EC7m v\u1EE5: \u0110\u01B0a ra \u0111\u00FAng 1 c\u00E2u d\u1EF1 \u0111o\u00E1n r\u1EE7i ro/xu h\u01B0\u1EDBng v\u00E0 1 c\u00E2u khuy\u00EAn h\u00E0nh \u0111\u1ED9ng th\u1EF1c t\u1EBF.\n" +
                "Quy t\u1EAFc: Tr\u1EA3 l\u1EDDi t\u1ED1i \u0111a 40 ch\u1EEF. Kh\u00F4ng d\u00F9ng markdown, kh\u00F4ng d\u00F9ng k\u00FD t\u1EF1 \u0111\u1EB7c bi\u1EC7t. N\u00F3i th\u1EB3ng v\u1EA5n \u0111\u1EC1.";

        try {
            String reply = callWithPrompt(systemPrompt, "H\u00E3y ph\u00E2n t\u00EDch nhanh s\u1ED1 li\u1EC7u v\u00E0 cho t\u00F4i d\u1EF1 \u0111o\u00E1n.", 256);
            return AssistantChatResponseDTO.builder()
                    .reply(reply)
                    .model(gptOssProperties.model())
                    .build();
        } catch (Exception e) {
            log.error("GPT-OSS dashboard insight error: {}", e.getMessage(), e);
            return AssistantChatResponseDTO.builder()
                    .reply("AI \u0111ang c\u1EADp nh\u1EADt, vui l\u00F2ng th\u1EED l\u1EA1i sau.")
                    .model(gptOssProperties.model())
                    .build();
        }
    }
}
