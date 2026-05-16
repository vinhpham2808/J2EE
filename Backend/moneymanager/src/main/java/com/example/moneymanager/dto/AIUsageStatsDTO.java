package com.example.moneymanager.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AIUsageStatsDTO {
    private String plan;
    private int chatUsed;
    private int chatLimit;
    private int agentUsed;
    private int agentLimit;
    private int otherAiUsed;
    private int otherAiLimit;
    private boolean isUnlimited;
}
