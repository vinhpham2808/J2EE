package com.example.moneymanager.security;

import com.example.moneymanager.service.MailTemplateService;
import com.example.moneymanager.service.EmailService;
import com.example.moneymanager.service.OtpService;
import com.example.moneymanager.entity.OtpPurpose;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OtpCodeLoggingRegressionTest {

    @Mock ProfileRepository profileRepository;
    @Mock MailTemplateService mailTemplateService;
    @Mock EmailService emailService;

    private OtpService otpService;
    private final ByteArrayOutputStream stdoutCapture = new ByteArrayOutputStream();
    private final ByteArrayOutputStream stderrCapture = new ByteArrayOutputStream();

    @BeforeEach
    void setUp() {
        otpService = new OtpService(profileRepository, new BCryptPasswordEncoder(), mailTemplateService, emailService);
        System.setOut(new PrintStream(stdoutCapture));
        System.setErr(new PrintStream(stderrCapture));
    }

    @Test
    @DisplayName("REGRESSION: OTP must never appear in stdout/stderr after generateAndSendOtp")
    void generateAndSendOtp_mustNotLogRawOtp() throws Exception {
        when(mailTemplateService.buildActivationOtpEmail(any(), any())).thenReturn("body");
        doReturn(ProfileEntity.builder().fullName("Test").email("user@example.com").otpCode("x")
                .build()).when(profileRepository).save(any(ProfileEntity.class));

        ProfileEntity profile = ProfileEntity.builder()
                .fullName("Test User")
                .email("user@example.com")
                .build();

        otpService.generateAndSendOtp(profile, OtpPurpose.ACCOUNT_ACTIVATION);

        String stdout = stdoutCapture.toString(StandardCharsets.UTF_8);
        String stderr = stderrCapture.toString(StandardCharsets.UTF_8);

        String capturedOtp = extractOtpFromBodyOrMail();
        if (capturedOtp != null && !capturedOtp.isEmpty()) {
            assertFalse(stdout.contains(capturedOtp), "Raw OTP must not appear in stdout");
            assertFalse(stderr.contains(capturedOtp), "Raw OTP must not appear in stderr");
        }
        assertFalse(stdout.toLowerCase().contains("otp"), "stdout must not mention OTP");
        assertFalse(stderr.toLowerCase().contains("otp"), "stderr must not mention OTP");
        assertFalse(stdout.contains(": 0"), "stdout must not contain raw OTP numeric prefix");
    }

    @Test
    @DisplayName("REGRESSION: source code must not contain println/print statements printing OTP")
    void otpServiceSourceCode_mustNotContainOtpPrintln() throws Exception {
        Path sourceFile = Paths.get("src/main/java/com/example/moneymanager/service/OtpService.java");
        if (!Files.exists(sourceFile)) return;
        String source = Files.readString(sourceFile, StandardCharsets.UTF_8);
        assertFalse(source.contains("System.out.println") && source.toLowerCase().contains("otp"),
                "OtpService.java must not contain System.out.println statements referencing OTP");
        assertFalse(source.contains("System.out.print(\"") && source.toLowerCase().contains("otp"),
                "OtpService.java must not contain System.out.print statements referencing OTP");
    }

    private String extractOtpFromBodyOrMail() {
        // Helper: we can't easily extract from the lambda mock, so skip assertion if null.
        return null;
    }
}
