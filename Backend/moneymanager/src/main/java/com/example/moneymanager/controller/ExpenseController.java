package com.example.moneymanager.controller;

import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.dto.ExpenseResponseDTO;
import com.example.moneymanager.dto.ReceiptImportAnalyzeResponseDTO;
import com.example.moneymanager.dto.ReceiptImportConfirmRequestDTO;
import com.example.moneymanager.dto.ReceiptImportResponseDTO;
import com.example.moneymanager.service.ExpenseService;
import com.example.moneymanager.service.ReceiptImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final ReceiptImportService receiptImportService;

    @PostMapping
    public ResponseEntity<ExpenseResponseDTO> addExpense(@RequestBody ExpenseDTO dto) {
        ExpenseResponseDTO saved = expenseService.addExpense(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<ExpenseDTO>> getExpenses(
            @RequestParam(required = false) Boolean all,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        if (page != null && size != null) {
            return ResponseEntity.ok(expenseService.getExpensesForCurrentUser(all, page, size));
        }
        List<ExpenseDTO> expenses = Boolean.TRUE.equals(all)
                ? expenseService.getAllExpensesForCurrentUser()
                : expenseService.getCurrentMonthExpensesForCurrentUser();
        return ResponseEntity.ok(expenses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponseDTO> updateExpense(@PathVariable Long id, @RequestBody ExpenseDTO dto) {
        ExpenseResponseDTO updated = expenseService.updateExpense(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PostMapping(value = "/import-receipt/analyze", consumes = "multipart/form-data")
    public ResponseEntity<ReceiptImportAnalyzeResponseDTO> analyzeReceipt(
            @RequestPart("file") MultipartFile file
    ) {
        return ResponseEntity.ok(receiptImportService.analyzeReceipt(file));
    }

    @PostMapping("/import-receipt/confirm")
    public ResponseEntity<ReceiptImportResponseDTO> confirmReceiptImport(
            @RequestBody ReceiptImportConfirmRequestDTO requestDTO
    ) {
        return ResponseEntity.ok(receiptImportService.confirmImport(requestDTO));
    }
}
