package com.example.moneymanager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final LambdaClient lambdaClient;
    private final ObjectMapper objectMapper;

    @Value("${aws.lambda.document-function:generate-and-store-document}")
    private String lambdaFunctionName;

    /**
     * Sinh hóa đơn PDF sau khi thanh toán thành công.
     *
     * @param orderCode  Mã đơn hàng
     * @param amount     Số tiền
     * @param planName   Tên gói dịch vụ
     * @param email      Email khách hàng
     * @param paidDate   Ngày thanh toán
     * @return Map chứa s3Key và presignedUrl
     */
    public Map<String, String> generateInvoice(
            Long orderCode,
            Long amount,
            String planName,
            String email,
            LocalDate paidDate
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "invoice");
        payload.put("orderCode", orderCode);
        payload.put("amount", amount);
        payload.put("planName", planName);
        payload.put("email", email);
        payload.put("paidDate", paidDate.toString());

        return invokeLambda(payload);
    }

    /**
     * Sinh báo cáo chi tiêu Excel.
     *
     * @param email      Email khách hàng
     * @param month      Tháng báo cáo
     * @param year       Năm báo cáo
     * @param expenses   Danh sách chi tiêu (mỗi item là Map chứa name, amount, date, category)
     * @return Map chứa s3Key và presignedUrl
     */
    public Map<String, String> generateExcelReport(
            String email,
            int month,
            int year,
            List<Map<String, Object>> expenses
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "excel_report");
        payload.put("email", email);
        payload.put("month", month);
        payload.put("year", year);
        payload.put("expenses", expenses);

        return invokeLambda(payload);
    }

    /**
     * Sinh báo cáo thu nhập Excel.
     *
     * @param email    Email khách hàng
     * @param month    Tháng báo cáo
     * @param year     Năm báo cáo
     * @param incomes  Danh sách thu nhập (mỗi item là Map chứa name, amount, date, category)
     * @return Map chứa s3Key và presignedUrl
     */
    public Map<String, String> generateIncomeExcelReport(
            String email,
            int month,
            int year,
            List<Map<String, Object>> incomes
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "income_report");
        payload.put("email", email);
        payload.put("month", month);
        payload.put("year", year);
        payload.put("incomes", incomes);

        return invokeLambda(payload);
    }

    /**
     * Gọi AWS Lambda function "generate-and-store-document".
     * Lambda sẽ sinh file (PDF/Excel), upload lên S3, và trả về s3Key + presignedUrl.
     *
     * @param payload Dữ liệu gửi sang Lambda
     * @return Map chứa s3Key và presignedUrl từ response
     */
    private Map<String, String> invokeLambda(Map<String, Object> payload) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            log.info("Invoking Lambda [{}] with payload type: {}", lambdaFunctionName, payload.get("type"));

            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(lambdaFunctionName)
                    .payload(SdkBytes.fromUtf8String(jsonPayload))
                    .build();

            InvokeResponse response = lambdaClient.invoke(invokeRequest);
            String responsePayload = response.payload().asUtf8String();

            if (response.functionError() != null) {
                log.error("Lambda function error: {}", responsePayload);
                throw new RuntimeException("Lambda function error: " + response.functionError());
            }

            JsonNode responseJson = objectMapper.readTree(responsePayload);
            
            if (responseJson.has("error") || (responseJson.has("statusCode") && responseJson.get("statusCode").asInt() != 200)) {
                String errorMsg = responseJson.has("error") ? responseJson.get("error").asText() : "Unknown Lambda error";
                log.error("Lambda returned error payload: {}", responsePayload);
                throw new RuntimeException("Lỗi từ AWS Lambda: " + errorMsg);
            }

            Map<String, String> result = new HashMap<>();
            result.put("s3Key", responseJson.has("s3Key") ? responseJson.get("s3Key").asText() : null);
            result.put("presignedUrl", responseJson.has("presignedUrl") ? responseJson.get("presignedUrl").asText() : null);

            log.info("Lambda returned s3Key: {}", result.get("s3Key"));
            return result;

        } catch (Exception e) {
            log.error("Failed to invoke Lambda function [{}]: {}", lambdaFunctionName, e.getMessage(), e);
            throw new RuntimeException("Không thể sinh tài liệu: " + e.getMessage(), e);
        }
    }
}
