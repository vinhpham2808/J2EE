package com.example.moneymanager.controller;

import com.example.moneymanager.dto.ForecastDTOs.*;
import com.example.moneymanager.service.ForecastService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final ForecastService forecastService;

    @GetMapping("/monthly")
    public ResponseEntity<MonthlyForecastDTO> getMonthlyForecast(
            @RequestParam int year, 
            @RequestParam int month) {
        return ResponseEntity.ok(forecastService.getMonthlyForecast(year, month));
    }

    @GetMapping("/anomalies")
    public ResponseEntity<List<AnomalyDTO>> getAnomalies(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(forecastService.detectAnomalies(year, month));
    }

    @GetMapping("/category-trend/{categoryId}")
    public ResponseEntity<CategoryTrendDTO> getCategoryTrend(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(forecastService.getCategoryTrend(categoryId, months));
    }

    @PostMapping("/insights")
    public ResponseEntity<ForecastInsightDTO> getInsights(@RequestBody MonthlyForecastDTO forecastDTO) {
        return ResponseEntity.ok(forecastService.analyzeForecastWithAi(forecastDTO));
    }
}
