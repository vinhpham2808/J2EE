package com.example.moneymanager.security;

import com.example.moneymanager.service.SpamProtectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpamProtectionDegradedModeRegressionTest {

    @Mock StringRedisTemplate redisTemplate;

    private SpamProtectionService spamProtectionService;

    @BeforeEach
    void setUp() {
        spamProtectionService = new SpamProtectionService(redisTemplate);
    }

    @Test
    @DisplayName("REGRESSION: spam protection must NOT fail-open when Redis is unavailable")
    void checkSpam_mustFailClosed_whenRedisUnavailable() {
        when(redisTemplate.getExpire(anyString())).thenThrow(new RuntimeException("Redis connection refused"));

        SpamProtectionService.SpamCheckResult result = spamProtectionService.checkSpam("victim@example.com");

        assertFalse(result.isAllowed(),
                "When Redis is down, requests must be BLOCKED (fail-closed), not allowed through");
        assertNotNull(result.blockedUntil(),
                "BlockedUntil timestamp must be present during degraded mode");
        assertNotNull(result.message(), "User-facing message must be set");
        assertFalse(result.message().toLowerCase().contains("redis"),
                "User-facing message should not leak infrastructure details like 'Redis'");
    }
}
