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

    private static final int MAX_ATTEMPTS = 3;
    private static final long BASE_RETRY_DELAY_MS = 400L;

    private final RestClient gptOssRestClient;
    private final GptOssProperties gptOssProperties;
    private final GptOssKeyRotator gptOssKeyRotator;
    private final ObjectMapper objectMapper;

    private String apiKey() {
        if (!gptOssKeyRotator.hasKeys()) {
            throw new RuntimeException("GPT-OSS chưa được cấu hình API key.");
        }
        return gptOssKeyRotator.nextKey();
    }

    public String callWithPrompt(String systemPrompt, String userMessage, int maxTokens) {
        RuntimeException lastFailure = null;

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                return callWithPromptOnce(systemPrompt, userMessage, maxTokens, attempt);
            } catch (RuntimeException exception) {
                lastFailure = exception;
                boolean shouldRetry = attempt < MAX_ATTEMPTS && isRetryable(exception);
                if (!shouldRetry) {
                    break;
                }

                long delayMs = BASE_RETRY_DELAY_MS * attempt;
                log.warn("GPT-OSS transient failure on attempt {}/{}. Retrying in {} ms. Cause: {}",
                        attempt, MAX_ATTEMPTS, delayMs, exception.getMessage());
                sleepBeforeRetry(delayMs);
            }
        }

        throw new RuntimeException("Không thể gọi GPT-OSS API ổn định sau nhiều lần thử. "
                + (lastFailure != null ? lastFailure.getMessage() : "Vui lòng thử lại sau."));
    }

    private String callWithPromptOnce(String systemPrompt, String userMessage, int maxTokens, int attempt) {
        try {
            String apiKey = apiKey();

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", gptOssProperties.model());
            requestBody.put("stream", false);

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
            log.debug("GPT-OSS callWithPrompt attempt {} request: {}", attempt, requestJson);

            String rawResponse = gptOssRestClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/chat/completions").build())
                    .header("Authorization", "Bearer " + apiKey())
                    .body(requestJson)
                    .retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                        String errorBody = "";
                        try {
                            errorBody = new String(res.getBody().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                        } catch (Exception ignored) {
                        }
                        log.error("GPT-OSS HTTP error {}: {}", res.getStatusCode().value(), errorBody);
                        throw new RuntimeException("GPT-OSS API HTTP " + res.getStatusCode().value() + ": " + errorBody);
                    })
                    .body(String.class);

            if (rawResponse == null || rawResponse.isBlank()) {
                log.error("GPT-OSS callWithPrompt returned null/empty");
                throw new RuntimeException("GPT-OSS API trả về phản hồi rỗng.");
            }

            log.info("GPT-OSS callWithPrompt attempt {} response (first 500 chars): {}",
                    attempt,
                    rawResponse.length() > 500 ? rawResponse.substring(0, 500) : rawResponse);

            if (OpenRouterResponseParser.isSseFormat(rawResponse)) {
                String sseReply = OpenRouterResponseParser.parseSseStream(rawResponse, objectMapper);
                if (sseReply != null && !sseReply.isBlank()) {
                    return sseReply;
                }
                throw new RuntimeException("GPT-OSS SSE không trả về nội dung hợp lệ.");
            }

            JsonNode root;
            try {
                root = objectMapper.readTree(rawResponse);
            } catch (Exception parseEx) {
                log.error("GPT-OSS JSON parse failed. Raw response: {}", rawResponse, parseEx);
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
                throw new RuntimeException("GPT-OSS API lỗi [" + errorCode + "]: " + errorMsg);
            }

            String reply = OpenRouterResponseParser.extractAssistantText(root);
            if (reply != null && !reply.isBlank()) {
                return reply;
            }

            log.warn("GPT-OSS returned empty content. Full response: {}", root.toString());
            throw new RuntimeException("GPT-OSS không trả về nội dung hợp lệ.");
        } catch (Exception exception) {
            log.error("GPT-OSS call error: {}", exception.getMessage(), exception);
            throw new RuntimeException("Không thể gọi GPT-OSS API: " + exception.getMessage(), exception);
        }
    }

    private boolean isRetryable(RuntimeException exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return true;
        }

        String normalized = message.toLowerCase();
        return normalized.contains("429")
                || normalized.contains("500")
                || normalized.contains("502")
                || normalized.contains("503")
                || normalized.contains("504")
                || normalized.contains("timeout")
                || normalized.contains("timed out")
                || normalized.contains("connection reset")
                || normalized.contains("connection refused")
                || normalized.contains("empty")
                || normalized.contains("rỗng")
                || normalized.contains("overloaded")
                || normalized.contains("rate limit")
                || normalized.contains("temporarily unavailable")
                || normalized.contains("service unavailable")
                || normalized.contains("network");
    }

    private void sleepBeforeRetry(long delayMs) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Retry GPT-OSS bị gián đoạn.", interruptedException);
        }
    }

    public AssistantChatResponseDTO chat(String message) {
        try {
            String reply = callWithPrompt(
                    "Bạn là chuyên gia tài chính AI của Money Manager. Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng, không dùng markdown.",
                    message,
                    800
            );
            return AssistantChatResponseDTO.builder()
                    .reply(reply)
                    .model(gptOssProperties.model())
                    .build();
        } catch (Exception exception) {
            log.error("GPT-OSS chat error: {}", exception.getMessage(), exception);
            return AssistantChatResponseDTO.builder()
                    .reply("Xin lỗi, AI đang bận. Bạn thử lại sau nhé.")
                    .model(gptOssProperties.model())
                    .build();
        }
    }

    public AssistantChatResponseDTO getDashboardInsight(java.util.Map<String, Object> dashboardData, String fullName) {
        String statsInfo = String.format(
                "Thu nhập: %s VND. Chi tiêu: %s VND. Số dư: %s VND. Số mục tiêu tiết kiệm đang chạy: %s. Tổng tiền tiết kiệm: %s VND.",
                dashboardData.get("totalIncome"),
                dashboardData.get("totalExpense"),
                dashboardData.get("totalBalance"),
                dashboardData.get("savingGoalActiveCount"),
                dashboardData.get("savingGoalTotalSaved")
        );

        String systemPrompt = "Bạn là chuyên gia tài chính AI của Money Manager. Dựa vào số liệu tháng này của " + fullName + ":\n" +
                statsInfo + "\n" +
                "Nhiệm vụ: Đưa ra đúng 1 câu dự đoán rủi ro/xu hướng và 1 câu khuyên hành động thực tế.\n" +
                "Quy tắc: Trả lời tối đa 40 chữ. Không dùng markdown, không dùng ký tự đặc biệt. Nói thẳng vấn đề.";

        try {
            String reply = callWithPrompt(systemPrompt, "Hãy phân tích nhanh số liệu và cho tôi dự đoán.", 256);
            return AssistantChatResponseDTO.builder()
                    .reply(reply)
                    .model(gptOssProperties.model())
                    .build();
        } catch (Exception exception) {
            log.error("GPT-OSS dashboard insight error: {}", exception.getMessage(), exception);
            return AssistantChatResponseDTO.builder()
                    .reply("AI đang cập nhật, vui lòng thử lại sau.")
                    .model(gptOssProperties.model())
                    .build();
        }
    }
}
