package com.example.moneymanager.config;

import com.example.moneymanager.entity.SubscriptionPlanConfigEntity;
import com.example.moneymanager.repository.SubscriptionPlanConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seed dữ liệu gói thanh toán mặc định vào DB nếu chưa có bản ghi nào.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionPlanSeeder implements CommandLineRunner {

    private final SubscriptionPlanConfigRepository repository;

    @Override
    public void run(String... args) {
        if (repository.count() == 0) {
            log.info("Seeding default subscription plans...");
            repository.saveAll(List.of(
                SubscriptionPlanConfigEntity.builder()
                    .planId("basic")
                    .displayName("Gói Cơ Bản")
                    .description("Gói dành cho người dùng mới")
                    .amount(2000L)
                    .subscriptionPlan("BASIC")
                    .cycleLabel("1 tháng")
                    .cycleMonths(1)
                    .badge("Phổ biến")
                    .icon("ShieldCheck")
                    .accent("from-slate-900 via-slate-800 to-slate-700")
                    .featuresRaw("Theo dõi giao dịch hằng ngày\nPhân tích tài chính cơ bản bằng AI\nBáo cáo thu chi hàng tháng\nNhắc nhở thanh toán định kỳ")
                    .displayOrder(0)
                    .build(),
                SubscriptionPlanConfigEntity.builder()
                    .planId("premium")
                    .displayName("Gói Premium")
                    .description("Gói mở rộng với nhiều tính năng nâng cao")
                    .amount(299000L)
                    .subscriptionPlan("PREMIUM")
                    .cycleLabel("12 tháng")
                    .cycleMonths(12)
                    .badge("Nâng cao")
                    .icon("Sparkles")
                    .accent("from-amber-500 via-orange-500 to-rose-500")
                    .featuresRaw("Không giới hạn lịch sử giao dịch\nPhân tích tài chính chuyên sâu bằng AI\nImport hóa đơn bằng ảnh tự động\nXuất báo cáo Excel & PDF\nƯu tiên hỗ trợ kỹ thuật")
                    .displayOrder(1)
                    .build()
            ));
            log.info("Default subscription plans seeded successfully.");
        }
    }
}
