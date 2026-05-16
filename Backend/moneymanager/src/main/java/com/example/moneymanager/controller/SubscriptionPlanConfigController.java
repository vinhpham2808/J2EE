package com.example.moneymanager.controller;

import com.example.moneymanager.dto.SubscriptionPlanConfigDTO;
import com.example.moneymanager.service.SubscriptionPlanConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SubscriptionPlanConfigController {

    private final SubscriptionPlanConfigService service;

    /** Public: bất kỳ ai cũng có thể lấy danh sách gói (trang Payment) */
    @GetMapping("/subscription-plans")
    public ResponseEntity<List<SubscriptionPlanConfigDTO>> getAll() {
        return ResponseEntity.ok(service.getAllPlans());
    }

    /** Admin-only: thêm gói mới */
    @PostMapping("/admin/subscription-plans")
    public ResponseEntity<SubscriptionPlanConfigDTO> create(@RequestBody SubscriptionPlanConfigDTO dto) {
        return ResponseEntity.ok(service.createPlan(dto));
    }

    /** Admin-only: cập nhật gói */
    @PutMapping("/admin/subscription-plans/{id}")
    public ResponseEntity<SubscriptionPlanConfigDTO> update(
            @PathVariable Long id,
            @RequestBody SubscriptionPlanConfigDTO dto) {
        return ResponseEntity.ok(service.updatePlan(id, dto));
    }

    /** Admin-only: xóa gói */
    @DeleteMapping("/admin/subscription-plans/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.deletePlan(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa gói thanh toán thành công."));
    }
}
