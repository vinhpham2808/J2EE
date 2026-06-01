package com.example.moneymanager.controller;

import com.example.moneymanager.service.DocumentService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.service.PaymentService;
import com.example.moneymanager.entity.PaymentEntity;
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
    private final PaymentService paymentService;
    private final com.example.moneymanager.service.ExpenseService expenseService;
    private final com.example.moneymanager.service.IncomeService incomeService;

    /**
     * Sinh hóa đơn PDF cho một giao dịch đã thanh toán.
     * POST /documents/invoice
     * Body: { "orderCode": 123 }
     * Server lookup amount/planName/paidDate từ DB theo current user.
     */
    @PostMapping("/invoice")
    public ResponseEntity<?> generateInvoice(@RequestBody Map<String, Object> request) {
        try {
            if (request.get("orderCode") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu mã giao dịch."));
            }
            Long orderCode = Long.valueOf(request.get("orderCode").toString());
            PaymentEntity payment = paymentService.findOwnedPaidPayment(orderCode);
            ProfileEntity profile = profileService.getCurrentProfile();
            LocalDate paidDate = payment.getUpdatedAt() != null
                    ? payment.getUpdatedAt().toLocalDate()
                    : LocalDate.now();

            Map<String, String> result = documentService.generateInvoice(
                    payment.getOrderCode(),
                    payment.getAmount(),
                    payment.getPlanName(),
                    profile.getEmail(),
                    paidDate
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
            boolean all = Boolean.parseBoolean(String.valueOf(request.getOrDefault("all", "false")));
            int month = request.get("month") != null
                    ? Integer.parseInt(request.get("month").toString())
                    : LocalDate.now().getMonthValue();
            int year = request.get("year") != null
                    ? Integer.parseInt(request.get("year").toString())
                    : LocalDate.now().getYear();

            // Lấy danh sách chi tiêu từ database
            java.util.List<com.example.moneymanager.dto.ExpenseDTO> expenses = all
                    ? expenseService.getAllExpensesForCurrentUser()
                    : expenseService.getExpensesByMonthForCurrentUser(year, month);
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

    /**
     * Sinh báo cáo thu nhập Excel.
     * POST /documents/report/income
     * Body: { "month": 5, "year": 2026 }
     */
    @PostMapping("/report/income")
    public ResponseEntity<?> generateIncomeReport(@RequestBody Map<String, Object> request) {
        try {
            ProfileEntity profile = profileService.getCurrentProfile();
            boolean all = Boolean.parseBoolean(String.valueOf(request.getOrDefault("all", "false")));
            int month = request.get("month") != null
                    ? Integer.parseInt(request.get("month").toString())
                    : LocalDate.now().getMonthValue();
            int year = request.get("year") != null
                    ? Integer.parseInt(request.get("year").toString())
                    : LocalDate.now().getYear();

            // Lấy danh sách thu nhập từ database
            java.util.List<com.example.moneymanager.dto.IncomeDTO> incomes = all
                    ? incomeService.getIncomesForCurrentUser(null, null, true)
                    : incomeService.getIncomesByMonthForCurrentUser(year, month);
            java.util.List<Map<String, Object>> incomeMapList = incomes.stream().map(dto -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("name", dto.getName());
                map.put("date", dto.getDate().toString());
                map.put("amount", dto.getAmount());
                map.put("category", dto.getCategoryName()); // Thay đổi từ categoryName thành category để khớp với Lambda
                return map;
            }).collect(java.util.stream.Collectors.toList());

            // Gửi sang Lambda
            Map<String, String> result = documentService.generateExcelReport(
                    profile.getEmail(), month, year, incomeMapList
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Không thể sinh báo cáo: " + e.getMessage()
            ));
        }
    }
}
