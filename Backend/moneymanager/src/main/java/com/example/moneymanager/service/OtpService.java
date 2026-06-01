package com.example.moneymanager.service;

import com.example.moneymanager.entity.OtpPurpose;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final int OTP_VALIDITY_SECONDS = 210; // > OTP_RESEND_COOLDOWN_SECONDS to prevent stuck state
    private static final int OTP_RESEND_COOLDOWN_SECONDS = 180;
    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailTemplateService mailTemplateService;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * Generates a 6-digit OTP, hashes it, stores it on the profile, and sends the HTML email.
     * Overwrites any existing OTP so old codes are immediately invalidated on resend.
     */
    public void generateAndSendOtp(ProfileEntity profile, OtpPurpose purpose) {
        String rawOtp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));

        profile.setOtpCode(passwordEncoder.encode(rawOtp));
        profile.setOtpExpiry(LocalDateTime.now().plusSeconds(OTP_VALIDITY_SECONDS));
        profile.setOtpResendAllowedAt(LocalDateTime.now().plusSeconds(OTP_RESEND_COOLDOWN_SECONDS));
        profile.setOtpPurpose(purpose);
        profile.setOtpAttempts(0);
        profileRepository.save(profile);

        String subject;
        String htmlBody;
        if (purpose == OtpPurpose.ACCOUNT_ACTIVATION) {
            subject = "Mã xác thực tài khoản Money Manager";
            htmlBody = mailTemplateService.buildActivationOtpEmail(profile.getFullName(), rawOtp);
        } else {
            subject = "Mã đặt lại mật khẩu Money Manager";
            htmlBody = mailTemplateService.buildPasswordResetOtpEmail(profile.getFullName(), rawOtp);
        }

        try {
            emailService.sendHtmlEmail(profile.getEmail(), subject, htmlBody);
        } catch (Exception e) {
            // Log failure without exposing OTP
        }
    }

    /**
     * Validates the raw OTP against the stored BCrypt hash.
     * On success: clears all OTP fields (replay prevention).
     * On failure: increments attempts; after MAX_FAILED_ATTEMPTS, invalidates the OTP.
     */
    public void validateOtp(ProfileEntity profile, String rawOtp, OtpPurpose expectedPurpose) {
        if (profile.getOtpCode() == null) {
            throw new RuntimeException("Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.");
        }
        if (profile.getOtpPurpose() != expectedPurpose) {
            throw new RuntimeException("Mã OTP không hợp lệ cho thao tác này.");
        }
        if (LocalDateTime.now().isAfter(profile.getOtpExpiry())) {
            invalidateOtp(profile);
            throw new RuntimeException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        int attempts = profile.getOtpAttempts() == null ? 0 : profile.getOtpAttempts();
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            invalidateOtp(profile);
            throw new RuntimeException("OTP đã bị hủy do nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.");
        }

        // BCrypt constant-time comparison
        if (!passwordEncoder.matches(rawOtp, profile.getOtpCode())) {
            attempts++;
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                invalidateOtp(profile);
                throw new RuntimeException("Mã OTP không đúng. OTP đã bị hủy do nhập sai " + MAX_FAILED_ATTEMPTS + " lần. Vui lòng yêu cầu mã mới.");
            }
            profile.setOtpAttempts(attempts);
            profileRepository.save(profile);
            int remaining = MAX_FAILED_ATTEMPTS - attempts;
            throw new RuntimeException("Mã OTP không đúng. Còn " + remaining + " lần thử.");
        }

        // Success: invalidate so the OTP cannot be reused
        invalidateOtp(profile);
    }

    /**
     * Validates the OTP without consuming it — used to verify identity before showing a new-password form.
     * Unlike validateOtp(), a successful check does NOT invalidate the OTP so the same code can be
     * submitted again in the final reset-password call.
     */
    public void checkOtpOnly(ProfileEntity profile, String rawOtp, OtpPurpose expectedPurpose) {
        if (profile.getOtpCode() == null) {
            throw new RuntimeException("Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.");
        }
        if (profile.getOtpPurpose() != expectedPurpose) {
            throw new RuntimeException("Mã OTP không hợp lệ cho thao tác này.");
        }
        if (LocalDateTime.now().isAfter(profile.getOtpExpiry())) {
            invalidateOtp(profile);
            throw new RuntimeException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        int attempts = profile.getOtpAttempts() == null ? 0 : profile.getOtpAttempts();
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            invalidateOtp(profile);
            throw new RuntimeException("OTP đã bị hủy do nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.");
        }

        if (!passwordEncoder.matches(rawOtp, profile.getOtpCode())) {
            attempts++;
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                invalidateOtp(profile);
                throw new RuntimeException("Mã OTP không đúng. OTP đã bị hủy do nhập sai " + MAX_FAILED_ATTEMPTS + " lần. Vui lòng yêu cầu mã mới.");
            }
            profile.setOtpAttempts(attempts);
            profileRepository.save(profile);
            int remaining = MAX_FAILED_ATTEMPTS - attempts;
            throw new RuntimeException("Mã OTP không đúng. Còn " + remaining + " lần thử.");
        }
        // OTP is correct — intentionally NOT calling invalidateOtp() here
    }

    public boolean canResend(ProfileEntity profile) {
        return profile.getOtpResendAllowedAt() == null
                || LocalDateTime.now().isAfter(profile.getOtpResendAllowedAt());
    }

    public long getResendWaitSeconds(ProfileEntity profile) {
        if (canResend(profile)) return 0;
        return Duration.between(LocalDateTime.now(), profile.getOtpResendAllowedAt()).getSeconds();
    }

    private void invalidateOtp(ProfileEntity profile) {
        profile.setOtpCode(null);
        profile.setOtpExpiry(null);
        profile.setOtpResendAllowedAt(null);
        profile.setOtpPurpose(null);
        profile.setOtpAttempts(0);
        profileRepository.save(profile);
    }
}
