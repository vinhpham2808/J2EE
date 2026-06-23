package com.example.moneymanager.config;

import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.entity.RoleEntity;
import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.entity.SubscriptionStatus;
import com.example.moneymanager.repository.ProfileRepository;
import com.example.moneymanager.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Tự động tạo tài khoản Admin mặc định khi hệ thống khởi động lần đầu.
 * <p>
 * Chạy sau RoleInitializer (Order = 2) để đảm bảo role 'admin' đã tồn tại.
 * Bị bỏ qua nếu tài khoản đã tồn tại (idempotent).
 * </p>
 *
 * <b>⚠️ Bắt buộc đổi mật khẩu sau khi đăng nhập lần đầu!</b>
 *
 * Cấu hình qua application.properties:
 * <pre>
 *   app.admin.email=admin@botdevgroup.me      (default)
 *   app.admin.password=Admin@123456           (default — ĐỔI NGAY SAU DEPLOY!)
 *   app.admin.fullName=System Admin           (default)
 * </pre>
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
@ConditionalOnProperty(name = "app.seeders.enabled", havingValue = "true", matchIfMissing = true)
public class AdminSeeder implements CommandLineRunner {

    private final ProfileRepository profileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@botdevgroup.me}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123456}")
    private String adminPassword;

    @Value("${app.admin.fullName:System Admin}")
    private String adminFullName;

    @Override
    public void run(String... args) {
        if (profileRepository.findByEmail(adminEmail).isPresent()) {
            log.info("Admin account already exists: {}", adminEmail);
            return;
        }

        RoleEntity adminRole = roleRepository.findByNameIgnoreCase("admin")
                .orElseGet(() -> roleRepository.save(
                        RoleEntity.builder().name("admin").build()
                ));

        ProfileEntity admin = ProfileEntity.builder()
                .fullName(adminFullName)
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .isActive(true)
                .subscriptionPlan(SubscriptionPlan.FREE)
                .subscriptionStatus(SubscriptionStatus.INACTIVE)
                .autoRenew(false)
                .aiViolationScore(0)
                .role(adminRole)
                .build();

        profileRepository.save(admin);
        log.warn("========================================================");
        log.warn("  Admin account created: {}", adminEmail);
        log.warn("  ⚠️  PLEASE CHANGE THE DEFAULT PASSWORD IMMEDIATELY!");
        log.warn("========================================================");
    }
}
