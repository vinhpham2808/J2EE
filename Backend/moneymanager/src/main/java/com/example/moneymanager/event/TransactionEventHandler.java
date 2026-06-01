package com.example.moneymanager.event;

import com.example.moneymanager.dto.BudgetStatusDTO;
import com.example.moneymanager.service.BudgetService;
import com.example.moneymanager.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Xử lý side-effects sau khi transaction expense/income đã commit.
 * Chạy async (thread pool riêng) → POST /expenses và POST /income trả response nhanh hơn.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionEventHandler {

    private final NotificationService notificationService;
    private final BudgetService budgetService;

    // ─── Expense Created ─────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onExpenseCreated(TransactionEvents.ExpenseCreated event) {
        try {
            int month = event.getExpenseDate().getMonthValue();
            int year  = event.getExpenseDate().getYear();

            // Notification: expense added
            notificationService.notifyExpenseAdded(event.getProfile(), event.getExpenseName(), event.getAmount());

            // Budget warning + threshold check
            BudgetStatusDTO budgetStatus = budgetService.checkBudgetStatus(
                    event.getProfile().getId(), event.getCategory().getId(), month, year);
            notificationService.notifyBudgetWarning(event.getProfile(), budgetStatus);

            if (budgetStatus.isHasBudget() && (budgetStatus.isExceeded() || budgetStatus.isWarning())) {
                budgetService.sendBudgetAlertEmailAsync(event.getProfile(), budgetStatus);
            }

            // Abnormal spending check
            notificationService.checkAbnormalSpendingAsync(event.getProfile(), event.getExpenseDate());

        } catch (Exception e) {
            log.error("Error processing ExpenseCreated side-effects for user {}: {}",
                    event.getProfile().getId(), e.getMessage(), e);
        }
    }

    // ─── Expense Updated ─────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onExpenseUpdated(TransactionEvents.ExpenseUpdated event) {
        try {
            int month = event.getExpenseDate().getMonthValue();
            int year  = event.getExpenseDate().getYear();

            notificationService.notifyExpenseAdded(event.getProfile(),
                    "Cập nhật: " + event.getExpenseName(), event.getAmount());

            BudgetStatusDTO budgetStatus = budgetService.checkBudgetStatus(
                    event.getProfile().getId(), event.getCategory().getId(), month, year);
            notificationService.notifyBudgetWarning(event.getProfile(), budgetStatus);

            if (budgetStatus.isHasBudget() && (budgetStatus.isExceeded() || budgetStatus.isWarning())) {
                budgetService.sendBudgetAlertEmailAsync(event.getProfile(), budgetStatus);
            }

            notificationService.checkAbnormalSpendingAsync(event.getProfile(), event.getExpenseDate());

        } catch (Exception e) {
            log.error("Error processing ExpenseUpdated side-effects for user {}: {}",
                    event.getProfile().getId(), e.getMessage(), e);
        }
    }

    // ─── Income Created ──────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onIncomeCreated(TransactionEvents.IncomeCreated event) {
        try {
            notificationService.notifyIncomeAdded(event.getProfile(), event.getIncomeName(), event.getAmount());
        } catch (Exception e) {
            log.error("Error processing IncomeCreated side-effects for user {}: {}",
                    event.getProfile().getId(), e.getMessage(), e);
        }
    }
}
