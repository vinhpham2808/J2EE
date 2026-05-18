package com.example.moneymanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIConfirmActionResponseDTO {
    private String status;
    private String message;
    private boolean undoable;
    private Long operationId;
}
