package com.example.moneymanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIIntentResponseDTO {
    private String status;
    private String sessionId;
    private String intent;
    /**
     * Loại intent: ACTION (thao tác CRUD/export/email), QUESTION (hỏi thông tin), INVALID (ngoài phạm vi).
     * Được thêm để frontend dễ phân loại mà không cần kiểm tra prefix intent.
     */
    private String intentType;
    private Map<String, Object> extractedFields;
    private Map<String, Object> suggestedValues;
    private List<String> validationErrors;
    /**
     * Danh sách tên field bắt buộc còn thiếu để thực hiện intent này.
     * Frontend dùng để highlight field cần điền trong confirmation form thay vì fallback sang chat.
     */
    private List<String> missingFields;
    private String confirmationPrompt;
    private String answer;
    private String reply;
    private String provider;
    private String modelUsed;
    /**
     * Độ tin cậy của kết quả phân loại intent (0.0 - 1.0).
     * Được parse từ response AI hoặc được backend gán dựa trên heuristic.
     */
    private Double confidence;
}
