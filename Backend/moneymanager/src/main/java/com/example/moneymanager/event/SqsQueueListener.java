package com.example.moneymanager.event;

import com.example.moneymanager.dto.BudgetStatusDTO;
import com.example.moneymanager.entity.CategoryEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.CategoryRepository;
import com.example.moneymanager.repository.ProfileRepository;
import com.example.moneymanager.service.BudgetService;
import com.example.moneymanager.service.NotificationService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("worker")
public class SqsQueueListener {

    private final ProfileRepository profileRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationService notificationService;
    private final BudgetService budgetService;

    @SqsListener("${app.sqs.queue-name}")
    public void listen(SqsTransactionMessage message) {
        log.info("Received message from SQS queue: {}", message);
        try {
            ProfileEntity profile = profileRepository.findById(message.getProfileId())
                    .orElseThrow(() -> new RuntimeException("Profile not found: " + message.getProfileId()));

            BigDecimal amount = BigDecimal.valueOf(message.getAmount());

            if ("EXPENSE_CREATED".equalsIgnoreCase(message.getType()) || "EXPENSE_UPDATED".equalsIgnoreCase(message.getType())) {
                CategoryEntity category = categoryRepository.findById(message.getCategoryId())
                        .orElseThrow(() -> new RuntimeException("Category not found: " + message.getCategoryId()));

                LocalDate date = LocalDate.parse(message.getTransactionDate());
                int month = date.getMonthValue();
                int year = date.getYear();

                // 1. Notify expense added/updated
                String prefix = "EXPENSE_UPDATED".equalsIgnoreCase(message.getType()) ? "Cập nhật: " : "";
                notificationService.notifyExpenseAdded(profile, prefix + message.getTransactionName(), amount);

                // 2. Budget status warning & thresholds check
                BudgetStatusDTO budgetStatus = budgetService.checkBudgetStatus(
                        profile.getId(), category.getId(), month, year);
                notificationService.notifyBudgetWarning(profile, budgetStatus);

                if (budgetStatus.isHasBudget() && (budgetStatus.isExceeded() || budgetStatus.isWarning())) {
                    budgetService.sendBudgetAlertEmailAsync(profile, budgetStatus);
                }

                // 3. Abnormal spending check
                notificationService.checkAbnormalSpendingAsync(profile, date);

            } else if ("INCOME_CREATED".equalsIgnoreCase(message.getType())) {
                // Notify income added
                notificationService.notifyIncomeAdded(profile, message.getTransactionName(), amount);
            }
        } catch (Exception e) {
            log.error("Failed to process SQS message {}: {}", message, e.getMessage(), e);
            throw new RuntimeException(e); // Trigger SQS retries & DLQ routing
        }
    }
}
