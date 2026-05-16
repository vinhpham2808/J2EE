package com.example.moneymanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIIntentRequestDTO {
    private String provider;
    private String model;
    private String userMessage;
    private String pageContext;
    private List<AIChatMessageDTO> conversationHistory;
}
