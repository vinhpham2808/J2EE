package com.example.moneymanager.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_spending_tips")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingTipEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private ProfileEntity profile;

    @Column(columnDefinition = "TEXT")
    private String tipsContent;

    @CreationTimestamp
    private LocalDateTime generatedAt;
}
