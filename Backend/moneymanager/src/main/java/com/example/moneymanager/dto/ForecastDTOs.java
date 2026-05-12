package com.example.moneymanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ForecastDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryForecastItem {
        private Long categoryId;
        private String categoryName;
        private BigDecimal predictedAmount;
        private BigDecimal historicalAverage;
        private String trend; // "UP", "DOWN", "STABLE"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyForecastDTO {
        private int year;
        private int month;
        private List<CategoryForecastItem> categories;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnomalyDTO {
        private Long transactionId;
        private String type; // "EXPENSE"
        private BigDecimal amount;
        private String categoryName;
        private String date; // ISO Date String
        private BigDecimal meanAmount;
        private BigDecimal stdDev;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyDataPoint {
        private String yearMonth; // "YYYY-MM"
        private BigDecimal actual;
        private BigDecimal predicted;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryTrendDTO {
        private String categoryName;
        private List<MonthlyDataPoint> dataPoints;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastInsightDTO {
        private String narrative;
        private LocalDateTime generatedAt;
    }
}
