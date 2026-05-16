package com.example.moneymanager.service;

import com.example.moneymanager.dto.AIUsageStatsDTO;
import com.example.moneymanager.exception.AiRateLimitException;
import com.example.moneymanager.entity.ProfileEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIRateLimitService {

    private final StringRedisTemplate redisTemplate;
    private final ProfileService profileService;
    
    // In-memory fallback if Redis is unreachable
    private final ConcurrentHashMap<String, Integer> fallbackCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LocalDateTime> fallbackExpiry = new ConcurrentHashMap<>();

    /**
     * feature can be "AGENT", "CHAT", "OTHER_AI"
     */
    public void checkLimit(String feature) {
        ProfileEntity profile = profileService.getCurrentProfile();
        if (profile == null) {
            throw new RuntimeException("Vui lòng đăng nhập để sử dụng tính năng này.");
        }

        String plan = profile.getSubscriptionPlan() != null ? profile.getSubscriptionPlan().name() : "FREE";
        if ("PREMIUM".equalsIgnoreCase(plan)) {
            return; // Unlimited
        }

        String userId = profile.getId().toString();
        String countKey = "ai_limit_count:" + feature + ":" + userId;

        if ("FREE".equalsIgnoreCase(plan)) {
            if ("AGENT".equalsIgnoreCase(feature)) {
                throw new AiRateLimitException("Gói FREE không hỗ trợ tính năng Agent. Vui lòng nâng cấp gói để sử dụng.");
            } else if ("CHAT".equalsIgnoreCase(feature)) {
                checkRedisLimit(countKey, 5, Duration.ofHours(5), "Bạn đã đạt giới hạn 5 tin nhắn Chat mỗi 5 giờ cho gói FREE. Vui lòng nâng cấp gói hoặc thử lại sau.");
            } else {
                throw new AiRateLimitException("Gói FREE không hỗ trợ tính năng AI này. Vui lòng nâng cấp gói để sử dụng.");
            }
        } else if ("BASIC".equalsIgnoreCase(plan)) {
            if ("AGENT".equalsIgnoreCase(feature)) {
                checkRedisLimit(countKey, 5, Duration.ofHours(5), "Bạn đã đạt giới hạn 5 lượt dùng Agent mỗi 5 giờ của gói BASIC. Vui lòng nâng cấp gói Premium hoặc thử lại sau.");
            } else if ("CHAT".equalsIgnoreCase(feature)) {
                checkRedisLimit(countKey, 10, Duration.ofHours(5), "Bạn đã đạt giới hạn 10 tin nhắn Chat mỗi 5 giờ của gói BASIC. Vui lòng nâng cấp gói Premium hoặc thử lại sau.");
            } else {
                checkRedisLimit(countKey, 5, Duration.ofHours(5), "Bạn đã đạt giới hạn 5 lượt dùng tính năng này mỗi 5 giờ của gói BASIC. Vui lòng nâng cấp gói Premium hoặc thử lại sau.");
            }
        }
    }

    private void checkRedisLimit(String countKey, int maxRequests, Duration duration, String errorMessage) {
        try {
            Long currentCount = redisTemplate.opsForValue().increment(countKey);
            if (currentCount != null && currentCount == 1L) {
                redisTemplate.expire(countKey, duration);
            }
            if (currentCount != null && currentCount > maxRequests) {
                throw new AiRateLimitException(errorMessage);
            }
        } catch (AiRateLimitException e) {
            throw e; // properly re-throw the custom rate limit exception
        } catch (Exception e) {
            log.warn("Redis unavailable for AI rate limit check (key={}). Using in-memory fallback. Error: {}", countKey, e.getMessage());
            
            // Cleanup expired fallback entries lazily
            if (fallbackExpiry.containsKey(countKey) && LocalDateTime.now().isAfter(fallbackExpiry.get(countKey))) {
                fallbackCache.remove(countKey);
                fallbackExpiry.remove(countKey);
            }
            
            int currentCount = fallbackCache.getOrDefault(countKey, 0) + 1;
            fallbackCache.put(countKey, currentCount);
            if (currentCount == 1) {
                fallbackExpiry.put(countKey, LocalDateTime.now().plus(duration));
            }
            
            if (currentCount > maxRequests) {
                throw new AiRateLimitException(errorMessage);
            }
        }
    }

    public AIUsageStatsDTO getAIUsageStats() {
        ProfileEntity profile = profileService.getCurrentProfile();
        if (profile == null) {
            return null;
        }

        String plan = profile.getSubscriptionPlan() != null ? profile.getSubscriptionPlan().name() : "FREE";
        if ("PREMIUM".equalsIgnoreCase(plan)) {
            return AIUsageStatsDTO.builder()
                    .plan(plan)
                    .isUnlimited(true)
                    .build();
        }

        String userId = profile.getId().toString();
        
        int chatLimit = "FREE".equalsIgnoreCase(plan) ? 5 : 10;
        int agentLimit = "FREE".equalsIgnoreCase(plan) ? 0 : 5;
        int otherAiLimit = "FREE".equalsIgnoreCase(plan) ? 0 : 5;

        int chatUsed = Math.min(getCurrentUsage("CHAT", userId), chatLimit);
        int agentUsed = Math.min(getCurrentUsage("AGENT", userId), agentLimit);
        int otherAiUsed = Math.min(getCurrentUsage("OTHER_AI", userId), otherAiLimit);

        return AIUsageStatsDTO.builder()
                .plan(plan)
                .chatUsed(chatUsed)
                .chatLimit(chatLimit)
                .agentUsed(agentUsed)
                .agentLimit(agentLimit)
                .otherAiUsed(otherAiUsed)
                .otherAiLimit(otherAiLimit)
                .isUnlimited(false)
                .build();
    }

    private int getCurrentUsage(String feature, String userId) {
        String countKey = "ai_limit_count:" + feature + ":" + userId;
        try {
            String val = redisTemplate.opsForValue().get(countKey);
            if (val != null) {
                return Integer.parseInt(val);
            }
        } catch (Exception e) {
            return fallbackCache.getOrDefault(countKey, 0);
        }
        return fallbackCache.getOrDefault(countKey, 0);
    }

    /**
     * Admin: reset all AI limit counters for a specific user.
     */
    public void resetAILimitsForUser(Long userId) {
        String[] features = {"CHAT", "AGENT", "OTHER_AI"};
        String uid = userId.toString();
        for (String feature : features) {
            String countKey = "ai_limit_count:" + feature + ":" + uid;
            try {
                redisTemplate.delete(countKey);
            } catch (Exception e) {
                log.warn("Redis unavailable when resetting AI limit for user {}: {}", uid, e.getMessage());
            }
            // Also clear in-memory fallback
            fallbackCache.remove(countKey);
            fallbackExpiry.remove(countKey);
        }
        log.info("AI limits reset for user {}", uid);
    }

    /**
     * Admin: reset ALL AI limit counters for ALL users.
     */
    public void resetAllAILimits() {
        try {
            java.util.Set<String> keys = redisTemplate.keys("ai_limit_count:*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Redis unavailable when resetting ALL AI limits: {}", e.getMessage());
        }
        
        fallbackCache.clear();
        fallbackExpiry.clear();
        log.info("ALL AI limits have been reset.");
    }
}
