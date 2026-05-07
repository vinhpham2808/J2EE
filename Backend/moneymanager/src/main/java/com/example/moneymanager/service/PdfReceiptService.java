package com.example.moneymanager.service;

import com.example.moneymanager.entity.PaymentEntity;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfReceiptService {

    public byte[] generatePaymentReceipt(PaymentEntity payment) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Load Font supporting Vietnamese from classpath (works in fat JAR)
            ClassPathResource fontResource = new ClassPathResource("fonts/Roboto-Regular.ttf");
            byte[] fontBytes;
            try (InputStream is = fontResource.getInputStream()) {
                fontBytes = FileCopyUtils.copyToByteArray(is);
            }
            BaseFont bf = BaseFont.createFont("Roboto-Regular.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, fontBytes, null);
            
            Font titleFont = new Font(bf, 16, Font.BOLD);
            Font normalFont = new Font(bf, 11, Font.NORMAL);
            Font boldFont = new Font(bf, 11, Font.BOLD);

            // Title
            Paragraph title = new Paragraph("Biên lai chuyển tiền qua tài khoản", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph subTitle = new Paragraph("(Payment Receipt)", normalFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            subTitle.setSpacingAfter(20);
            document.add(subTitle);

            // Table
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.2f, 2f});

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");
            String dateStr = payment.getUpdatedAt() != null ? payment.getUpdatedAt().format(dtf) : "N/A";

            addTableRow(table, "Ngày, giờ giao dịch\nTrans. Date, Time", dateStr, normalFont, boldFont);
            addTableRow(table, "Số lệnh giao dịch\nOrder Number", String.valueOf(payment.getOrderCode()), normalFont, boldFont);
            
            String fullName = payment.getProfile().getFullName();
            String remitterName = (fullName != null && !fullName.isBlank()) ? fullName : payment.getProfile().getEmail();
            addTableRow(table, "Tên người chuyển tiền\nRemitter's name", remitterName, normalFont, boldFont);
            
            addTableRow(table, "Tên gói dịch vụ\nPlan Name", payment.getPlanName() != null ? payment.getPlanName() : "Gói dịch vụ MoneyManager", normalFont, boldFont);
            addTableRow(table, "Số tiền\nAmount", String.format("%,d VND", payment.getAmount()), normalFont, boldFont);
            
            // Nested table for fees
            PdfPTable feeTable = new PdfPTable(2);
            feeTable.setWidthPercentage(100);
            feeTable.addCell(createNoBorderCell("Số tiền phí\nCharge Amount", normalFont));
            feeTable.addCell(createNoBorderCell("0 VND", normalFont));
            feeTable.addCell(createNoBorderCell("VAT", normalFont));
            feeTable.addCell(createNoBorderCell("0 VND", normalFont));
            
            PdfPCell feeCellWrapper = new PdfPCell(feeTable);
            feeCellWrapper.setPadding(0);
            
            PdfPCell feeLabelCell = new PdfPCell(new Phrase("Loại phí\nCharge Code", normalFont));
            feeLabelCell.setPadding(8);
            
            table.addCell(feeLabelCell);
            table.addCell(feeCellWrapper);

            addTableRow(table, "Nội dung chuyển tiền\nDetails of Payment", payment.getDescription(), normalFont, boldFont);

            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF receipt", e);
        }
    }

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setPadding(8);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setPadding(8);
        valueCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(valueCell);
    }

    private PdfPCell createNoBorderCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(0);
        cell.setPadding(4);
        return cell;
    }
}
