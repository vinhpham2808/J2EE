package com.example.moneymanager.controller;

import com.example.moneymanager.dto.*;
import com.example.moneymanager.service.EmailNotificationPreferenceService;
import com.example.moneymanager.service.ProfileService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final EmailNotificationPreferenceService emailNotificationPreferenceService;

    @Value("${jwt.cookie.name:mm_token}")
    private String cookieName;

    @Value("${jwt.cookie.max-age:36000}")
    private int cookieMaxAge;

    @Value("${jwt.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${jwt.cookie.same-site:None}")
    private String cookieSameSite;

    // ─── Registration ─────────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<?> registerProfile(@Valid @RequestBody RegisterRequestDTO registerDTO, HttpServletResponse response) {
        // Clear any leftover mm_token cookie from prior sessions
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());

        ProfileDTO registered = profileService.registerProfile(registerDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Đăng ký thành công. Mã OTP đã được gửi tới email của bạn.",
                "user", registered
        ));
    }

    @GetMapping("/complete-profile")
    public ResponseEntity<Map<String, String>> completeProfileDeprecated() {
        return ResponseEntity.status(HttpStatus.GONE).body(Map.of(
                "message", "Endpoint này không còn được hỗ trợ. Vui lòng sử dụng flow đăng ký và kích hoạt OTP."
        ));
    }

    @PutMapping("/complete-profile")
    public ResponseEntity<Map<String, String>> completeProfileDeprecatedPut() {
        return ResponseEntity.status(HttpStatus.GONE).body(Map.of(
                "message", "Endpoint này không còn được hỗ trợ. Vui lòng sử dụng flow đăng ký và kích hoạt OTP."
        ));
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
    public ResponseEntity<Map<String, Object>> login(@RequestBody AuthDTO authDTO, HttpServletResponse response) {
        if (!profileService.isAccountActive(authDTO.getEmail())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Tài khoản chưa được kích hoạt. Vui lòng nhập mã OTP trong email."
            ));
        }
        Map<String, Object> result = profileService.authenticateAndGenerateToken(authDTO);
        String token = (String) result.get("token");
        
        ResponseCookie cookie = ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(cookieMaxAge)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
        
        return ResponseEntity.ok(Map.of(
                "message", "Đăng nhập thành công.",
                "token", token,
                "user", result.get("user")
        ));
    }

    // ─── Logout ──────────────────────────────────────────────────────

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công."));
    }

    // ─── Forgot Password / Reset Password via OTP ────────────────────

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequestDTO requestDTO) {
        profileService.forgotPassword(requestDTO);
        return ResponseEntity.ok(Map.of(
                "message", "Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn."
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

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody ProfileUpdateDTO requestDTO, HttpServletResponse response) {
        Map<String, Object> result = profileService.updateProfile(requestDTO);
        String token = (String) result.get("token");
        
        if (token != null) {
            ResponseCookie cookie = ResponseCookie.from(cookieName, token)
                    .httpOnly(true)
                    .secure(cookieSecure)
                    .sameSite(cookieSameSite)
                    .path("/")
                    .maxAge(cookieMaxAge)
                    .build();
            response.addHeader("Set-Cookie", cookie.toString());
        }
        
        return ResponseEntity.ok(Map.of("user", result.get("user")));
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

}
