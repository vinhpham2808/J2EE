package com.example.moneymanager.controller;

import com.example.moneymanager.dto.ForecastDTOs.*;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.service.DashboardService;
import com.example.moneymanager.service.ForecastService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final ForecastService forecastService;
    private final ProfileService profileService;
    private final SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        try {
            Map<String, Object> dashboardData = dashboardService.getDashboardData();
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            log.error("Error fetching dashboard data: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch dashboard data: " + e.getMessage(), e);
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

            Map<String, String> insightData = dashboardService.getAiInsight();
            return ResponseEntity.ok(insightData);
        } catch (Exception e) {
            log.error("Error fetching AI insight: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch AI insight: " + e.getMessage(), e);
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
            throw new RuntimeException("Failed to fetch detailed AI insight: " + e.getMessage(), e);
        }
    }

    /**
     * AI Insight dự báo cho tháng được chọn.
     * Người dùng chọn tháng (hiện tại hoặc tương lai), hệ thống dùng dữ liệu lịch sử
     * để tạo dự báo hành vi tài chính cho tháng đó.
     *
     * @param year  Năm dự báo (vd: 2026)
     * @param month Tháng dự báo (1-12)
     * @return Dự báo tổng hợp: tổng chi tiêu dự kiến, danh mục có nguy cơ, cảnh báo bất thường, gợi ý tiết kiệm
     */
    @GetMapping("/ai-insight/forecast")
    public ResponseEntity<Map<String, Object>> getAiForecastInsight(
            @RequestParam int year,
            @RequestParam int month) {
        try {
            // 1. Kiểm tra profile
            ProfileEntity currentProfile = profileService.getCurrentProfile();
            if (currentProfile == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "User not authenticated");
                errorResponse.put("message", "Vui lòng đăng nhập để sử dụng tính năng này");
                return ResponseEntity.status(401).body(errorResponse);
            }

            // 2. Kiểm tra quyền PREMIUM
            subscriptionService.ensureCanUseDetailedAi(currentProfile);

            YearMonth requestedMonth = YearMonth.of(year, month);
            YearMonth currentMonth = YearMonth.now();
            if (!requestedMonth.isAfter(currentMonth)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "AI forecast is only available from next month");
                errorResponse.put("message", "AI Insight chỉ dự báo từ tháng tiếp theo.");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // 3. Lấy dự báo theo tháng
            MonthlyForecastDTO forecast = forecastService.getMonthlyForecast(year, month);

            // 4. Lấy danh sách bất thường
            List<AnomalyDTO> anomalies = forecastService.detectAnomalies(year, month);

            // 5. Tạo AI insight từ dữ liệu dự báo
            ForecastInsightDTO aiInsight = forecastService.analyzeForecastWithAi(forecast);

            // 6. Tổng hợp kết quả
            Map<String, Object> result = new HashMap<>();
            result.put("year", year);
            result.put("month", month);

            // Tổng chi tiêu dự kiến
            double totalPredicted = forecast.getCategories().stream()
                    .mapToDouble(c -> c.getPredictedAmount().doubleValue())
                    .sum();
            result.put("totalPredictedExpense", totalPredicted);

            // Các danh mục dự báo
            result.put("categories", forecast.getCategories());

            // Danh mục có nguy cơ tăng mạnh nhất (trend UP, predicted cao nhất)
            CategoryForecastItem topRiskCategory = forecast.getCategories().stream()
                    .filter(c -> "UP".equals(c.getTrend()))
                    .max((a, b) -> a.getPredictedAmount().compareTo(b.getPredictedAmount()))
                    .orElse(null);
            result.put("topRiskCategory", topRiskCategory);

            // Số lượng bất thường
            result.put("anomalyCount", anomalies.size());
            result.put("anomalies", anomalies);

            // AI narrative
            result.put("narrative", aiInsight.getNarrative());
            result.put("generatedAt", aiInsight.getGeneratedAt() != null
                    ? aiInsight.getGeneratedAt().toString()
                    : null);

            // Gợi ý tiết kiệm (từ AI narrative, backend có thể tách riêng nếu cần)
            // Hiện tại gợi ý nằm trong narrative

            log.info("AI forecast insight generated for {}/{}", year, month);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error generating AI forecast insight: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate AI forecast insight: " + e.getMessage(), e);
        }
    }
}
