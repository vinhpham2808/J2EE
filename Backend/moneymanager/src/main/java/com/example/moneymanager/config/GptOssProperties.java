package com.example.moneymanager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gptoss")
public record GptOssProperties(
        java.util.List<String> apiKeys,
        String model,
        String baseUrl,
        Integer timeoutSeconds,
        String appReferer,
        String appTitle
) {
}
