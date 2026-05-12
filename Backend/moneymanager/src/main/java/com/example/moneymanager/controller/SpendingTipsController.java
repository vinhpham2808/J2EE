package com.example.moneymanager.controller;

import com.example.moneymanager.dto.SpendingTipsResponseDTO;
import com.example.moneymanager.service.SpendingTipsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/gemini")
public class SpendingTipsController {

    private final SpendingTipsService spendingTipsService;

    @PostMapping("/spending-tips")
    public ResponseEntity<SpendingTipsResponseDTO> generateSpendingTips() {
        return ResponseEntity.ok(spendingTipsService.generateSmartTips());
    }
}
