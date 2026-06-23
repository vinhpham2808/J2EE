package com.example.moneymanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReceiptImportAnalyzeResponseDTO {
    private String merchant;
    private String location;
    private LocalDate receiptDate;
    private Integer detectedItemCount;
    private List<ReceiptImportItemDTO> items;
    private String receiptImageUrl;
}
