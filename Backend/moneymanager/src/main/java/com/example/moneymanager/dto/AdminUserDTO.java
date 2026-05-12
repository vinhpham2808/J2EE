package com.example.moneymanager.dto;

import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.entity.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserDTO {
    private Long id;
    private String fullName;
    private String email;
    private String profileImageUrl;
    private Boolean isActive;
    private String role;
    private SubscriptionPlan subscriptionPlan;
    private SubscriptionStatus subscriptionStatus;
    private LocalDate subscriptionExpiresAt;
    private LocalDateTime createdAt;
}
