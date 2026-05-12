package com.example.moneymanager.service;

import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.entity.RoleEntity;
import com.example.moneymanager.entity.SubscriptionPlan;
import com.example.moneymanager.entity.SubscriptionStatus;
import com.example.moneymanager.repository.ProfileRepository;
import com.example.moneymanager.repository.RoleRepository;
import com.example.moneymanager.util.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final ProfileRepository profileRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;
    private final ProfileService profileService;

    @Value("${google.client-id}")
    private String googleClientId;

    public Map<String, Object> loginWithGoogle(String idToken) {
        // 1. Verify Google ID Token
        GoogleIdToken.Payload payload = verifyToken(idToken);
        if (payload == null) {
            throw new RuntimeException("Google ID Token không hợp lệ hoặc đã hết hạn.");
        }

        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");
        String googleId = payload.getSubject(); // Google unique user ID

        // 2. Tìm user theo email, nếu không có thì tạo mới
        ProfileEntity profile = profileRepository.findByEmail(email)
                .orElseGet(() -> createGoogleUser(email, name, picture, googleId));

        boolean updated = false;

        // 3. Nếu user đã tồn tại nhưng chưa link Google ID → cập nhật
        if (profile.getGoogleId() == null) {
            profile.setGoogleId(googleId);
            // Nếu tài khoản chưa active → tự động kích hoạt (vì Google đã xác thực email)
            if (!Boolean.TRUE.equals(profile.getIsActive())) {
                profile.setIsActive(true);
                profile.setActivationToken(null);
            }
            updated = true;
        }

        // Cập nhật ảnh đại diện từ Google nếu người dùng chưa có ảnh hoặc ảnh lỗi
        if (picture != null && !picture.isEmpty()) {
            String currentPic = profile.getProfileImageUrl();
            if (currentPic == null || currentPic.trim().isEmpty() || "null".equals(currentPic) || "undefined".equals(currentPic)) {
                profile.setProfileImageUrl(picture);
                updated = true;
            }
        }

        if (updated) {
            profile = profileRepository.save(profile);
        }

        // 4. Sinh JWT của app
        String token = jwtUtil.generateToken(profile.getEmail());

        return Map.of(
                "token", token,
                "user", profileService.toDTO(profile)
        );
    }

    private GoogleIdToken.Payload verifyToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                return idToken.getPayload();
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xác minh Google Token: " + e.getMessage());
        }
        return null;
    }

    private ProfileEntity createGoogleUser(String email, String name, String picture, String googleId) {
        RoleEntity userRole = roleRepository.findByNameIgnoreCase("user")
                .orElseThrow(() -> new RuntimeException("Role 'user' not found in database"));
        ProfileEntity newProfile = ProfileEntity.builder()
                .email(email)
                .fullName(name != null ? name : email.split("@")[0])
                .profileImageUrl(picture)
                .password(null) // Google user không có password
                .googleId(googleId)
                .isActive(true) // Google đã xác thực email → tự động active
                .activationToken(null)
                .subscriptionPlan(SubscriptionPlan.FREE)
                .subscriptionStatus(SubscriptionStatus.INACTIVE)
                .autoRenew(false)
                .role(userRole)
                .build();
        return profileRepository.save(newProfile);
    }
}
