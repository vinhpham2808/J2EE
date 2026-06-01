package com.example.moneymanager.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.seeders.enabled", havingValue = "true", matchIfMissing = true)
public class RoleInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public RoleInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("INSERT IGNORE INTO tbl_roles(id, name) VALUES (1, 'admin')");
            jdbcTemplate.execute("INSERT IGNORE INTO tbl_roles(id, name) VALUES (2, 'user')");
        } catch (Exception e) {
            System.err.println("Could not initialize tbl_roles: " + e.getMessage());
        }
    }
}