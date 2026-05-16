package com.example.moneymanager.controller;

import com.example.moneymanager.dto.*;
import com.example.moneymanager.service.EmailNotificationPreferenceService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.service.AIRateLimitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final EmailNotificationPreferenceService emailNotificationPreferenceService;
    private final AIRateLimitService aiRateLimitService;

    // ─── Registration ─────────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<?> registerProfile(@Valid @RequestBody RegisterRequestDTO registerDTO) {
        try {
            ProfileDTO registered = profileService.registerProfile(registerDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Đăng ký thành công. Mã OTP đã được gửi tới email của bạn.",
                "user", registered
            ));
        } catch (RuntimeException e) {
            String email = registerDTO.getEmail();
            if (profileService.isRegisteredButInactive(email)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "message", "Tài khoản chưa được kích hoạt. Vui lòng nhập mã OTP trong email.",
                        "needsActivation", true,
                        "email", email
                ));
            }
            throw e;
        }
    }

    // ─── OTP: Account Activation ─────────────────────────────────────

    @PostMapping("/verify-activation")
    public ResponseEntity<Map<String, String>> verifyActivation(@Valid @RequestBody VerifyActivationOtpDTO dto) {
        profileService.activateProfileWithOtp(dto);
        return ResponseEntity.ok(Map.of("message", "Tài khoản đã được kích hoạt thành công."));
    }

    /**
     * Deprecated link-based activation — kept to return a clear 410 Gone for old email links.
     */
    @GetMapping("/activate")
    public ResponseEntity<Map<String, String>> activateDeprecated() {
        return ResponseEntity.status(HttpStatus.GONE).body(Map.of(
                "message", "Liên kết kích hoạt không còn được hỗ trợ. Vui lòng sử dụng mã OTP trong email mới nhất."
        ));
    }

    // ─── OTP Resend ──────────────────────────────────────────────────

    @PostMapping("/otp/resend")
    public ResponseEntity<Map<String, String>> resendOtp(@Valid @RequestBody OtpRequestDTO dto) {
        profileService.resendOtp(dto.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "Nếu email tồn tại trong hệ thống, mã OTP mới đã được gửi."
        ));
    }

    // ─── Login ───────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody AuthDTO authDTO) {
        if (!profileService.isAccountActive(authDTO.getEmail())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Tài khoản chưa được kích hoạt. Vui lòng nhập mã OTP trong email."
            ));
        }
        Map<String, Object> response = profileService.authenticateAndGenerateToken(authDTO);
        return ResponseEntity.ok(response);
    }

    // ─── Forgot Password / Reset Password via OTP ────────────────────

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequestDTO requestDTO) {
        profileService.forgotPassword(requestDTO);
        return ResponseEntity.ok(Map.of(
                "message", "Nếu email tồn tại và tài khoản đã kích hoạt, mã OTP sẽ được gửi."
        ));
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<Map<String, String>> verifyResetOtp(@Valid @RequestBody VerifyActivationOtpDTO dto) {
        profileService.verifyResetOtp(dto);
        return ResponseEntity.ok(Map.of("message", "Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPasswordWithOtp(@Valid @RequestBody ResetPasswordOtpDTO dto) {
        profileService.resetPasswordWithOtp(dto);
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công."));
    }

    /**
     * Deprecated token-based reset redirect — returns 410 Gone.
     */
    @GetMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPasswordDeprecated() {
        return ResponseEntity.status(HttpStatus.GONE).body(Map.of(
                "message", "Liên kết đặt lại mật khẩu không còn được hỗ trợ. Vui lòng sử dụng trang Quên mật khẩu."
        ));
    }

    // ─── Profile ─────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<ProfileDTO> getPublicProfile() {
        return ResponseEntity.ok(profileService.getPublicProfile(null));
    }

    @PutMapping("/complete-profile")
    public ResponseEntity<Map<String, Object>> completeProfile(@RequestBody SetupProfileDTO requestDTO) {
        try {
            Map<String, Object> response = profileService.completeProfile(requestDTO);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody ProfileUpdateDTO requestDTO) {
        return ResponseEntity.ok(profileService.updateProfile(requestDTO));
    }

    @PutMapping("/profile/subscription/auto-renew")
    public ResponseEntity<ProfileDTO> updateAutoRenew(@RequestBody AutoRenewRequestDTO requestDTO) {
        return ResponseEntity.ok(profileService.updateAutoRenew(requestDTO));
    }

    // ─── Email Preferences ───────────────────────────────────────────

    @GetMapping("/profile/email-preferences")
    public ResponseEntity<List<EmailNotificationPreferenceDTO>> getEmailPreferences() {
        Long userId = profileService.getCurrentProfile().getId();
        return ResponseEntity.ok(emailNotificationPreferenceService.getUserPreferences(userId));
    }

    @PutMapping("/profile/email-preferences")
    public ResponseEntity<Map<String, String>> updateEmailPreferences(
            @RequestBody List<EmailNotificationPreferenceDTO> preferences) {
        if (preferences == null || preferences.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Danh sách cài đặt không được rỗng."));
        }
        Long userId = profileService.getCurrentProfile().getId();
        emailNotificationPreferenceService.updatePreferences(userId, preferences);
        return ResponseEntity.ok(Map.of("message", "Cập nhật cài đặt email thành công."));
    }

    @PostMapping("/profile/email-preferences/reset")
    public ResponseEntity<Map<String, String>> resetEmailPreferences() {
        Long userId = profileService.getCurrentProfile().getId();
        emailNotificationPreferenceService.resetToDefaults(userId);
        return ResponseEntity.ok(Map.of("message", "Đặt lại cài đặt email về mặc định thành công."));
    }

    // ─── AI Usage ────────────────────────────────────────────────────

    @GetMapping("/profile/ai-usage")
    public ResponseEntity<AIUsageStatsDTO> getAIUsageStats() {
        return ResponseEntity.ok(aiRateLimitService.getAIUsageStats());
    }
}
