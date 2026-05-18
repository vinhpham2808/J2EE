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
public class AIIntentResponseDTO {
    private String status;
    private String intent;
    private Map<String, Object> extractedFields;
    private Map<String, Object> suggestedValues;
    private List<String> validationErrors;
    private String confirmationPrompt;
    private String answer;
    private String reply;
    private String provider;
    private String modelUsed;
}
