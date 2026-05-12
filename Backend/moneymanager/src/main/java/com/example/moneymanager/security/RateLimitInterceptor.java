package com.example.moneymanager.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Sliding-window in-memory rate limiter per IP.
 * Protects high-risk endpoints against brute force and abuse.
 */
@Component
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final String CTX = "/api/v1.0";

    private record RateRule(String fullPath, int maxRequests, long windowMs) {}

    private static final List<RateRule> RULES = List.of(
            new RateRule(CTX + "/login",                      5,  60_000),
            new RateRule(CTX + "/forgot-password",            5,  60_000),
            new RateRule(CTX + "/otp/resend",                 3,  60_000),
            new RateRule(CTX + "/register",                   5,  60_000),
            new RateRule(CTX + "/payments/payos/create",      3,  60_000),
            new RateRule(CTX + "/gemini/chat",               15,  60_000),
            new RateRule(CTX + "/gemini/spending-tips",       5,  60_000)
    );

    // key: "fullPath:clientIp" → sliding window of request timestamps
    private final ConcurrentHashMap<String, Deque<Long>> windowMap = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String uri = request.getRequestURI();
        String clientIp = resolveClientIp(request);

        for (RateRule rule : RULES) {
            if (uri.equals(rule.fullPath())) {
                String key = rule.fullPath() + ":" + clientIp;
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
        Deque<Long> timestamps = windowMap.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());

        // Remove expired entries outside the sliding window
        while (!timestamps.isEmpty() && now - timestamps.peekFirst() > windowMs) {
            timestamps.pollFirst();
        }

        if (timestamps.size() < maxRequests) {
            timestamps.addLast(now);
            return true;
        }
        return false;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
