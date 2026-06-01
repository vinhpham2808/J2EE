package com.example.moneymanager.controller;

import com.example.moneymanager.dto.MonthlyReportAiAnalysisRequestDTO;
import com.example.moneymanager.dto.MonthlyReportCardDTO;
import com.example.moneymanager.service.MonthlyReportCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class MonthlyReportCardController {

    private final MonthlyReportCardService monthlyReportCardService;

    @GetMapping("/monthly")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentMonthReport() {
        try {
            MonthlyReportCardDTO report = monthlyReportCardService.getReportCard();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", report
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/monthly/{year}/{month}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getReportByMonth(@PathVariable int year, @PathVariable int month) {
        try {
            MonthlyReportCardDTO report = monthlyReportCardService.getReportCard(year, month);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", report
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/monthly/ai-analysis")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> analyzeMonthlyReportWithAi(@RequestBody MonthlyReportAiAnalysisRequestDTO request) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "reply", monthlyReportCardService.analyzeReportWithAi(request)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}
