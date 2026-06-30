package com.example.moneymanager.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SqsTransactionMessage implements Serializable {
    private String type; // EXPENSE_CREATED, EXPENSE_UPDATED, INCOME_CREATED
    private Long profileId;
    private Long categoryId;
    private String transactionName;
    private Long amount;
    private String transactionDate; // yyyy-MM-dd
}
