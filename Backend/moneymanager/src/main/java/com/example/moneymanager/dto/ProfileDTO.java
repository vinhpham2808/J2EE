package com.example.moneymanager.dto;

import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.entity.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfileDTO {

    private Long id;
    private String fullName;
    private String email;
    private String profileImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private SubscriptionPlan subscriptionPlan;
    private SubscriptionStatus subscriptionStatus;
    private LocalDate subscriptionActivatedAt;
    private LocalDate subscriptionExpiresAt;
    private Boolean autoRenew;
    private Integer categoryLimit;
    private Integer monthlyTransactionLimit;
    private Integer historyMonths;
    private Boolean canExportReports;
    private Boolean canUseAdvancedFilters;
    private Boolean canImportReceipt;
    private Boolean canUseDetailedAi;
    private String role;
}
