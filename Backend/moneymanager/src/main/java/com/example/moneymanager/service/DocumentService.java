package com.example.moneymanager.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;


    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.region}")
    private String region;

    /**
     * Sinh hóa đơn HTML cho một giao dịch đã thanh toán và upload lên S3.
     */
    public Map<String, String> generateInvoice(
            Long orderCode,
            Long amount,
            String planName,
            String email,
            LocalDate paidDate
    ) {
        log.info("Generating invoice locally for orderCode: {}", orderCode);
        
        String safeEmail = email != null ? email.replaceAll("[^a-zA-Z0-9@.-]", "_") : "anonymous";
        String key = "userData/" + safeEmail + "/invoices/invoice-" + orderCode + "-" + UUID.randomUUID().toString().substring(0, 8) + ".html";

        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        String formattedAmount = formatter.format(amount);

        String htmlContent = "<!DOCTYPE html>\n" +
                "<html lang=\"vi\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>Hóa đơn thanh toán #" + orderCode + "</title>\n" +
                "  <style>\n" +
                "    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; background: #f8fafc; color: #1e293b; }\n" +
                "    .invoice-box { max-width: 700px; margin: auto; padding: 40px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }\n" +
                "    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }\n" +
                "    .title { font-size: 28px; font-weight: 800; color: #1e3a8a; }\n" +
                "    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }\n" +
                "    .details-table td { padding: 8px 0; font-size: 15px; }\n" +
                "    .details-table td.label { font-weight: 600; color: #64748b; width: 150px; }\n" +
                "    .item-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }\n" +
                "    .item-table th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 700; border-bottom: 2px solid #e2e8f0; }\n" +
                "    .item-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; }\n" +
                "    .total-row { font-size: 18px; font-weight: 700; color: #1e3a8a; }\n" +
                "    .footer { text-align: center; margin-top: 40px; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"invoice-box\">\n" +
                "    <div class=\"header\">\n" +
                "      <div class=\"title\">HÓA ĐƠN</div>\n" +
                "      <div><strong>Money Manager</strong></div>\n" +
                "    </div>\n" +
                "    <table class=\"details-table\">\n" +
                "      <tr>\n" +
                "        <td class=\"label\">Mã hóa đơn:</td>\n" +
                "        <td>#" + orderCode + "</td>\n" +
                "      </tr>\n" +
                "      <tr>\n" +
                "        <td class=\"label\">Khách hàng:</td>\n" +
                "        <td>" + email + "</td>\n" +
                "      </tr>\n" +
                "      <tr>\n" +
                "        <td class=\"label\">Ngày thanh toán:</td>\n" +
                "        <td>" + paidDate.toString() + "</td>\n" +
                "      </tr>\n" +
                "      <tr>\n" +
                "        <td class=\"label\">Trạng thái:</td>\n" +
                "        <td style=\"color: #16a34a; font-weight: 700;\">ĐÃ THANH TOÁN (PAID)</td>\n" +
                "      </tr>\n" +
                "    </table>\n" +
                "    <table class=\"item-table\">\n" +
                "      <thead>\n" +
                "        <tr>\n" +
                "          <th>Dịch vụ</th>\n" +
                "          <th style=\"text-align: right;\">Thành tiền</th>\n" +
                "        </tr>\n" +
                "      </thead>\n" +
                "      <tbody>\n" +
                "        <tr>\n" +
                "          <td>Nâng cấp gói tài khoản <strong>" + planName + "</strong></td>\n" +
                "          <td style=\"text-align: right;\">" + formattedAmount + "</td>\n" +
                "        </tr>\n" +
                "        <tr class=\"total-row\">\n" +
                "          <td style=\"text-align: right; padding-top: 24px;\">Tổng cộng:</td>\n" +
                "          <td style=\"text-align: right; padding-top: 24px;\">" + formattedAmount + "</td>\n" +
                "        </tr>\n" +
                "      </tbody>\n" +
                "    </table>\n" +
                "    <div class=\"footer\">\n" +
                "      Cảm ơn bạn đã sử dụng dịch vụ của Money Manager!<br>Mọi thắc mắc xin liên hệ support@botdevgroup.me\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";

        byte[] htmlBytes = htmlContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        uploadToS3(key, htmlBytes, "text/html");

        String presignedUrl = generatePresignedUrl(key);
        Map<String, String> result = new HashMap<>();
        result.put("s3Key", key);
        result.put("presignedUrl", presignedUrl);
        return result;
    }

    /**
     * Sinh báo cáo chi tiêu/thu nhập Excel locally và upload lên S3.
     */
    public Map<String, String> generateExcelReport(
            String email,
            int month,
            int year,
            List<Map<String, Object>> items
    ) {
        log.info("Generating Excel report locally for email: {}, month: {}, year: {}", email, month, year);

        String safeEmail = email != null ? email.replaceAll("[^a-zA-Z0-9@.-]", "_") : "anonymous";
        String key = "userData/" + safeEmail + "/reports/report-" + year + "-" + month + "-" + UUID.randomUUID().toString().substring(0, 8) + ".xlsx";

        try {
            byte[] excelBytes = generateExcelBytes(items);
            uploadToS3(key, excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

            String presignedUrl = generatePresignedUrl(key);
            Map<String, String> result = new HashMap<>();
            result.put("s3Key", key);
            result.put("presignedUrl", presignedUrl);
            return result;
        } catch (IOException e) {
            log.error("Failed to generate local Excel report: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi sinh báo cáo Excel: " + e.getMessage(), e);
        }
    }

    private String generatePresignedUrl(String key) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(1)) // URL valid for 1 hour
                .getObjectRequest(builder -> builder.bucket(bucketName).key(key).build())
                .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    private void uploadToS3(String key, byte[] data, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();
        s3Client.putObject(request, RequestBody.fromBytes(data));
        log.info("Successfully uploaded document to S3: {}", key);
    }

    private byte[] generateExcelBytes(List<Map<String, Object>> items) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Báo cáo");

            // Style cho Header
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.MEDIUM);

            // Style cho Data
            CellStyle amountStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            amountStyle.setDataFormat(format.getFormat("#,##0\" ₫\""));
            
            CellStyle centerStyle = workbook.createCellStyle();
            centerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Tên giao dịch", "Ngày", "Số tiền", "Danh mục"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowIdx = 1;
            for (Map<String, Object> item : items) {
                Row row = sheet.createRow(rowIdx++);
                
                String name = String.valueOf(item.getOrDefault("name", ""));
                String date = String.valueOf(item.getOrDefault("date", ""));
                double amount = 0.0;
                if (item.get("amount") != null) {
                    try {
                        amount = Double.parseDouble(String.valueOf(item.get("amount")));
                    } catch (NumberFormatException ignored) {}
                }
                String category = String.valueOf(item.getOrDefault("category", ""));

                row.createCell(0).setCellValue(name);
                
                Cell dateCell = row.createCell(1);
                dateCell.setCellValue(date);
                dateCell.setCellStyle(centerStyle);

                Cell amountCell = row.createCell(2);
                amountCell.setCellValue(amount);
                amountCell.setCellStyle(amountStyle);

                row.createCell(3).setCellValue(category);
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        }
    }
}
