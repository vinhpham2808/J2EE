package com.example.moneymanager.event;

import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("api")
public class TransactionEventHandler {

    private final SqsTemplate sqsTemplate;

    @Value("${app.sqs.queue-name}")
    private String queueName;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onExpenseCreated(TransactionEvents.ExpenseCreated event) {
        try {
            SqsTransactionMessage message = SqsTransactionMessage.builder()
                    .type("EXPENSE_CREATED")
                    .profileId(event.getProfile().getId())
                    .categoryId(event.getCategory().getId())
                    .transactionName(event.getExpenseName())
                    .amount(event.getAmount().longValue())
                    .transactionDate(event.getExpenseDate().toString())
                    .build();
            sqsTemplate.send(queueName, message);
            log.info("Successfully pushed EXPENSE_CREATED event to SQS queue: {}", queueName);
        } catch (Exception e) {
            log.error("Failed to push EXPENSE_CREATED event to SQS: {}", e.getMessage(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onExpenseUpdated(TransactionEvents.ExpenseUpdated event) {
        try {
            SqsTransactionMessage message = SqsTransactionMessage.builder()
                    .type("EXPENSE_UPDATED")
                    .profileId(event.getProfile().getId())
                    .categoryId(event.getCategory().getId())
                    .transactionName(event.getExpenseName())
                    .amount(event.getAmount().longValue())
                    .transactionDate(event.getExpenseDate().toString())
                    .build();
            sqsTemplate.send(queueName, message);
            log.info("Successfully pushed EXPENSE_UPDATED event to SQS queue: {}", queueName);
        } catch (Exception e) {
            log.error("Failed to push EXPENSE_UPDATED event to SQS: {}", e.getMessage(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onIncomeCreated(TransactionEvents.IncomeCreated event) {
        try {
            SqsTransactionMessage message = SqsTransactionMessage.builder()
                    .type("INCOME_CREATED")
                    .profileId(event.getProfile().getId())
                    .transactionName(event.getIncomeName())
                    .amount(event.getAmount().longValue())
                    .transactionDate(java.time.LocalDate.now().toString())
                    .build();
            sqsTemplate.send(queueName, message);
            log.info("Successfully pushed INCOME_CREATED event to SQS queue: {}", queueName);
        } catch (Exception e) {
            log.error("Failed to push INCOME_CREATED event to SQS: {}", e.getMessage(), e);
        }
    }
}
