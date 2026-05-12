package com.example.moneymanager.dto;

import lombok.Data;

@Data
public class AdminUserUpdateDTO {
    private String fullName;
    private Boolean isActive;
    private String subscriptionPlan;  // FREE, BASIC, PREMIUM
    private String role;              // user, admin
}
