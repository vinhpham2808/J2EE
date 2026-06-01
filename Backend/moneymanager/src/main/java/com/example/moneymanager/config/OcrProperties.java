package com.example.moneymanager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "ocr")
public record OcrProperties(
        List<String> apiKeys,
        String model,
        String baseUrl,
        Integer timeoutSeconds
) {
}
