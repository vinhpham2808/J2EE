package com.example.moneymanager.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Service
public class SpamProtectionService {

    private final StringRedisTemplate redisTemplate;

    public SpamProtectionService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public record SpamCheckResult(boolean isAllowed, LocalDateTime blockedUntil, String message) {}

    public SpamCheckResult checkSpam(String email) {
        try {
            return doCheckSpam(email);
        } catch (Exception e) {
            // Graceful fallback: nếu Redis không kết nối được, cho phép request đi qua
            // thay vì crash toàn bộ chức năng Excel/Email
            log.warn("Redis unavailable for spam check (email={}). Allowing request through. Error: {}",
                    email, e.getMessage());
            return new SpamCheckResult(true, null, "OK");
        }
    }

    private SpamCheckResult doCheckSpam(String email) {
        String blockKey = "block:" + email;
        String countKey = "count:" + email;

        Long expireTime = redisTemplate.getExpire(blockKey); 
        if (expireTime != null && expireTime > 0) {
            LocalDateTime unblockTime = LocalDateTime.now().plusSeconds(expireTime);
            return new SpamCheckResult(false, unblockTime, "Bạn đang bị khóa chức năng này.");
        }

        Long currentCount = redisTemplate.opsForValue().increment(countKey);

        if (currentCount != null && currentCount == 1L) {
            redisTemplate.expire(countKey, Duration.ofSeconds(60));
        }

        if (currentCount != null && currentCount > 10) {
            redisTemplate.opsForValue().set(blockKey, "BLOCKED", Duration.ofHours(5));
            redisTemplate.delete(countKey); 
            return new SpamCheckResult(false, LocalDateTime.now().plusHours(5), "Spam nghiêm trọng! Khóa hệ thống 5 giờ.");
        } 
        
        if (currentCount != null && currentCount > 5) {
            redisTemplate.opsForValue().set(blockKey, "BLOCKED", Duration.ofMinutes(10));
            redisTemplate.delete(countKey); 
            return new SpamCheckResult(false, LocalDateTime.now().plusMinutes(10), "Bạn thao tác quá nhanh. Khóa 10 phút.");
        }

        return new SpamCheckResult(true, null, "OK");
    }
}
