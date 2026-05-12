package com.example.moneymanager.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingTipsResponseDTO {
    private List<String> tips;
    private LocalDateTime timestamp;
    private String disclaimer;
}
