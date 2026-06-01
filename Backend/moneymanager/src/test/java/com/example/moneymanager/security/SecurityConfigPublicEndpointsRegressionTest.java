package com.example.moneymanager.security;

import com.example.moneymanager.config.SecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SecurityConfigPublicEndpointsRegressionTest {

    @Test
    @DisplayName("REGRESSION: SecurityConfig must NOT list /complete-profile as a permitAll() endpoint")
    void completeProfile_mustNotBeInPublicPermitAllList() throws Exception {
        // Reflection-free approach: read the SecurityConfig source file and assert
        java.nio.file.Path sourceFile = java.nio.file.Paths.get(
                "src/main/java/com/example/moneymanager/config/SecurityConfig.java");
        if (!java.nio.file.Files.exists(sourceFile)) return;

        String source = java.nio.file.Files.readString(sourceFile, java.nio.charset.StandardCharsets.UTF_8);
        assertNotNull(source);
        assertFalse(
                source.contains("\"/complete-profile\"")
                        && source.matches("(?s).*\\.requestMatchers\\([^)]*\"/complete-profile\"[^)]*\\)\\.permitAll\\(\\).*"),
                "SecurityConfig: endpoint /complete-profile must NOT be in the permitAll() list. "
                        + "It used to allow unauthenticated account takeover — this is a known high-severity issue."
        );
    }
}
