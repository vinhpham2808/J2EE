package com.example.moneymanager.controller;

import com.example.moneymanager.service.ExcelService;
import com.example.moneymanager.service.ExpenseService;
import com.example.moneymanager.service.IncomeService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.service.SubscriptionService;
import com.example.moneymanager.service.SpamProtectionService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@RestController
@RequestMapping("/excel")
@RequiredArgsConstructor
public class ExcelController {

    private final ExcelService excelService;
    private final IncomeService incomeService;
    private final ExpenseService expenseService;
    private final ProfileService profileService;
    private final SubscriptionService subscriptionService;
    private final SpamProtectionService spamProtectionService;

    @GetMapping("/download/income")
    public void downloadIncomeExcel(HttpServletResponse response) throws IOException {
        String email = profileService.getCurrentProfile().getEmail();
        SpamProtectionService.SpamCheckResult spamCheck = spamProtectionService.checkSpam(email);
        
        if (!spamCheck.isAllowed()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"" + spamCheck.message() + "\",\"blockedUntil\":\"" + spamCheck.blockedUntil() + "\"}");
            return;
        }

        subscriptionService.ensureCanExport(profileService.getCurrentProfile());
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=income.xlsx");
        excelService.writeIncomesToExcel(response.getOutputStream(), incomeService.getCurrentMonthIncomesForCurrentUser());
    }

    @GetMapping("/download/expense")
    public void downloadExpenseExcel(HttpServletResponse response) throws IOException {
        String email = profileService.getCurrentProfile().getEmail();
        SpamProtectionService.SpamCheckResult spamCheck = spamProtectionService.checkSpam(email);
        
        if (!spamCheck.isAllowed()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"" + spamCheck.message() + "\",\"blockedUntil\":\"" + spamCheck.blockedUntil() + "\"}");
            return;
        }

        subscriptionService.ensureCanExport(profileService.getCurrentProfile());
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=expense.xlsx");
        excelService.writeExpensesToExcel(response.getOutputStream(), expenseService.getCurrentMonthExpensesForCurrentUser());
    }
}
