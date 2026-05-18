package com.example.moneymanager.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Component
public class GeminiKeyRotator {

    private final List<String> apiKeys;
    private final AtomicInteger counter = new AtomicInteger(0);

    public GeminiKeyRotator(GeminiProperties properties) {
        this.apiKeys = properties.apiKeys() != null
                ? properties.apiKeys().stream()
                        .filter(k -> k != null && !k.isBlank())
                        .collect(Collectors.toList())
                : List.of();

        if (this.apiKeys.isEmpty()) {
            log.warn("Không có Gemini API key nào được cấu hình.");
        } else {
            log.info("GeminiKeyRotator khởi tạo với {} key(s).", this.apiKeys.size());
        }
    }

    /**
     * Trả về key tiếp theo theo thuật toán Round Robin.
     * Thread-safe nhờ AtomicInteger.
     */
    public String nextKey() {
        if (apiKeys.isEmpty()) {
            throw new RuntimeException("Không có Gemini API key nào được cấu hình.");
        }
        int index = counter.getAndUpdate(i -> (i + 1) % apiKeys.size());
        return apiKeys.get(index);
    }

    public boolean hasKeys() {
        return !apiKeys.isEmpty();
    }

    public int keyCount() {
        return apiKeys.size();
    }
}
