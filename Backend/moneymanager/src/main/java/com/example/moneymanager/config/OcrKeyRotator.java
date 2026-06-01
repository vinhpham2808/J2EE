package com.example.moneymanager.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Component
public class OcrKeyRotator {

    private final List<String> apiKeys;
    private final AtomicInteger counter = new AtomicInteger(0);

    public OcrKeyRotator(OcrProperties properties) {
        this.apiKeys = properties.apiKeys() != null
                ? properties.apiKeys().stream()
                .filter(key -> key != null && !key.isBlank())
                .collect(Collectors.toList())
                : List.of();

        if (this.apiKeys.isEmpty()) {
            log.info("OCR key rotation is disabled because no OCR API keys were configured.");
        } else {
            log.info("OcrKeyRotator initialized with {} key(s).", this.apiKeys.size());
        }
    }

    public String nextKey() {
        if (apiKeys.isEmpty()) {
            throw new RuntimeException("No OCR API keys were configured.");
        }
        int index = counter.getAndUpdate(i -> (i + 1) % apiKeys.size());
        return apiKeys.get(index);
    }

    public boolean hasKeys() {
        return !apiKeys.isEmpty();
    }
}
