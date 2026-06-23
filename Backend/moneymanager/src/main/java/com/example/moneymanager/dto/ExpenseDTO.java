package com.example.moneymanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ExpenseDTO {
    private Long id;
    private String name;
    private String icon;
    private String receiptLocation;
    private String receiptImageUrl;
    private String categoryName;
    private Long categoryId;
    private BigDecimal amount;
    private LocalDate date;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long jarId;
    private String jarName;
}
