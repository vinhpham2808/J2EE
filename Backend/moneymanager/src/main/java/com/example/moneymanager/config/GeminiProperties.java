package com.example.moneymanager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "gemini")
public record GeminiProperties(
        List<String> apiKeys,
        String model,
        String baseUrl,
        Integer timeoutSeconds
) {
}
