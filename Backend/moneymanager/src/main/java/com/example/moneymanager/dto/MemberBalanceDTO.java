package com.example.moneymanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberBalanceDTO {
    private Long memberId;
    private String memberName;
    private String avatarUrl;
    private BigDecimal netBalance; // Positive = owed (creditor), Negative = owes (debtor)
    private BigDecimal totalPaid;
    private BigDecimal totalOwed;
}
