package com.example.moneymanager.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_subscription_plan_configs")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SubscriptionPlanConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã kế hoạch định danh (ví dụ: "basic", "premium") */
    @Column(nullable = false, unique = true, length = 50)
    private String planId;

    /** Tên hiển thị (ví dụ: "Gói Cơ Bản") */
    @Column(nullable = false, length = 100)
    private String displayName;

    /** Mô tả ngắn */
    @Column(length = 255)
    private String description;

    /** Giá (VND) */
    @Column(nullable = false)
    private Long amount;

    /** Mức độ đặc quyền (BASIC, PREMIUM) */
    @Column(nullable = false, length = 20)
    private String subscriptionPlan;

    /** Nhãn chu kỳ hiển thị (ví dụ: "1 tháng", "12 tháng") */
    @Column(length = 50)
    private String cycleLabel;

    /** Số tháng của chu kỳ */
    @Column(nullable = false)
    private Integer cycleMonths;

    /** Nhãn thẻ (ví dụ: "Phổ biến", "Nâng cao") */
    @Column(length = 50)
    private String badge;

    /** Tên icon (ví dụ: "ShieldCheck", "Sparkles") */
    @Column(length = 50)
    private String icon;

    /** Màu gradient accent CSS */
    @Column(length = 200)
    private String accent;

    /** Danh sách tính năng, ngăn cách bằng "\n" */
    @Column(columnDefinition = "TEXT")
    private String featuresRaw;

    /** Thứ tự hiển thị */
    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int displayOrder;

    @Column(updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
