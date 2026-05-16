package com.example.moneymanager.controller;

import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.dto.FilterDTO;
import com.example.moneymanager.dto.IncomeDTO;
import com.example.moneymanager.service.ExpenseService;
import com.example.moneymanager.service.IncomeService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/filter")
public class FilterController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("date", "amount", "description", "category.name");

    private final ExpenseService expenseService;
    private final IncomeService incomeService;
    private final ProfileService profileService;
    private final SubscriptionService subscriptionService;

    @PostMapping
    public ResponseEntity<?> filterTransactions(@RequestBody FilterDTO filter) {
        LocalDate startDate = filter.getStartDate() != null ? filter.getStartDate() : LocalDate.MIN;
        LocalDate endDate = filter.getEndDate() != null ? filter.getEndDate() : LocalDate.now();
        String keyword = filter.getKeyword() != null ? filter.getKeyword() : "";
        String raw = filter.getSortField() != null ? filter.getSortField() : "date";
        if ("category".equals(raw)) raw = "category.name";
        String sortField = ALLOWED_SORT_FIELDS.contains(raw) ? raw : "date";
        Sort.Direction direction = "desc".equalsIgnoreCase(filter.getSortOrder()) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortField);
        subscriptionService.ensureCanUseFilters(profileService.getCurrentProfile(), startDate);
        if ("income".equals(filter.getType())) {
            List<IncomeDTO> incomes = incomeService.filterIncomes(startDate, endDate, keyword, sort);
            return ResponseEntity.ok(incomes);
        } else if ("expense".equalsIgnoreCase(filter.getType())) {
            List<ExpenseDTO> expenses = expenseService.filterExpenses(startDate, endDate, keyword, sort);
            return ResponseEntity.ok(expenses);
        } else {
            return ResponseEntity.badRequest().body("Invalid type. Must be 'income' or 'expense'");
        }
    }
}
