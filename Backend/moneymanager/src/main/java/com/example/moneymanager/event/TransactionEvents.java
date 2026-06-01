package com.example.moneymanager.event;

import com.example.moneymanager.entity.CategoryEntity;
import com.example.moneymanager.entity.ProfileEntity;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Domain events cho Expense / Income.
 * Được publish sau khi transaction commit xong (@TransactionalEventListener),
 * tách side-effects (notification, email, budget check) ra khỏi sync request path.
 */
public class TransactionEvents {

    /** Raised sau khi thêm expense thành công */
    @Getter
    public static class ExpenseCreated {
        private final ProfileEntity profile;
        private final String expenseName;
        private final BigDecimal amount;
        private final CategoryEntity category;
        private final LocalDate expenseDate;

        public ExpenseCreated(ProfileEntity profile, String expenseName, BigDecimal amount,
                              CategoryEntity category, LocalDate expenseDate) {
            this.profile = profile;
            this.expenseName = expenseName;
            this.amount = amount;
            this.category = category;
            this.expenseDate = expenseDate;
        }
    }

    /** Raised sau khi update expense thành công */
    @Getter
    public static class ExpenseUpdated {
        private final ProfileEntity profile;
        private final String expenseName;
        private final BigDecimal amount;
        private final CategoryEntity category;
        private final LocalDate expenseDate;

        public ExpenseUpdated(ProfileEntity profile, String expenseName, BigDecimal amount,
                              CategoryEntity category, LocalDate expenseDate) {
            this.profile = profile;
            this.expenseName = expenseName;
            this.amount = amount;
            this.category = category;
            this.expenseDate = expenseDate;
        }
    }

    /** Raised sau khi thêm income thành công */
    @Getter
    public static class IncomeCreated {
        private final ProfileEntity profile;
        private final String incomeName;
        private final BigDecimal amount;

        public IncomeCreated(ProfileEntity profile, String incomeName, BigDecimal amount) {
            this.profile = profile;
            this.incomeName = incomeName;
            this.amount = amount;
        }
    }
}
