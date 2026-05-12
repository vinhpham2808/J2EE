package com.example.moneymanager.controller;

import com.example.moneymanager.service.DocumentService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.entity.ProfileEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final ProfileService profileService;
    private final com.example.moneymanager.service.ExpenseService expenseService;

    /**
     * Sinh hóa đơn PDF cho một đơn hàng đã thanh toán.
     * POST /documents/invoice
     * Body: { "orderCode": 123, "amount": 99000, "planName": "Premium 1 tháng", "paidDate": "2026-05-07" }
     */
    @PostMapping("/invoice")
    public ResponseEntity<?> generateInvoice(@RequestBody Map<String, Object> request) {
        try {
            ProfileEntity profile = profileService.getCurrentProfile();
            Long orderCode = Long.valueOf(request.get("orderCode").toString());
            Long amount = Long.valueOf(request.get("amount").toString());
            String planName = (String) request.get("planName");
            LocalDate paidDate = request.get("paidDate") != null
                    ? LocalDate.parse(request.get("paidDate").toString())
                    : LocalDate.now();

            Map<String, String> result = documentService.generateInvoice(
                    orderCode, amount, planName, profile.getEmail(), paidDate
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Không thể sinh hóa đơn: " + e.getMessage()
            ));
        }
    }

    /**
     * Sinh báo cáo chi tiêu Excel.
     * POST /documents/report/expense
     * Body: { "month": 5, "year": 2026 }
     */
    @PostMapping("/report/expense")
    public ResponseEntity<?> generateExpenseReport(@RequestBody Map<String, Object> request) {
        try {
            ProfileEntity profile = profileService.getCurrentProfile();
            int month = Integer.parseInt(request.get("month").toString());
            int year = Integer.parseInt(request.get("year").toString());

            // Lấy danh sách chi tiêu từ database
            java.util.List<com.example.moneymanager.dto.ExpenseDTO> expenses = expenseService.getExpensesByMonthForCurrentUser(year, month);
            java.util.List<Map<String, Object>> expenseMapList = expenses.stream().map(dto -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("name", dto.getName());
                map.put("date", dto.getDate().toString());
                map.put("amount", dto.getAmount());
                map.put("category", dto.getCategoryName()); // Thay đổi từ categoryName thành category để khớp với Lambda
                return map;
            }).collect(java.util.stream.Collectors.toList());

            // Gửi sang Lambda
            Map<String, String> result = documentService.generateExcelReport(
                    profile.getEmail(), month, year, expenseMapList
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Không thể sinh báo cáo: " + e.getMessage()
            ));
        }
    }
}
