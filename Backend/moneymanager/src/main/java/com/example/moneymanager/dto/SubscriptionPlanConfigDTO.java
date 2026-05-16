package com.example.moneymanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanConfigDTO {
    private Long id;
    private String planId;
    private String displayName;
    private String description;
    private Long amount;
    private String subscriptionPlan;
    private String cycleLabel;
    private Integer cycleMonths;
    private String badge;
    private String icon;
    private String accent;
    private List<String> features;
    private int displayOrder;
}
