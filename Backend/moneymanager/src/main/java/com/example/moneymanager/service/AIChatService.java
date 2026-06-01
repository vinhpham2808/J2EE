package com.example.moneymanager.service;

import com.example.moneymanager.config.GeminiProperties;
import com.example.moneymanager.config.GptOssKeyRotator;
import com.example.moneymanager.config.GptOssProperties;
import com.example.moneymanager.dto.AIChatMessageDTO;
import com.example.moneymanager.dto.AIChatRequestDTO;
import com.example.moneymanager.dto.AIChatResponseDTO;
import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.exception.ForbiddenException;
import com.example.moneymanager.service.SubscriptionService;
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
            "B\u1EA1n l\u00E0 Nova \u2014 tr\u1EE3 l\u00FD AI \u0111\u1ED3ng h\u00E0nh th\u00E2n thi\u1EBFt c\u1EE7a Money Manager.\n" +
            "H\u1ED7 tr\u1EE3: t\u00E0i ch\u00EDnh c\u00E1 nh\u00E2n, t\u00E2m l\u00FD chi ti\u00EAu, h\u1ED7 tr\u1EE3 c\u1EA3m x\u00FAc/stress, l\u1EDDi khuy\u00EAn cu\u1ED9c s\u1ED1ng, h\u01B0\u1EDBng d\u1EABn app.\n" +
            "T\u1EEB ch\u1ED1i l\u1ECBch s\u1EF1: ch\u00EDnh tr\u1ECB, ch\u1EA9n \u0111o\u00E1n y t\u1EBF, t\u01B0 v\u1EA5n ph\u00E1p l\u00FD c\u1EE5 th\u1EC3 \u2014 khi t\u1EEB ch\u1ED1i, lu\u00F4n c\u1EA3m \u01A1n ng\u01B0\u1EDDi d\u00F9ng v\u00E0 g\u1EE3i \u00FD h\u01B0\u1EDBng gi\u1EA3i quy\u1EBFt kh\u00E1c.\n" +
            "Phong c\u00E1ch: ti\u1EBFng Vi\u1EC7t, \u1EA5m \u00E1p v\u00E0 quan t\u00E2m, kh\u00F4ng ph\u00E1n x\u00E9t, s\u1EED d\u1EE5ng markdown \u0111\u1EA7y \u0111\u1EE7 (danh s\u00E1ch g\u1EA1ch \u0111\u1EA7u d\u00F2ng, in \u0111\u1EADm, ti\u00EAu \u0111\u1EC1 nh\u1ECF, b\u1EA3ng, code block khi c\u1EA7n thi\u1EBFt).\n" +
            "Quy t\u1EAFc b\u1EAFt bu\u1ED9c:\n" +
            "- Lu\u00F4n l\u1EAFng nghe v\u00E0 th\u1EEBa nh\u1EADn c\u1EA3m x\u00FAc c\u1EE7a ng\u01B0\u1EDDi d\u00F9ng tr\u01B0\u1EDBc khi \u0111\u01B0a l\u1EDDi khuy\u00EAn.\n" +
            "- KH\u00D4NG bao gi\u1EDD tr\u1EA3 l\u1EDDi c\u1ED9c l\u1ED1c, l\u1EA1nh l\u00F9ng hay thi\u1EBFu ki\u00EAn nh\u1EABn.\n" +
            "- D\u00F9ng ng\u00F4n ng\u1EEF g\u1EA7n g\u0169i (b\u1EA1n/m\u00ECnh), khuy\u1EBFn kh\u00EDch v\u00E0 \u0111\u1ED9ng vi\u00EAn thay v\u00EC ch\u1EC9 tr\u00EDch.\n" +
            "T\u1ED1i \u0111a 200 ch\u1EEF tr\u1EEB khi ng\u01B0\u1EDDi d\u00F9ng y\u00EAu c\u1EA7u gi\u1EA3i th\u00EDch d\u00E0i h\u01A1n.";
 
    private static final int MAX_HISTORY_TURNS = 20;
 
    private final GeminiService geminiService;
    private final GeminiProperties geminiProperties;
    private final RestClient gptOssRestClient;
    private final GptOssProperties gptOssProperties;
    private final GptOssKeyRotator gptOssKeyRotator;
    private final ProfileService profileService;
    private final ChatHistoryService chatHistoryService;
    private final SubscriptionService subscriptionService;
    private final ObjectMapper objectMapper;
 
    public AIChatResponseDTO chat(AIChatRequestDTO request) {
        validateRequest(request);
        subscriptionService.ensureCanUseDetailedAi(profileService.getCurrentProfile());
        List<AIChatMessageDTO> trimmedMessages = trimHistory(request.getMessages());
 
        String provider = request.getProvider();
        SubscriptionPlan plan = profileService.getCurrentProfile().getSubscriptionPlan();

        // GPT-OSS chat (provider="gptoss") yêu cầu PREMIUM
        // Gemini chat hỗ trợ cả BASIC và PREMIUM
        boolean isGptOssMode = "gptoss".equalsIgnoreCase(provider);
        if (isGptOssMode && plan != SubscriptionPlan.PREMIUM) {
            throw new ForbiddenException("Model GPT-OSS yêu cầu gói PREMIUM. Vui lòng nâng cấp để sử dụng.");
        }

        AIChatResponseDTO response;
        if ("gemini".equalsIgnoreCase(provider)) {
            response = chatWithGemini(trimmedMessages);
        } else {
            try {
                // GPT-OSS với rotate key
                response = chatWithGptOss(trimmedMessages);
                // Nếu GPT-OSS trả về thông báo lỗi hoặc bị bận, ta tự động fallback sang Gemini
                if (shouldFallbackToGemini(response)) {
                    log.warn("[gptoss] Response indicated failure or busy status, falling back to Gemini...");
                    response = chatWithGemini(trimmedMessages);
                }
            } catch (Exception e) {
                log.error("[gptoss] chat error, automatically falling back to Gemini...", e);
                response = chatWithGemini(trimmedMessages);
            }
        }

        if (Boolean.TRUE.equals(request.getSaveHistory())) {
            persistChatHistory(request, response);
        }

        return response;
    }

    private void persistChatHistory(AIChatRequestDTO request, AIChatResponseDTO response) {
        try {
            Long userId = profileService.getCurrentProfile().getId();
            String sessionId = request.getSessionId();

            if (sessionId == null || sessionId.isBlank()) {
                // --- Session mới ---
                List<AIChatMessageDTO> messages = request.getMessages();
                String title = "Cuộc trò chuyện mới";
                if (messages != null && !messages.isEmpty()) {
                    AIChatMessageDTO firstUserMsg = messages.stream()
                            .filter(m -> "user".equals(m.getRole()))
                            .findFirst().orElse(null);
                    if (firstUserMsg != null && firstUserMsg.getContent() != null) {
                        String content = firstUserMsg.getContent().trim();
                        title = content.length() > 50 ? content.substring(0, 50) + "..." : content;
                    }
                }
                var session = chatHistoryService.createSession(userId, title);
                sessionId = session.getId();
                response.setSessionId(sessionId);

                // Lưu toàn bộ history messages trước đó (nếu có) rồi mới lưu assistant reply
                // Bỏ qua message cuối cùng (user message mới nhất) vì sẽ lưu riêng bên dưới
                if (messages != null && messages.size() > 1) {
                    for (int i = 0; i < messages.size() - 1; i++) {
                        AIChatMessageDTO msg = messages.get(i);
                        if (msg.getRole() != null && msg.getContent() != null) {
                            chatHistoryService.addMessage(sessionId, msg.getRole(), msg.getContent());
                        }
                    }
                }
                // Lưu user message mới nhất
                if (messages != null && !messages.isEmpty()) {
                    chatHistoryService.addMessage(sessionId, "user",
                            messages.get(messages.size() - 1).getContent());
                }
            } else {
                // --- Session đã tồn tại --- chỉ lưu user message mới nhất
                var messages = request.getMessages();
                chatHistoryService.addMessage(sessionId, "user",
                        messages.get(messages.size() - 1).getContent());
                response.setSessionId(sessionId);
            }

            chatHistoryService.addMessage(sessionId, "assistant", response.getReply());
        } catch (Exception e) {
            log.warn("Failed to persist chat history: {}", e.getMessage(), e);
        }
    }

    public String chatWithSystemPrompt(String systemPrompt, AIChatRequestDTO request) {
        validateRequest(request);
        subscriptionService.ensureCanUseDetailedAi(profileService.getCurrentProfile());
        List<AIChatMessageDTO> trimmedMessages = trimHistory(request.getMessages());

        String provider = request.getProvider() != null ? request.getProvider() : "gemini";
        SubscriptionPlan plan = profileService.getCurrentProfile().getSubscriptionPlan();

        // Agent intent parsing luôn dùng Gemini
        // Agent yêu cầu gói BASIC trở lên
        if (plan == SubscriptionPlan.FREE) {
            throw new ForbiddenException("Nova Money Agent yêu cầu gói BASIC trở lên.");
        }

        // Tất cả provider đều dùng Gemini cho Agent intent
        return geminiService.generateMultiTurn(systemPrompt, trimmedMessages, 1024, true);
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
                    .modelUsed(geminiProperties.model())
                    .build();
        } catch (Exception e) {
            log.error("Gemini chat error: {}", e.getMessage(), e);
            return AIChatResponseDTO.builder()
                    .reply("Xin l\u1ED7i, t\u00F4i \u0111ang g\u1EB7p s\u1EF1 c\u1ED1. B\u1EA1n th\u1EED l\u1EA1i sau nh\u00E9.")
                    .provider("gemini")
                    .modelUsed(geminiProperties.model())
                    .build();
        }
    }

    private AIChatResponseDTO chatWithGptOss(List<AIChatMessageDTO> messages) {
        if (!gptOssKeyRotator.hasKeys()) {
            return AIChatResponseDTO.builder()
                    .reply("GPT-OSS chưa được cấu hình. Vui lòng liên hệ quản trị viên.")
                    .provider("gptoss")
                    .modelUsed(gptOssProperties.model())
                    .build();
        }
        String apiKey = gptOssKeyRotator.nextKey();
        log.debug("[gptoss] rotate key, total keys={}", gptOssKeyRotator.keyCount());
        return chatWithOpenAICompatible(gptOssRestClient, gptOssProperties.model(),
                apiKey, "gptoss", messages);
    }

    static boolean shouldFallbackToGemini(AIChatResponseDTO response) {
        if (response == null || response.getReply() == null) {
            return true;
        }

        String reply = response.getReply();
        return reply.contains("Xin lỗi, tôi đang gặp sự cố")
                || reply.contains("dịch vụ AI đang bận");
    }
    private AIChatResponseDTO chatWithOpenAICompatible(
            RestClient restClient, String model, String apiKey,
            String provider, List<AIChatMessageDTO> messages) {
        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("stream", false);

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
            log.debug("[{}] request body: {}", provider, requestJson);

            String rawResponse = restClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/chat/completions").build())
                    .header("Authorization", "Bearer " + apiKey)
                    .body(requestJson)
                    .retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                        String errorBody = "";
                        try { errorBody = new String(res.getBody().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8); } catch (Exception ignored) {}
                        log.error("[{}] HTTP error {}: {}", provider, res.getStatusCode().value(), errorBody);
                        throw new RuntimeException(provider + " API HTTP " + res.getStatusCode().value() + ": " + errorBody);
                    })
                    .body(String.class);

            if (rawResponse == null || rawResponse.isBlank()) {
                log.error("[{}] returned null/empty response body", provider);
                return AIChatResponseDTO.builder()
                        .reply("Xin l\u1ED7i, d\u1ECBch v\u1EE5 AI \u0111ang b\u1EADn. B\u1EA1n th\u1EED l\u1EA1i sau nh\u00E9.")
                        .provider(provider)
                        .modelUsed(model)
                        .build();
            }
            log.info("[{}] response (first 500 chars): {}", provider, rawResponse.length() > 500 ? rawResponse.substring(0, 500) : rawResponse);

            if (OpenRouterResponseParser.isSseFormat(rawResponse)) {
                String sseReply = OpenRouterResponseParser.parseSseStream(rawResponse, objectMapper);
                if (sseReply == null || sseReply.isBlank()) {
                    log.warn("[{}] SSE stream returned no content", provider);
                    sseReply = "Tôi đã nhận câu hỏi nhưng chưa tạo được câu trả lời phù hợp.";
                }
                return AIChatResponseDTO.builder()
                        .reply(sseReply)
                        .provider(provider)
                        .modelUsed(model)
                        .build();
            }

            JsonNode root;
            try {
                root = objectMapper.readTree(rawResponse);
            } catch (Exception parseEx) {
                log.error("[{}] JSON parse failed. Raw response: {}", provider, rawResponse, parseEx);
                String cleaned = rawResponse.trim();
                if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
                    return AIChatResponseDTO.builder()
                            .reply(cleaned)
                            .provider(provider)
                            .modelUsed(model)
                            .build();
                }
                throw parseEx;
            }

            JsonNode errorNode = root.get("error");
            if (errorNode != null && !errorNode.isNull()) {
                String errorMsg = errorNode.has("message") ? errorNode.get("message").asText() : errorNode.asText();
                String errorCode = errorNode.has("code") ? errorNode.get("code").asText() : "unknown";
                log.error("[{}] API error [code={}]: {}", provider, errorCode, errorMsg);
                return AIChatResponseDTO.builder()
                        .reply("Xin l\u1ED7i, d\u1ECBch v\u1EE5 AI \u0111ang b\u1EADn. B\u1EA1n th\u1EED l\u1EA1i sau nh\u00E9.")
                        .provider(provider)
                        .modelUsed(model)
                        .build();
            }

            String reply = OpenRouterResponseParser.extractAssistantText(root);

            if (reply == null || reply.isBlank()) {
                log.warn("[{}] returned empty content. Full response: {}", provider, root.toString());
                reply = "T\u00F4i \u0111\u00E3 nh\u1EADn c\u00E2u h\u1ECFi nh\u01B0ng ch\u01B0a t\u1EA1o \u0111\u01B0\u1EE3c c\u00E2u tr\u1EA3 l\u1EDDi ph\u00F9 h\u1EE3p.";
            }

            return AIChatResponseDTO.builder()
                    .reply(reply)
                    .provider(provider)
                    .modelUsed(model)
                    .build();
        } catch (Exception e) {
            log.error("[{}] chat error: {}", provider, e.getMessage(), e);
            return AIChatResponseDTO.builder()
                    .reply("Xin lỗi, tôi đang gặp sự cố. Bạn thử lại sau nhé.")
                    .provider(provider)
                    .modelUsed(model)
                    .build();
        }
    }

    private AIChatResponseDTO chatWithOpenAICompatibleCustomPrompt(
            RestClient restClient, String model, String apiKey,
            String provider, List<AIChatMessageDTO> messages, String customSystemPrompt) {
        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("stream", false);

            ArrayNode msgArray = objectMapper.createArrayNode();
            ObjectNode systemMsg = objectMapper.createObjectNode();
            systemMsg.put("role", "system");
            systemMsg.put("content", customSystemPrompt);
            msgArray.add(systemMsg);

            for (AIChatMessageDTO msg : messages) {
                ObjectNode msgNode = objectMapper.createObjectNode();
                msgNode.put("role", msg.getRole());
                msgNode.put("content", msg.getContent());
                msgArray.add(msgNode);
            }
            requestBody.set("messages", msgArray);

            String requestJson = objectMapper.writeValueAsString(requestBody);
            log.debug("[{}] agent intent request (first 200 chars): {}", provider, requestJson.length() > 200 ? requestJson.substring(0, 200) : requestJson);

            String rawResponse = restClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/chat/completions").build())
                    .header("Authorization", "Bearer " + apiKey)
                    .body(requestJson)
                    .retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                        String errorBody = "";
                        try { errorBody = new String(res.getBody().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8); } catch (Exception ignored) {}
                        log.error("[{}] agent HTTP error {}: {}", provider, res.getStatusCode().value(), errorBody);
                        throw new RuntimeException(provider + " API HTTP " + res.getStatusCode().value() + ": " + errorBody);
                    })
                    .body(String.class);

            if (rawResponse == null || rawResponse.isBlank()) {
                return AIChatResponseDTO.builder()
                        .reply("Xin lỗi, dịch vụ AI đang bận. Bạn thử lại sau nhé.")
                        .provider(provider)
                        .modelUsed(model)
                        .build();
            }
            log.info("[{}] agent response (first 500 chars): {}", provider, rawResponse.length() > 500 ? rawResponse.substring(0, 500) : rawResponse);

            if (OpenRouterResponseParser.isSseFormat(rawResponse)) {
                String sseReply = OpenRouterResponseParser.parseSseStream(rawResponse, objectMapper);
                if (sseReply == null || sseReply.isBlank()) {
                    log.warn("[{}] agent SSE stream returned no content", provider);
                    sseReply = "{}";
                }
                return AIChatResponseDTO.builder()
                        .reply(sseReply)
                        .provider(provider)
                        .modelUsed(model)
                        .build();
            }

            JsonNode root;
            try {
                root = objectMapper.readTree(rawResponse);
            } catch (Exception parseEx) {
                String cleaned = rawResponse.trim();
                if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
                    return AIChatResponseDTO.builder()
                            .reply(cleaned)
                            .provider(provider)
                            .modelUsed(model)
                            .build();
                }
                throw parseEx;
            }

            JsonNode errorNode = root.get("error");
            if (errorNode != null && !errorNode.isNull()) {
                log.error("[{}] agent API error: {}", provider, errorNode.asText());
                return AIChatResponseDTO.builder()
                        .reply("Xin lỗi, dịch vụ AI đang bận. Bạn thử lại sau nhé.")
                        .provider(provider)
                        .modelUsed(model)
                        .build();
            }

            String reply = OpenRouterResponseParser.extractAssistantText(root);
            if (reply == null || reply.isBlank()) {
                reply = "{}";
            }

            return AIChatResponseDTO.builder()
                    .reply(reply)
                    .provider(provider)
                    .modelUsed(model)
                    .build();
        } catch (Exception e) {
            log.error("[{}] agent intent error: {}", provider, e.getMessage(), e);
            return AIChatResponseDTO.builder()
                    .reply("Xin lỗi, tôi đang gặp sự cố. Bạn thử lại sau nhé.")
                    .provider(provider)
                    .modelUsed(model)
                    .build();
        }
    }
}
