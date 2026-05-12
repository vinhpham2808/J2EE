package com.example.moneymanager.controller;

import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.service.*;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/email")
@RequiredArgsConstructor
public class EmailController {

    private final ExcelService excelService;
    private final IncomeService incomeService;
    private final ExpenseService expenseService;
    private final EmailService emailService;
    private final ProfileService profileService;
    private final SubscriptionService subscriptionService;
    private final DocumentService documentService;
    private final MailTemplateService mailTemplateService;

    @GetMapping("/income-excel")
    public ResponseEntity<Void> emailIncomeExcel() throws IOException, MessagingException {
        subscriptionService.ensureCanExport(profileService.getCurrentProfile());
        ProfileEntity profile = profileService.getCurrentProfile();

        List<com.example.moneymanager.dto.IncomeDTO> incomes = incomeService.getCurrentMonthIncomesForCurrentUser();
        List<Map<String, Object>> incomeMapList = incomes.stream().map(dto -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", dto.getName());
            map.put("date", dto.getDate().toString());
            map.put("amount", dto.getAmount());
            map.put("category", dto.getCategoryName());
            return map;
        }).collect(Collectors.toList());

        LocalDate now = LocalDate.now();
        Map<String, String> lambdaResult = documentService.generateExcelReport(
                profile.getEmail(), now.getMonthValue(), now.getYear(), incomeMapList);

        String s3Link = lambdaResult.get("presignedUrl");
        String htmlBody = mailTemplateService.buildReportEmail(
                profile.getFullName(), now.getMonthValue(), now.getYear(), "income", s3Link);

        emailService.sendHtmlEmail(
                profile.getEmail(),
                "[Money Manager] Báo cáo thu nhập tháng " + now.getMonthValue() + "/" + now.getYear(),
                htmlBody);

        return ResponseEntity.ok(null);
    }
    }

    @GetMapping("/expense-excel")
    public ResponseEntity<Void> emailExpenseExcel() throws IOException, MessagingException {
        subscriptionService.ensureCanExport(profileService.getCurrentProfile());
        ProfileEntity profile = profileService.getCurrentProfile();

        List<com.example.moneymanager.dto.ExpenseDTO> expenses = expenseService.getCurrentMonthExpensesForCurrentUser();
        List<Map<String, Object>> expenseMapList = expenses.stream().map(dto -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", dto.getName());
            map.put("date", dto.getDate().toString());
            map.put("amount", dto.getAmount());
            map.put("category", dto.getCategoryName());
            return map;
        }).collect(Collectors.toList());

        LocalDate now = LocalDate.now();
        Map<String, String> lambdaResult = documentService.generateExcelReport(
                profile.getEmail(), now.getMonthValue(), now.getYear(), expenseMapList);

        String s3Link = lambdaResult.get("presignedUrl");
        String htmlBody = mailTemplateService.buildReportEmail(
                profile.getFullName(), now.getMonthValue(), now.getYear(), "expense", s3Link);

        emailService.sendHtmlEmail(
                profile.getEmail(),
                "[Money Manager] Báo cáo chi tiêu tháng " + now.getMonthValue() + "/" + now.getYear(),
                htmlBody);

        return ResponseEntity.ok(null);
    }
}
