package com.example.moneymanager.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "tbl_email_notification_preferences",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_profile_type",
        columnNames = {"profile_id", "notification_type"}
    )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailNotificationPreferenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private ProfileEntity profile;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private EmailNotificationType type;

    @Column(name = "is_enabled")
    private Boolean isEnabled;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
