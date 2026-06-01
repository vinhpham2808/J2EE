package com.example.moneymanager.controller;

import com.example.moneymanager.dto.*;
import com.example.moneymanager.service.AdminService;
import lombok.RequiredArgsConstructor;
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
        return ResponseEntity.ok(adminService.getOverview());
    }

    @GetMapping("/payments")
    public ResponseEntity<?> getPayments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(adminService.getPayments(status, search, limit));
    }

    @GetMapping("/payments/{orderCode}")
    public ResponseEntity<?> getPaymentDetail(@PathVariable Long orderCode) {
        return ResponseEntity.ok(adminService.getPaymentByOrderCode(orderCode));
    }

    @DeleteMapping("/payments/{orderCode}")
    public ResponseEntity<?> deletePayment(@PathVariable Long orderCode) {
        adminService.deletePayment(orderCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa hóa đơn thành công."));
    }

    // ─── User CRUD ───────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String plan,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(adminService.getUsers(search, plan, status, limit));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody AdminUserUpdateDTO dto) {
        return ResponseEntity.ok(adminService.updateUser(id, dto));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa người dùng thành công."));
    }

    @PostMapping("/notifications/broadcast")
    public ResponseEntity<?> sendBroadcast(@RequestBody AdminBroadcastDTO dto) {
        adminService.sendBroadcast(dto);
        return ResponseEntity.ok(Map.of("message", "Đã gửi thông báo thành công"));
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getBroadcasts() {
        List<NotificationDTO> response = adminService.getBroadcasts();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/notifications/{id}")
    public ResponseEntity<?> updateBroadcast(@PathVariable Long id, @RequestBody AdminBroadcastDTO dto) {
        adminService.updateBroadcast(id, dto);
        return ResponseEntity.ok(Map.of("message", "Cập nhật thông báo thành công"));
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<?> deleteBroadcast(@PathVariable Long id) {
        adminService.deleteBroadcast(id);
        return ResponseEntity.ok(Map.of("message", "Xoá thông báo thành công"));
    }

    @PostMapping("/notifications/delete-bulk")
    public ResponseEntity<?> deleteBroadcasts(@RequestBody List<Long> ids) {
        adminService.deleteBroadcasts(ids);
        return ResponseEntity.ok(Map.of("message", "Xoá các thông báo thành công"));
    }


}
