package com.example.moneymanager.controller;

import com.example.moneymanager.dto.GoogleAuthRequest;
import com.example.moneymanager.service.GoogleAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleAuthRequest request) {
        try {
            Map<String, Object> response = googleAuthService.loginWithGoogle(request.getIdToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage()
            ));
        }
    }
}
