package com.example.moneymanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VoiceParseResponseDTO {
    private String type; // EXPENSE or INCOME
    private BigDecimal amount;
    private String name;
    private String categoryHint;
    private String date; // YYYY-MM-DD
    private String note;
}
