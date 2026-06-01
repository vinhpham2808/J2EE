package com.example.moneymanager.security;

import com.example.moneymanager.controller.ProfileController;

import com.example.moneymanager.dto.CompleteProfileDTO;
import com.example.moneymanager.dto.OtpRequestDTO;
import com.example.moneymanager.service.OtpService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.service.EmailNotificationPreferenceService;
import com.example.moneymanager.service.SubscriptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@ExtendWith(MockitoExtension.class)
class ProfileControllerSecurityRegressionTest {

    @Mock ProfileService profileService;
    @Mock EmailNotificationPreferenceService emailNotificationPreferenceService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                new ProfileController(profileService, emailNotificationPreferenceService)
        ).build();
    }

    @Test
    @DisplayName("REGRESSION: public PUT /complete-profile must return 410 Gone (no account takeover route)")
    void putCompleteProfile_shouldBeGone() throws Exception {
        String payload = "{\"email\":\"attacker@evil.com\",\"fullName\":\"Attacker\",\"password\":\"newpassword123\"}";
        mockMvc.perform(put("/complete-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @DisplayName("REGRESSION: public GET /complete-profile must return 410 Gone (legacy compatibility response)")
    void getCompleteProfile_shouldBeGone() throws Exception {
        mockMvc.perform(get("/complete-profile"))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
