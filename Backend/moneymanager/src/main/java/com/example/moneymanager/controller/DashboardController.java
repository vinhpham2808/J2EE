package com.example.moneymanager.controller;

import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.service.AIRateLimitService;
import com.example.moneymanager.service.DashboardService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final ProfileService profileService;
    private final SubscriptionService subscriptionService;
    private final AIRateLimitService aiRateLimitService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        try {
            Map<String, Object> dashboardData = dashboardService.getDashboardData();
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            log.error("Error fetching dashboard data: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Không thể tải dữ liệu dashboard");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/ai-insight")
    public ResponseEntity<Map<String, String>> getDashboardAiInsight() {
        try {
            // Kiểm tra profile
            ProfileEntity currentProfile = profileService.getCurrentProfile();
            if (currentProfile == null) {
                log.error("User profile not found");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "User not found");
                errorResponse.put("insight", "Vui lòng đăng nhập để sử dụng tính năng này");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            aiRateLimitService.checkLimit("OTHER_AI");

            Map<String, String> insightData = dashboardService.getAiInsight();
            return ResponseEntity.ok(insightData);
        } catch (Exception e) {
            log.error("Error fetching AI insight: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("insight", "Hệ thống AI đang bảo trì, vui lòng thử lại sau");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/ai-insight/detailed")
    public ResponseEntity<Map<String, Object>> getDetailedAiInsight() {
        try {
            log.info("Fetching detailed AI insight...");

            // 1. Kiểm tra profile
            ProfileEntity currentProfile = profileService.getCurrentProfile();
            if (currentProfile == null) {
                log.error("User profile not found - user may not be logged in");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "User not authenticated");
                errorResponse.put("message", "Vui lòng đăng nhập để sử dụng tính năng này");
                return ResponseEntity.status(401).body(errorResponse);
            }

            log.info("User found: {}", currentProfile.getEmail());

            // 1.5 Kiểm tra quyền truy cập tính năng AI chuyên sâu
            subscriptionService.ensureCanUseDetailedAi(currentProfile);

            // 1.6 Kiểm tra giới hạn rate limit
            aiRateLimitService.checkLimit("OTHER_AI");

            // 2. Lấy dashboard data
            Map<String, Object> dashboardData = dashboardService.getDashboardData();
            if (dashboardData == null) {
                log.error("Dashboard data is null");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "No dashboard data available");
                errorResponse.put("message", "Không có dữ liệu để phân tích");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // 3. Kiểm tra các trường bắt buộc
            String[] requiredFields = {"totalIncome", "totalExpense", "totalBalance"};
            for (String field : requiredFields) {
                if (!dashboardData.containsKey(field)) {
                    log.error("Missing required field: {}", field);
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Missing required data");
                    errorResponse.put("message", "Thiếu dữ liệu: " + field);
                    return ResponseEntity.badRequest().body(errorResponse);
                }
            }

            log.info("Dashboard data: totalIncome={}, totalExpense={}, totalBalance={}",
                    dashboardData.get("totalIncome"),
                    dashboardData.get("totalExpense"),
                    dashboardData.get("totalBalance"));

            // 4. Lấy detailed insight
            String fullName = currentProfile.getFullName() != null ? currentProfile.getFullName() : "bạn";
            Map<String, Object> detailedInsight = dashboardService.getDetailedAiInsight();

            if (detailedInsight == null || detailedInsight.isEmpty()) {
                log.warn("Detailed insight is empty");
                Map<String, Object> emptyResponse = new HashMap<>();
                emptyResponse.put("message", "Chưa có đủ dữ liệu để phân tích chi tiết");
                emptyResponse.put("status", "insufficient_data");
                return ResponseEntity.ok(emptyResponse);
            }

            log.info("Detailed insight fetched successfully");
            return ResponseEntity.ok(detailedInsight);

        } catch (Exception e) {
            log.error("Error fetching detailed AI insight: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Không thể tải phân tích chi tiết: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}