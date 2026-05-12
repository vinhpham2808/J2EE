package com.example.moneymanager.controller;

import com.example.moneymanager.dto.*;
import com.example.moneymanager.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<?> getOverview() {
        try {
            AdminOverviewDTO response = adminService.getOverview();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            HttpStatus status = e.getMessage() != null && e.getMessage().contains("Forbidden")
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/payments")
    public ResponseEntity<?> getPayments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer limit
    ) {
        try {
            List<AdminPaymentDTO> response = adminService.getPayments(status, search, limit);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            HttpStatus statusCode = e.getMessage() != null && e.getMessage().contains("Forbidden")
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(statusCode).body(Map.of("message", e.getMessage()));
        }
    }

    // ─── User CRUD ───────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String plan,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit
    ) {
        try {
            return ResponseEntity.ok(adminService.getUsers(search, plan, status, limit));
        } catch (Exception e) {
            HttpStatus s = e.getMessage() != null && e.getMessage().contains("Forbidden") ? HttpStatus.FORBIDDEN : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(s).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminService.getUserById(id));
        } catch (Exception e) {
            HttpStatus s = e.getMessage() != null && e.getMessage().contains("Forbidden") ? HttpStatus.FORBIDDEN : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(s).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody AdminUserUpdateDTO dto) {
        try {
            return ResponseEntity.ok(adminService.updateUser(id, dto));
        } catch (Exception e) {
            HttpStatus s = e.getMessage() != null && e.getMessage().contains("Forbidden") ? HttpStatus.FORBIDDEN : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(s).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            adminService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa người dùng thành công."));
        } catch (Exception e) {
            HttpStatus s = e.getMessage() != null && e.getMessage().contains("Forbidden") ? HttpStatus.FORBIDDEN : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(s).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/notifications/broadcast")
    public ResponseEntity<?> sendBroadcast(@RequestBody AdminBroadcastDTO dto) {
        try {
            adminService.sendBroadcast(dto);
            return ResponseEntity.ok(Map.of("message", "Đã gửi thông báo thành công"));
        } catch (Exception e) {
            HttpStatus statusCode = e.getMessage() != null && e.getMessage().contains("Forbidden")
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(statusCode).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getBroadcasts() {
        try {
            List<NotificationDTO> response = adminService.getBroadcasts();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            HttpStatus statusCode = e.getMessage() != null && e.getMessage().contains("Forbidden")
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(statusCode).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/notifications/{id}")
    public ResponseEntity<?> updateBroadcast(@PathVariable Long id, @RequestBody AdminBroadcastDTO dto) {
        try {
            adminService.updateBroadcast(id, dto);
            return ResponseEntity.ok(Map.of("message", "Cập nhật thông báo thành công"));
        } catch (Exception e) {
            HttpStatus statusCode = e.getMessage() != null && e.getMessage().contains("Forbidden")
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(statusCode).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<?> deleteBroadcast(@PathVariable Long id) {
        try {
            adminService.deleteBroadcast(id);
            return ResponseEntity.ok(Map.of("message", "Xoá thông báo thành công"));
        } catch (Exception e) {
            HttpStatus statusCode = e.getMessage() != null && e.getMessage().contains("Forbidden")
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(statusCode).body(Map.of("message", e.getMessage()));
        }
    }
}
