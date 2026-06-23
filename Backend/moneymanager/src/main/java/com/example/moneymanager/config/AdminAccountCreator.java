package com.example.moneymanager.config;

import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.entity.RoleEntity;
import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.entity.SubscriptionStatus;
import com.example.moneymanager.repository.ProfileRepository;
import com.example.moneymanager.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AdminAccountCreator implements CommandLineRunner {

    private final ProfileRepository profileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountCreator(ProfileRepository profileRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.profileRepository = profileRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String email = "admin@gmail.com";
        try {
            RoleEntity adminRole = roleRepository.findByNameIgnoreCase("admin")
                    .orElseThrow(() -> new RuntimeException("Role 'admin' not found in database"));

            Optional<ProfileEntity> existingProfile = profileRepository.findByEmail(email);
            if (existingProfile.isPresent()) {
                ProfileEntity profile = existingProfile.get();
                profile.setRole(adminRole);
                profile.setIsActive(true);
                profile.setPassword(passwordEncoder.encode("Admin@123456"));
                profileRepository.save(profile);
                System.out.println("==================================================");
                System.out.println("UPDATED EXISTING USER TO ADMIN AND RESET PASSWORD SUCCESSFULLY!");
                System.out.println("Email: " + email);
                System.out.println("Password: Admin@123456");
                System.out.println("==================================================");
            } else {
                ProfileEntity adminProfile = ProfileEntity.builder()
                        .fullName("System Admin")
                        .email(email)
                        .password(passwordEncoder.encode("Admin@123456"))
                        .isActive(true)
                        .subscriptionPlan(SubscriptionPlan.PREMIUM)
                        .subscriptionStatus(SubscriptionStatus.ACTIVE)
                        .autoRenew(false)
                        .role(adminRole)
                        .build();
                profileRepository.save(adminProfile);
                System.out.println("==================================================");
                System.out.println("CREATED NEW ADMIN USER SUCCESSFULLY!");
                System.out.println("Email: " + email);
                System.out.println("Password: Admin@123456");
                System.out.println("==================================================");
            }
        } catch (Exception e) {
            System.err.println("Could not initialize admin account: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
