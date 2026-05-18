package com.example.moneymanager.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_profiles")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String fullName;
    @Column(unique = true)
    private String email;
    @Column(nullable = true)
    private String password;
    private String profileImageUrl;
    @Column(updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    private Boolean isActive;
    private String activationToken;
    private String resetPasswordToken;
    private LocalDateTime resetPasswordTokenExpiry;

    @Enumerated(EnumType.STRING)
    private SubscriptionPlan subscriptionPlan;
    @Enumerated(EnumType.STRING)
    private SubscriptionStatus subscriptionStatus;
    private LocalDate subscriptionActivatedAt;
    private LocalDate subscriptionExpiresAt;
    private Boolean autoRenew;
    private String googleId;

    // OTP fields (shared for both ACCOUNT_ACTIVATION and PASSWORD_RESET flows)
    private String otpCode;                   // BCrypt-hashed OTP
    private LocalDateTime otpExpiry;          // 200s from generation
    private LocalDateTime otpResendAllowedAt; // 180s cooldown gate
    @Enumerated(EnumType.STRING)
    private OtpPurpose otpPurpose;
    private Integer otpAttempts;              // failed attempt counter (max 5)

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private RoleEntity role;

    @PrePersist
    public void prePersist() {
        if (this.isActive == null) {
            isActive = false;
        }
        if (this.subscriptionPlan == null) {
            subscriptionPlan = SubscriptionPlan.FREE;
        }
        if (this.subscriptionStatus == null) {
            subscriptionStatus = SubscriptionStatus.INACTIVE;
        }
        if (this.autoRenew == null) {
            autoRenew = false;
        }
    }
}