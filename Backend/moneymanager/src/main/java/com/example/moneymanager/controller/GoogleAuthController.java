package com.example.moneymanager.controller;

import com.example.moneymanager.dto.GoogleAuthRequest;
import com.example.moneymanager.service.GoogleAuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class GoogleAuthController {

    private final GoogleAuthService googleAuthService;

    @Value("${jwt.cookie.name}")
    private String cookieName;

    @Value("${jwt.cookie.max-age}")
    private long cookieMaxAge;

    @Value("${jwt.cookie.secure}")
    private boolean cookieSecure;

    @Value("${jwt.cookie.same-site}")
    private String cookieSameSite;

    @PostMapping("/google")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleAuthRequest request, HttpServletResponse response) {
        try {
            Map<String, Object> result = googleAuthService.loginWithGoogle(request.getIdToken());
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
            
            return ResponseEntity.ok(Map.of(
                    "message", "Đăng nhập thành công.",
                    "token", token != null ? token : "",
                    "user", result.get("user")
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage()
            ));
        }
    }
}
