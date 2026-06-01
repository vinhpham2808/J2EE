package com.example.moneymanager.service;

import com.example.moneymanager.dto.*;
import com.example.moneymanager.entity.OtpPurpose;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.entity.SubscriptionStatus;
import com.example.moneymanager.exception.OtpCooldownException;
import com.example.moneymanager.entity.RoleEntity;
import com.example.moneymanager.repository.ProfileRepository;
import com.example.moneymanager.repository.RoleRepository;
import com.example.moneymanager.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final SubscriptionService subscriptionService;
    private final EmailNotificationPreferenceService emailNotificationPreferenceService;
    private final OtpService otpService;

    @Autowired @Lazy
    private NotificationService notificationService;

    // ─── Registration ─────────────────────────────────────────────────

    public ProfileDTO registerProfile(RegisterRequestDTO registerDTO) {
        profileRepository.findByEmail(registerDTO.getEmail().trim()).ifPresent(p -> {
            throw new RuntimeException("Email này đã được sử dụng.");
        });

        RoleEntity userRole = roleRepository.findByNameIgnoreCase("user")
                .orElseThrow(() -> new RuntimeException("Role 'user' not found in database"));

        String encodedPassword = null;
        if (registerDTO.getPassword() != null && !registerDTO.getPassword().isBlank()) {
            if (registerDTO.getPassword().trim().length() < 8) {
                throw new RuntimeException("Mật khẩu phải có ít nhất 8 ký tự.");
            }
            encodedPassword = passwordEncoder.encode(registerDTO.getPassword().trim());
        }

        ProfileEntity newProfile = ProfileEntity.builder()
                .fullName(registerDTO.getFullName() != null ? registerDTO.getFullName().trim() : "")
                .email(registerDTO.getEmail().trim())
                .password(encodedPassword)
                .profileImageUrl(registerDTO.getProfileImageUrl())
                .isActive(false)
                .subscriptionPlan(SubscriptionPlan.FREE)
                .subscriptionStatus(SubscriptionStatus.INACTIVE)
                .autoRenew(false)
                .role(userRole)
                .build();
        newProfile = profileRepository.save(newProfile);

        emailNotificationPreferenceService.initializeDefaultPreferences(newProfile.getId());
        otpService.generateAndSendOtp(newProfile, OtpPurpose.ACCOUNT_ACTIVATION);

        return toDTO(newProfile);
    }

    public void completeProfile(CompleteProfileDTO dto) {
        ProfileEntity profile = profileRepository.findByEmail(dto.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này."));

        if (!Boolean.TRUE.equals(profile.getIsActive())) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt qua OTP.");
        }

        if (dto.getPassword().trim().length() < 8) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 8 ký tự.");
        }

        profile.setFullName(dto.getFullName().trim());
        profile.setPassword(passwordEncoder.encode(dto.getPassword().trim()));
        profileRepository.save(profile);
    }

    // ─── Account Activation via OTP ──────────────────────────────────

    public void activateProfileWithOtp(VerifyActivationOtpDTO dto) {
        ProfileEntity profile = profileRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này."));

        if (Boolean.TRUE.equals(profile.getIsActive())) {
            throw new RuntimeException("Tài khoản đã được kích hoạt trước đó.");
        }

        otpService.validateOtp(profile, dto.getOtp(), OtpPurpose.ACCOUNT_ACTIVATION);

        profile.setIsActive(true);
        profileRepository.save(profile);

        notificationService.sendWelcomeAsync(profile);
    }

    // ─── OTP Resend (for both activation and password reset) ─────────

    public void resendOtp(String email) {
        Optional<ProfileEntity> profileOpt = profileRepository.findByEmail(email);
        if (profileOpt.isEmpty()) {
            // Silent success to prevent email enumeration
            return;
        }

        ProfileEntity profile = profileOpt.get();

        if (!otpService.canResend(profile)) {
            long waitSeconds = otpService.getResendWaitSeconds(profile);
            throw new OtpCooldownException(waitSeconds);
        }

        // Determine purpose: if account is not active → activation OTP; otherwise password reset
        OtpPurpose purpose = profile.getOtpPurpose() != null
                ? profile.getOtpPurpose()
                : (Boolean.TRUE.equals(profile.getIsActive()) ? OtpPurpose.PASSWORD_RESET : OtpPurpose.ACCOUNT_ACTIVATION);

        otpService.generateAndSendOtp(profile, purpose);
    }

    // ─── Forgot Password ─────────────────────────────────────────────

    public void forgotPassword(ForgotPasswordRequestDTO requestDTO) {
        Optional<ProfileEntity> profileOpt = profileRepository.findByEmail(requestDTO.getEmail().trim());

        if (profileOpt.isEmpty()) {
            throw new RuntimeException("Email này chưa được đăng ký trong hệ thống.");
        }

        ProfileEntity profile = profileOpt.get();

        if (!Boolean.TRUE.equals(profile.getIsActive())) {
            throw new RuntimeException("Tài khoản này chưa được kích hoạt.");
        }
        if (profile.getPassword() == null && profile.getGoogleId() != null) {
            throw new RuntimeException("Tài khoản này đăng nhập bằng Google.");
        }

        if (!otpService.canResend(profile)) {
            long waitSeconds = otpService.getResendWaitSeconds(profile);
            throw new OtpCooldownException(waitSeconds);
        }

        otpService.generateAndSendOtp(profile, OtpPurpose.PASSWORD_RESET);
    }

    // ─── Verify Reset OTP (step 1 of 2 — identity check, no password change) ────

    public void verifyResetOtp(VerifyActivationOtpDTO dto) {
        ProfileEntity profile = profileRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này."));
        otpService.checkOtpOnly(profile, dto.getOtp(), OtpPurpose.PASSWORD_RESET);
    }

    // ─── Reset Password via OTP (step 2 of 2 — consumes OTP + sets new password) ─

    public void resetPasswordWithOtp(ResetPasswordOtpDTO dto) {
        ProfileEntity profile = profileRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này."));

        if (dto.getNewPassword().trim().length() < 8) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 8 ký tự.");
        }

        otpService.validateOtp(profile, dto.getOtp(), OtpPurpose.PASSWORD_RESET);

        profile.setPassword(passwordEncoder.encode(dto.getNewPassword().trim()));
        profileRepository.save(profile);
    }

    // ─── Login ───────────────────────────────────────────────────────

    public boolean isAccountActive(String email) {
        return profileRepository.findByEmail(email)
                .map(ProfileEntity::getIsActive)
                .orElse(false);
    }

    public Map<String, Object> authenticateAndGenerateToken(AuthDTO authDTO) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authDTO.getEmail(), authDTO.getPassword()));
            String token = jwtUtil.generateToken(authDTO.getEmail());
            return Map.of("token", token, "user", getPublicProfile(authDTO.getEmail()));
        } catch (Exception e) {
            throw new RuntimeException("Email hoặc mật khẩu không đúng.");
        }
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.example.moneymanager.security.CurrentProfileContext currentProfileContext;

    // ─── Profile ─────────────────────────────────────────────────────

    /**
     * Lấy profile của user hiện tại.
     * Ưu tiên dùng request-scope cache (CurrentProfileContext) để tránh double DB lookup:
     * - Lần 1 đã query trong JwtRequestFilter → kết quả được đặt vào CurrentProfileContext
     * - Lần 2+ trong service gọi getCurrentProfile() → dùng cache, KHÔNG query DB
     * Fallback về DB nếu context chưa có (non-HTTP thread, scheduled job, test).
     */
    public ProfileEntity getCurrentProfile() {
        // 1. Thử lấy từ request-scope context (đã được set bởi JwtRequestFilter)
        if (currentProfileContext != null && currentProfileContext.getCachedProfile() != null) {
            ProfileEntity cached = currentProfileContext.getCachedProfile();
            // Nếu chỉ có id+email (partial stub từ JwtRequestFilter), load full entity một lần
            if (cached.getRole() == null) {
                ProfileEntity full = profileRepository.findByEmail(cached.getEmail())
                        .orElseThrow(() -> new UsernameNotFoundException(
                                "Không tìm thấy tài khoản với email: " + cached.getEmail()));
                currentProfileContext.setCachedProfile(full);
                return full;
            }
            return cached;
        }

        // 2. Fallback: query DB theo SecurityContext (scheduled job, test context, v.v.)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        ProfileEntity profile = profileRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Không tìm thấy tài khoản với email: " + authentication.getName()));

        // Cache lại nếu context tồn tại
        if (currentProfileContext != null) {
            currentProfileContext.setCachedProfile(profile);
        }
        return profile;
    }

    public ProfileDTO getPublicProfile(String email) {
        ProfileEntity profile = email == null
                ? getCurrentProfile()
                : profileRepository.findByEmail(email)
                        .orElseThrow(() -> new UsernameNotFoundException(
                                "Không tìm thấy tài khoản với email: " + email));
        return toDTO(profile);
    }

    public Map<String, Object> updateProfile(ProfileUpdateDTO requestDTO) {
        ProfileEntity profile = getCurrentProfile();

        String fullName = requestDTO.getFullName() != null ? requestDTO.getFullName().trim() : "";
        String email = requestDTO.getEmail() != null ? requestDTO.getEmail().trim() : "";

        if (fullName.isBlank()) throw new RuntimeException("Họ và tên không được để trống.");
        if (email.isBlank()) throw new RuntimeException("Email không được để trống.");

        if (!email.equalsIgnoreCase(profile.getEmail()) && profileRepository.existsByEmail(email)) {
            throw new RuntimeException("Email này đã được sử dụng.");
        }

        boolean isEmailChange = !email.equalsIgnoreCase(profile.getEmail());
        if (isEmailChange) {
            if (requestDTO.getCurrentPassword() == null || requestDTO.getCurrentPassword().isBlank()) {
                throw new RuntimeException("Vui lòng nhập mật khẩu hiện tại để đổi email.");
            }
            if (profile.getPassword() == null || !passwordEncoder.matches(requestDTO.getCurrentPassword(), profile.getPassword())) {
                throw new RuntimeException("Mật khẩu hiện tại không chính xác.");
            }
        }

        boolean wantsPasswordChange =
                (requestDTO.getCurrentPassword() != null && !requestDTO.getCurrentPassword().isBlank())
                || (requestDTO.getNewPassword() != null && !requestDTO.getNewPassword().isBlank());

        if (wantsPasswordChange) {
            if (requestDTO.getCurrentPassword() == null || requestDTO.getCurrentPassword().isBlank())
                throw new RuntimeException("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.");
            if (requestDTO.getNewPassword() == null || requestDTO.getNewPassword().isBlank())
                throw new RuntimeException("Vui lòng nhập mật khẩu mới.");
            if (!passwordEncoder.matches(requestDTO.getCurrentPassword(), profile.getPassword()))
                throw new RuntimeException("Mật khẩu hiện tại không chính xác.");
            if (requestDTO.getNewPassword().trim().length() < 6)
                throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự.");
            profile.setPassword(passwordEncoder.encode(requestDTO.getNewPassword().trim()));
        }

        profile.setFullName(fullName);
        profile.setEmail(email);
        if (requestDTO.getProfileImageUrl() != null) {
            profile.setProfileImageUrl(requestDTO.getProfileImageUrl());
        }
        profile = profileRepository.save(profile);

        return Map.of("token", jwtUtil.generateToken(profile.getEmail()), "user", toDTO(profile));
    }

    public ProfileDTO updateAutoRenew(AutoRenewRequestDTO requestDTO) {
        ProfileEntity profile = getCurrentProfile();
        profile.setAutoRenew(Boolean.TRUE.equals(requestDTO.getEnabled()));
        profile = profileRepository.save(profile);
        return toDTO(profile);
    }

    // ─── Converters ──────────────────────────────────────────────────

    public ProfileDTO toDTO(ProfileEntity profileEntity) {
        profileEntity = subscriptionService.refreshSubscriptionIfExpired(profileEntity);
        SubscriptionService.PlanFeatures planFeatures = subscriptionService.getPlanFeatures(profileEntity);

        return ProfileDTO.builder()
                .id(profileEntity.getId())
                .fullName(profileEntity.getFullName())
                .email(profileEntity.getEmail())
                .profileImageUrl(profileEntity.getProfileImageUrl())
                .createdAt(profileEntity.getCreatedAt())
                .updatedAt(profileEntity.getUpdatedAt())
                .subscriptionPlan(profileEntity.getSubscriptionPlan())
                .subscriptionStatus(profileEntity.getSubscriptionStatus())
                .subscriptionActivatedAt(profileEntity.getSubscriptionActivatedAt())
                .subscriptionExpiresAt(profileEntity.getSubscriptionExpiresAt())
                .autoRenew(profileEntity.getAutoRenew())
                .categoryLimit(planFeatures.getCategoryLimit())
                .jarLimit(planFeatures.getJarLimit())
                .monthlyTransactionLimit(planFeatures.getMonthlyTransactionLimit())
                .historyMonths(planFeatures.getHistoryMonths())
                .canExportReports(planFeatures.isCanExportReports())
                .canUseAdvancedFilters(planFeatures.isCanUseAdvancedFilters())
                .canImportReceipt(planFeatures.isCanImportReceipt())
                .canUseDetailedAi(planFeatures.isCanUseDetailedAi())
                .role(profileEntity.getRole() != null ? profileEntity.getRole().getName() : "user")
                .build();
    }
}
