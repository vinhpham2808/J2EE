package com.example.moneymanager.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * Sliding-window Redis-based rate limiter per IP.
 * Protects high-risk endpoints against brute force and abuse.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final String CTX = "/api/v1.0";
    private static final String REDIS_PREFIX = "rate:";

    private final StringRedisTemplate redisTemplate;

    private record RateRule(String fullPath, int maxRequests, long windowMs) {}

    private static final List<RateRule> RULES = List.of(
            new RateRule(CTX + "/login",                      5,  60_000),
            new RateRule(CTX + "/forgot-password",            5,  60_000),
            new RateRule(CTX + "/otp/resend",                 3,  60_000),
            new RateRule(CTX + "/register",                   5,  60_000),
            new RateRule(CTX + "/complete-profile",            5,  60_000),
            new RateRule(CTX + "/payments/payos/create",      3,  60_000),
            new RateRule(CTX + "/gemini/chat",               15,  60_000),
            new RateRule(CTX + "/gemini/spending-tips",       5,  60_000),
            new RateRule(CTX + "/gemini/test",                3,  60_000)
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String uri = request.getRequestURI();
        String clientIp = resolveClientIp(request);

        for (RateRule rule : RULES) {
            if (uri.equals(rule.fullPath())) {
                String key = REDIS_PREFIX + rule.fullPath() + ":" + clientIp;
                if (!isAllowed(key, rule.maxRequests(), rule.windowMs())) {
                    log.warn("Rate limit exceeded for IP={} on path={}", clientIp, uri);
                    response.setStatus(429);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"message\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau.\"}");
                    return false;
                }
                break;
            }
        }
        return true;
    }

    private boolean isAllowed(String key, int maxRequests, long windowMs) {
        long now = System.currentTimeMillis();
        long cutoff = now - windowMs;

        try {
            // Remove expired entries
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, cutoff);

            // Count requests in current window
            Long count = redisTemplate.opsForZSet().zCard(key);

            if (count != null && count < maxRequests) {
                // Add current request with a unique value to prevent overwrites
                String member = now + ":" + UUID.randomUUID().toString();
                redisTemplate.opsForZSet().add(key, member, now);
                // Set TTL on key to clean up stale entries automatically
                redisTemplate.expire(key, Duration.ofMillis(windowMs));
                return true;
            }
            return false;
        } catch (Exception e) {
            // Fail-open: if Redis is down, allow the request but log error
            log.error("Redis error in rate limiter for key={}: {}. Falling back to fail-open.", key, e.getMessage());
            return true;
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String ip = request.getHeader("CF-Connecting-IP");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Forwarded-For");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // If X-Forwarded-For contains multiple IPs, take the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
