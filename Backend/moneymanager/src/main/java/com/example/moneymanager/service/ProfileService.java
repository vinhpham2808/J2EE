package com.example.moneymanager.service;

import com.example.moneymanager.dto.AuthDTO;
import com.example.moneymanager.dto.AutoRenewRequestDTO;
import com.example.moneymanager.dto.ForgotPasswordRequestDTO;
import com.example.moneymanager.dto.ProfileDTO;
import com.example.moneymanager.dto.ProfileUpdateDTO;
import com.example.moneymanager.dto.ResetPasswordRequestDTO;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.ProfileRepository;
import com.example.moneymanager.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final AwsSesEmailService awsSesEmailService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final SubscriptionService subscriptionService;

    @Value("${app.activation.url}")
    private String activationURL;

    @Value("${app.reset-password.url}")
    private String resetPasswordURL;

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final int OTP_EXPIRY_MINUTES = 30;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 90;

    public ProfileDTO registerProfile(ProfileDTO profileDTO) {
        profileRepository.findByEmail(profileDTO.getEmail()).ifPresent(profile -> {
            throw new RuntimeException("Email này đã được sử dụng.");
        });

        // Chỉ tạo profile với email — fullName và password sẽ được người dùng
        // nhập sau qua /complete-profile (tránh dữ liệu tạm không chính xác)
        ProfileEntity newProfile = ProfileEntity.builder()
                .email(profileDTO.getEmail())
                .profileImageUrl(profileDTO.getProfileImageUrl())
                .build();
        newProfile.setIsActive(false);
        newProfile.setSubscriptionPlan(com.example.moneymanager.entity.SubscriptionPlan.FREE);
        newProfile.setSubscriptionStatus(com.example.moneymanager.entity.SubscriptionStatus.INACTIVE);
        newProfile.setAutoRenew(false);
        newProfile = profileRepository.save(newProfile);

        // Tạo và gửi mã OTP
        sendOtpEmail(newProfile);

        return toDTO(newProfile);
    }

    private void sendOtpEmail(ProfileEntity profile) {
        String otpCode = String.valueOf(100000 + secureRandom.nextInt(900000));
        profile.setOtpCode(otpCode);
        profile.setOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        profile.setOtpSentAt(LocalDateTime.now());
        profile.setOtpAttempts(0);
        profileRepository.save(profile);

        // Nếu fullName chưa được nhập, dùng "bạn" làm tên hiển thị trong email
        String displayName = profile.getFullName() != null ? profile.getFullName() : "bạn";
        String subject = "Mã xác thực tài khoản Money Manager";
        String body = buildOtpEmailBody(otpCode, displayName);
        awsSesEmailService.sendHtmlEmail(profile.getEmail(), subject, body);
    }

    private String buildOtpEmailBody(String otpCode, String fullName) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #dc2626, #1e1b4b); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Money Manager</h1>
                    </div>
                    <div style="padding: 30px;">
                        <h2 style="color: #333; margin-top: 0;">Xác thực tài khoản</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">Xin chào <strong>%s</strong>,</p>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Cảm ơn bạn đã đăng ký tài khoản Money Manager. Vui lòng nhập mã OTP dưới đây để xác thực tài khoản của bạn:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; background: #f0f0f0; border-radius: 12px; padding: 20px 40px; letter-spacing: 12px; font-size: 36px; font-weight: bold; color: #dc2626;">
                                %s
                            </div>
                        </div>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Mã OTP này có hiệu lực trong <strong>%d phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
                        </p>
                        <p style="color: #999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                            Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email này.
                        </p>
                    </div>
                    <div style="background: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px; margin: 0;">© 2024 Money Manager. Tất cả quyền được bảo lưu.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(fullName, otpCode, OTP_EXPIRY_MINUTES);
    }

    public void verifyOtp(String email, String otpCode) {
        ProfileEntity profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này."));

        if (profile.getIsActive()) {
            throw new RuntimeException("Tài khoản này đã được kích hoạt.");
        }

        if (profile.getOtpCode() == null || profile.getOtpExpiry() == null) {
            throw new RuntimeException("Mã OTP chưa được gửi hoặc đã hết hạn. Vui lòng yêu cầu gửi lại mã.");
        }

        if (profile.getOtpExpiry().isBefore(LocalDateTime.now())) {
            profile.setOtpCode(null);
            profile.setOtpExpiry(null);
            profile.setOtpSentAt(null);
            profile.setOtpAttempts(null);
            profileRepository.save(profile);
            throw new RuntimeException("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã.");
        }

        if (profile.getOtpAttempts() != null && profile.getOtpAttempts() >= MAX_OTP_ATTEMPTS) {
            profile.setOtpCode(null);
            profile.setOtpExpiry(null);
            profile.setOtpSentAt(null);
            profile.setOtpAttempts(null);
            profileRepository.save(profile);
            throw new RuntimeException("Bạn đã nhập sai mã OTP quá " + MAX_OTP_ATTEMPTS + " lần. Vui lòng yêu cầu gửi lại mã.");
        }

        if (!otpCode.equals(profile.getOtpCode())) {
            profile.setOtpAttempts(profile.getOtpAttempts() == null ? 1 : profile.getOtpAttempts() + 1);
            profileRepository.save(profile);
            int remaining = MAX_OTP_ATTEMPTS - profile.getOtpAttempts();
            throw new RuntimeException("Mã OTP không đúng. Còn " + remaining + " lần thử.");
        }

        // OTP đúng -> kích hoạt tài khoản
        profile.setIsActive(true);
        profile.setOtpCode(null);
        profile.setOtpExpiry(null);
        profile.setOtpSentAt(null);
        profile.setOtpAttempts(null);
        profileRepository.save(profile);
    }

    public void resendOtp(String email) {
        ProfileEntity profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này."));

        if (profile.getIsActive()) {
            throw new RuntimeException("Tài khoản này đã được kích hoạt.");
        }

        // Kiểm tra thời gian chờ giữa các lần gửi lại
        if (profile.getOtpSentAt() != null) {
            long secondsElapsed = java.time.Duration.between(profile.getOtpSentAt(), LocalDateTime.now()).getSeconds();
            if (secondsElapsed < RESEND_COOLDOWN_SECONDS) {
                long remaining = RESEND_COOLDOWN_SECONDS - secondsElapsed;
                throw new RuntimeException("Vui lòng đợi " + remaining + " giây trước khi yêu cầu gửi lại mã OTP.");
            }
        }

        // Tạo và gửi lại mã OTP mới
        sendOtpEmail(profile);
    }

    public ProfileEntity toEntity(ProfileDTO profileDTO) {
        return ProfileEntity.builder()
                .id(profileDTO.getId())
                .fullName(profileDTO.getFullName())
                .email(profileDTO.getEmail())
                .password(passwordEncoder.encode(profileDTO.getPassword()))
                .profileImageUrl(profileDTO.getProfileImageUrl())
                .createdAt(profileDTO.getCreatedAt())
                .updatedAt(profileDTO.getUpdatedAt())
                .build();
    }

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
                .monthlyTransactionLimit(planFeatures.getMonthlyTransactionLimit())
                .historyMonths(planFeatures.getHistoryMonths())
                .canExportReports(planFeatures.isCanExportReports())
                .canUseAdvancedFilters(planFeatures.isCanUseAdvancedFilters())
                .canImportReceipt(planFeatures.isCanImportReceipt())
                .canUseDetailedAi(planFeatures.isCanUseDetailedAi())
                .role(profileEntity.getRole() != null ? profileEntity.getRole().getName() : "user")
                .build();
    }

    public boolean activateProfile(String activationToken) {
        return profileRepository.findByActivationToken(activationToken)
                .map(profile -> {
                    profile.setIsActive(true);
                    profile.setActivationToken(null);
                    profileRepository.save(profile);
                    return true;
                })
                .orElse(false);
    }

    public boolean isAccountActive(String email) {
        return profileRepository.findByEmail(email)
                .map(ProfileEntity::getIsActive)
                .orElse(false);
    }

    public ProfileEntity getCurrentProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return profileRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản với email: " + authentication.getName()));
    }

    public ProfileDTO getPublicProfile(String email) {
        ProfileEntity currentUser = null;
        if (email == null) {
            currentUser = getCurrentProfile();
        }else {
            currentUser = profileRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản với email: " + email));
        }

        return toDTO(currentUser);
    }

    public Map<String, Object> completeProfile(com.example.moneymanager.dto.SetupProfileDTO requestDTO) {
        ProfileEntity profile = profileRepository.findByEmail(requestDTO.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này."));

        if (!profile.getIsActive()) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt. Vui lòng xác thực OTP trước.");
        }

        String fullName = requestDTO.getFullName() != null ? requestDTO.getFullName().trim() : "";
        if (fullName.isBlank()) {
            throw new RuntimeException("Họ và tên không được để trống.");
        }

        String password = requestDTO.getPassword();
        if (password == null || password.isBlank()) {
            throw new RuntimeException("Mật khẩu không được để trống.");
        }
        if (password.length() < 6) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 6 ký tự.");
        }

        profile.setFullName(fullName);
        profile.setPassword(passwordEncoder.encode(password));
        profile = profileRepository.save(profile);

        return Map.of(
                "token", jwtUtil.generateToken(profile.getEmail()),
                "user", toDTO(profile)
        );
    }

    public Map<String, Object> updateProfile(ProfileUpdateDTO requestDTO) {
        ProfileEntity profile = getCurrentProfile();

        String fullName = requestDTO.getFullName() != null ? requestDTO.getFullName().trim() : "";
        String email = requestDTO.getEmail() != null ? requestDTO.getEmail().trim() : "";

        if (fullName.isBlank()) {
            throw new RuntimeException("Họ và tên không được để trống.");
        }

        if (email.isBlank()) {
            throw new RuntimeException("Email không được để trống.");
        }

        if (!email.equalsIgnoreCase(profile.getEmail()) && profileRepository.existsByEmail(email)) {
            throw new RuntimeException("Email này đã được sử dụng.");
        }

        boolean wantsPasswordChange =
                (requestDTO.getCurrentPassword() != null && !requestDTO.getCurrentPassword().isBlank())
                        || (requestDTO.getNewPassword() != null && !requestDTO.getNewPassword().isBlank());

        if (wantsPasswordChange) {
            if (requestDTO.getCurrentPassword() == null || requestDTO.getCurrentPassword().isBlank()) {
                throw new RuntimeException("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.");
            }

            if (requestDTO.getNewPassword() == null || requestDTO.getNewPassword().isBlank()) {
                throw new RuntimeException("Vui lòng nhập mật khẩu mới.");
            }

            if (!passwordEncoder.matches(requestDTO.getCurrentPassword(), profile.getPassword())) {
                throw new RuntimeException("Mật khẩu hiện tại không chính xác.");
            }

            if (requestDTO.getNewPassword().trim().length() < 6) {
                throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự.");
            }

            profile.setPassword(passwordEncoder.encode(requestDTO.getNewPassword().trim()));
        }

        profile.setFullName(fullName);
        profile.setEmail(email);
        profile.setProfileImageUrl(requestDTO.getProfileImageUrl());

        profile = profileRepository.save(profile);

        return Map.of(
                "token", jwtUtil.generateToken(profile.getEmail()),
                "user", toDTO(profile)
        );
    }

    public Map<String, Object> authenticateAndGenerateToken(AuthDTO authDTO) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(authDTO.getEmail(), authDTO.getPassword()));
            // Tạo JWT token
            String token = jwtUtil.generateToken(authDTO.getEmail());
            return Map.of(
                    "token", token,
                    "user", getPublicProfile(authDTO.getEmail())
            );
        } catch (Exception e) {
            throw new RuntimeException("Email hoặc mật khẩu không đúng.");
        }
    }

    public ProfileDTO updateAutoRenew(AutoRenewRequestDTO requestDTO) {
        ProfileEntity profile = getCurrentProfile();
        profile.setAutoRenew(Boolean.TRUE.equals(requestDTO.getEnabled()));
        profile = profileRepository.save(profile);
        return toDTO(profile);
    }

    // Các phương thức cho chức năng quên mật khẩu

    public void forgotPassword(ForgotPasswordRequestDTO requestDTO) {
        ProfileEntity profile = profileRepository.findByEmail(requestDTO.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy email này."));

        if (!profile.getIsActive()) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt. Vui lòng kích hoạt tài khoản trước.");
        }

        // Tạo token đặt lại mật khẩu
        String resetToken = UUID.randomUUID().toString();
        profile.setResetPasswordToken(resetToken);
        profile.setResetPasswordTokenExpiry(LocalDateTime.now().plusHours(24)); // Token hết hạn sau 24 giờ

        profileRepository.save(profile);

        // Gửi email đặt lại mật khẩu
        String normalizedResetPasswordUrl = resetPasswordURL.endsWith("/")
                ? resetPasswordURL.substring(0, resetPasswordURL.length() - 1)
                : resetPasswordURL;
        String resetLink = normalizedResetPasswordUrl + "/reset-password?token=" + resetToken;

        String subject = "Đặt lại mật khẩu Money Manager";
        String body = "Nhấn vào liên kết sau để đặt lại mật khẩu của bạn: " + resetLink +
                "\n\nLiên kết này sẽ hết hạn sau 24 giờ.\n" +
                "Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email này.";

        awsSesEmailService.sendEmail(profile.getEmail(), subject, body);
    }

    public void resetPassword(ResetPasswordRequestDTO requestDTO) {
        ProfileEntity profile = profileRepository.findByResetPasswordToken(requestDTO.getToken())
                .orElseThrow(() -> new RuntimeException("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."));

        // Kiểm tra token đã hết hạn chưa
        if (profile.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            // Xóa token đã hết hạn
            profile.setResetPasswordToken(null);
            profile.setResetPasswordTokenExpiry(null);
            profileRepository.save(profile);
            throw new RuntimeException("Liên kết đặt lại mật khẩu đã hết hạn.");
        }

        // Cập nhật mật khẩu mới
        profile.setPassword(passwordEncoder.encode(requestDTO.getNewPassword()));
        // Xóa token sau khi đã sử dụng
        profile.setResetPasswordToken(null);
        profile.setResetPasswordTokenExpiry(null);

        profileRepository.save(profile);
    }
}
