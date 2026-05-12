package com.example.moneymanager.service;

import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.dto.IncomeDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String CURRENCY_FORMAT = "#,##0\" ₫\"";

    // ── Colour palette ────────────────────────────────────────────────

    /** Green family for income */
    private static final byte[] HDR_INCOME_RGB  = {(byte) 0x21, (byte) 0x96, (byte) 0x53}; // #219653
    private static final byte[] ROW_ALT_INCOME  = {(byte) 0xF0, (byte) 0xFD, (byte) 0xF4}; // #F0FDF4

    /** Red/orange family for expense */
    private static final byte[] HDR_EXPENSE_RGB = {(byte) 0xDC, (byte) 0x26, (byte) 0x26}; // #DC2626
    private static final byte[] ROW_ALT_EXPENSE = {(byte) 0xFF, (byte) 0xF1, (byte) 0xF2}; // #FFF1F2

    /** Neutral shades */
    private static final byte[] TITLE_BG_RGB    = {(byte) 0x1E, (byte) 0x29, (byte) 0x3B}; // #1E293B
    private static final byte[] TOTAL_BG_RGB    = {(byte) 0xF1, (byte) 0xF5, (byte) 0xF9}; // #F1F5F9
    private static final byte[] BORDER_RGB      = {(byte) 0xCB, (byte) 0xD5, (byte) 0xE1}; // #CBD5E1

    // ─────────────────────────────────────────────────────────────────

    public void writeIncomesToExcel(OutputStream os, List<IncomeDTO> incomes) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            XSSFSheet sheet = wb.createSheet("Thu nhập");
            sheet.setDefaultColumnWidth(18);

            Styles s = new Styles(wb, HDR_INCOME_RGB, ROW_ALT_INCOME);

            // Row 0 — report title (merged A–E)
            String reportTitle = "BÁO CÁO THU NHẬP – " + monthLabel();
            writeTitle(sheet, s, reportTitle, 5);

            // Row 1 — generated timestamp
            writeSubtitle(sheet, s, 5);

            // Row 2 — blank spacer
            sheet.createRow(2);

            // Row 3 — column headers
            String[] headers = {"STT", "Tên giao dịch", "Danh mục", "Số tiền (₫)", "Ngày"};
            writeHeaderRow(sheet, s, 3, headers);

            // Rows 4..N — data
            BigDecimal total = BigDecimal.ZERO;
            for (int i = 0; i < incomes.size(); i++) {
                IncomeDTO inc = incomes.get(i);
                BigDecimal amount = inc.getAmount() != null ? inc.getAmount() : BigDecimal.ZERO;
                total = total.add(amount);

                XSSFRow row = sheet.createRow(4 + i);
                boolean alt = (i % 2 == 1);
                writeDataRow(wb, row, s, alt,
                        i + 1,
                        inc.getName() != null ? inc.getName() : "",
                        inc.getCategoryName() != null ? inc.getCategoryName() : "—",
                        amount.doubleValue(),
                        inc.getDate());
            }

            // Total row
            int totalRowIdx = 4 + incomes.size();
            writeTotalRow(wb, sheet, s, totalRowIdx, total.doubleValue(), 5);

            // Column widths (characters × 256)
            sheet.setColumnWidth(0, 8 * 256);
            sheet.setColumnWidth(1, 32 * 256);
            sheet.setColumnWidth(2, 22 * 256);
            sheet.setColumnWidth(3, 20 * 256);
            sheet.setColumnWidth(4, 16 * 256);

            wb.write(os);
        }
    }

    public void writeExpensesToExcel(OutputStream os, List<ExpenseDTO> expenses) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            XSSFSheet sheet = wb.createSheet("Chi tiêu");
            sheet.setDefaultColumnWidth(18);

            Styles s = new Styles(wb, HDR_EXPENSE_RGB, ROW_ALT_EXPENSE);

            String reportTitle = "BÁO CÁO CHI TIÊU – " + monthLabel();
            writeTitle(sheet, s, reportTitle, 5);
            writeSubtitle(sheet, s, 5);
            sheet.createRow(2);

            String[] headers = {"STT", "Tên giao dịch", "Danh mục", "Số tiền (₫)", "Ngày"};
            writeHeaderRow(sheet, s, 3, headers);

            BigDecimal total = BigDecimal.ZERO;
            for (int i = 0; i < expenses.size(); i++) {
                ExpenseDTO exp = expenses.get(i);
                BigDecimal amount = exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO;
                total = total.add(amount);

                XSSFRow row = sheet.createRow(4 + i);
                boolean alt = (i % 2 == 1);
                writeDataRow(wb, row, s, alt,
                        i + 1,
                        exp.getName() != null ? exp.getName() : "",
                        exp.getCategoryName() != null ? exp.getCategoryName() : "—",
                        amount.doubleValue(),
                        exp.getDate());
            }

            int totalRowIdx = 4 + expenses.size();
            writeTotalRow(wb, sheet, s, totalRowIdx, total.doubleValue(), 5);

            sheet.setColumnWidth(0, 8 * 256);
            sheet.setColumnWidth(1, 32 * 256);
            sheet.setColumnWidth(2, 22 * 256);
            sheet.setColumnWidth(3, 20 * 256);
            sheet.setColumnWidth(4, 16 * 256);

            wb.write(os);
        }
    }

    // ── Row writers ───────────────────────────────────────────────────

    private void writeTitle(XSSFSheet sheet, Styles s, String text, int colCount) {
        XSSFRow row = sheet.createRow(0);
        row.setHeightInPoints(36);
        XSSFCell cell = row.createCell(0);
        cell.setCellValue(text);
        cell.setCellStyle(s.title);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, colCount - 1));
        for (int c = 1; c < colCount; c++) row.createCell(c).setCellStyle(s.title);
    }

    private void writeSubtitle(XSSFSheet sheet, Styles s, int colCount) {
        XSSFRow row = sheet.createRow(1);
        row.setHeightInPoints(20);
        XSSFCell cell = row.createCell(0);
        cell.setCellValue("Xuất ngày: " + LocalDate.now().format(DATE_FMT));
        cell.setCellStyle(s.subtitle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, colCount - 1));
        for (int c = 1; c < colCount; c++) row.createCell(c).setCellStyle(s.subtitle);
    }

    private void writeHeaderRow(XSSFSheet sheet, Styles s, int rowIdx, String[] headers) {
        XSSFRow row = sheet.createRow(rowIdx);
        row.setHeightInPoints(28);
        for (int c = 0; c < headers.length; c++) {
            XSSFCell cell = row.createCell(c);
            cell.setCellValue(headers[c]);
            cell.setCellStyle(c == 3 ? s.headerRight : s.headerCenter);
        }
    }

    private void writeDataRow(XSSFWorkbook wb, XSSFRow row, Styles s,
                               boolean alt, int sno, String name, String category,
                               double amount, LocalDate date) {
        row.setHeightInPoints(22);

        XSSFCellStyle numStyle = alt ? s.dataAmountAlt : s.dataAmount;
        XSSFCellStyle txtStyle = alt ? s.dataAlt : s.data;
        XSSFCellStyle ctrStyle = alt ? s.dataCenterAlt : s.dataCenter;

        XSSFCell c0 = row.createCell(0); c0.setCellValue(sno);              c0.setCellStyle(ctrStyle);
        XSSFCell c1 = row.createCell(1); c1.setCellValue(name);             c1.setCellStyle(txtStyle);
        XSSFCell c2 = row.createCell(2); c2.setCellValue(category);         c2.setCellStyle(txtStyle);
        XSSFCell c3 = row.createCell(3); c3.setCellValue(amount);           c3.setCellStyle(numStyle);
        XSSFCell c4 = row.createCell(4);
        c4.setCellValue(date != null ? date.format(DATE_FMT) : "");
        c4.setCellStyle(ctrStyle);
    }

    private void writeTotalRow(XSSFWorkbook wb, XSSFSheet sheet, Styles s,
                                int rowIdx, double total, int colCount) {
        XSSFRow row = sheet.createRow(rowIdx);
        row.setHeightInPoints(26);

        // Columns 0..(colCount-3): merged "TỔNG CỘNG" label
        // Column  (colCount-2)  : total amount  (index 3 for 5-col sheet)
        // Column  (colCount-1)  : empty filler  (index 4 = Date column)
        XSSFCell labelCell = row.createCell(0);
        labelCell.setCellValue("TỔNG CỘNG");
        labelCell.setCellStyle(s.totalLabel);
        int labelEnd = colCount - 3; // = 2 for 5-col sheet
        if (labelEnd > 0) {
            sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, labelEnd));
            for (int c = 1; c <= labelEnd; c++) row.createCell(c).setCellStyle(s.totalLabel);
        }

        XSSFCell amtCell = row.createCell(colCount - 2); // col 3
        amtCell.setCellValue(total);
        amtCell.setCellStyle(s.totalAmount);
        row.createCell(colCount - 1).setCellStyle(s.totalLabel); // col 4
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private String monthLabel() {
        LocalDate now = LocalDate.now();
        return String.format("THÁNG %02d/%d", now.getMonthValue(), now.getYear());
    }

    // ── Style bundle ──────────────────────────────────────────────────

    private class Styles {
        final XSSFCellStyle title, subtitle;
        final XSSFCellStyle headerCenter, headerRight;
        final XSSFCellStyle data, dataAlt, dataCenter, dataCenterAlt, dataAmount, dataAmountAlt;
        final XSSFCellStyle totalLabel, totalAmount;

        Styles(XSSFWorkbook wb, byte[] accentRgb, byte[] altRowRgb) {
            XSSFColor accent  = new XSSFColor(accentRgb, null);
            XSSFColor altRow  = new XSSFColor(altRowRgb, null);
            XSSFColor titleBg = new XSSFColor(TITLE_BG_RGB, null);
            XSSFColor totalBg = new XSSFColor(TOTAL_BG_RGB, null);
            XSSFColor border  = new XSSFColor(BORDER_RGB, null);
            XSSFColor white   = new XSSFColor(new byte[]{(byte)0xFF,(byte)0xFF,(byte)0xFF}, null);

            XSSFFont boldWhite = wb.createFont();
            boldWhite.setBold(true); boldWhite.setColor(white); boldWhite.setFontHeightInPoints((short) 14);

            XSSFFont boldAccent = wb.createFont();
            boldAccent.setBold(true); boldAccent.setColor(white); boldAccent.setFontHeightInPoints((short) 11);

            XSSFFont subtitleFont = wb.createFont();
            subtitleFont.setColor(new XSSFColor(new byte[]{(byte)0x94,(byte)0xA3,(byte)0xB8}, null));
            subtitleFont.setFontHeightInPoints((short) 10);

            XSSFFont normalFont = wb.createFont();
            normalFont.setFontHeightInPoints((short) 10);

            XSSFFont boldTotalFont = wb.createFont();
            boldTotalFont.setBold(true); boldTotalFont.setFontHeightInPoints((short) 11);
            boldTotalFont.setColor(new XSSFColor(new byte[]{(byte)0x1E,(byte)0x29,(byte)0x3B}, null));

            XSSFFont boldTotalAmtFont = wb.createFont();
            boldTotalAmtFont.setBold(true); boldTotalAmtFont.setFontHeightInPoints((short) 11);
            boldTotalAmtFont.setColor(accent);

            // ── Title
            title = wb.createCellStyle();
            title.setFillForegroundColor(titleBg); title.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            title.setFont(boldWhite);
            title.setAlignment(HorizontalAlignment.CENTER);
            title.setVerticalAlignment(VerticalAlignment.CENTER);

            // ── Subtitle
            subtitle = wb.createCellStyle();
            subtitle.setFillForegroundColor(titleBg); subtitle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            subtitle.setFont(subtitleFont);
            subtitle.setAlignment(HorizontalAlignment.CENTER);
            subtitle.setVerticalAlignment(VerticalAlignment.CENTER);

            // ── Column header (center)
            headerCenter = wb.createCellStyle();
            headerCenter.setFillForegroundColor(accent); headerCenter.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCenter.setFont(boldAccent);
            headerCenter.setAlignment(HorizontalAlignment.CENTER);
            headerCenter.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorder(headerCenter, border);

            // ── Column header (right-align for amount)
            headerRight = wb.createCellStyle();
            headerRight.setFillForegroundColor(accent); headerRight.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerRight.setFont(boldAccent);
            headerRight.setAlignment(HorizontalAlignment.RIGHT);
            headerRight.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorder(headerRight, border);

            // ── Data rows
            data         = makeDataStyle(wb, null,   border, normalFont, HorizontalAlignment.LEFT,   null);
            dataAlt      = makeDataStyle(wb, altRow, border, normalFont, HorizontalAlignment.LEFT,   null);
            dataCenter   = makeDataStyle(wb, null,   border, normalFont, HorizontalAlignment.CENTER, null);
            dataCenterAlt= makeDataStyle(wb, altRow, border, normalFont, HorizontalAlignment.CENTER, null);
            dataAmount   = makeDataStyle(wb, null,   border, normalFont, HorizontalAlignment.RIGHT,  CURRENCY_FORMAT);
            dataAmountAlt= makeDataStyle(wb, altRow, border, normalFont, HorizontalAlignment.RIGHT,  CURRENCY_FORMAT);

            // ── Total row
            totalLabel = wb.createCellStyle();
            totalLabel.setFillForegroundColor(totalBg); totalLabel.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            totalLabel.setFont(boldTotalFont);
            totalLabel.setAlignment(HorizontalAlignment.RIGHT);
            totalLabel.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorder(totalLabel, border);

            totalAmount = wb.createCellStyle();
            totalAmount.setFillForegroundColor(totalBg); totalAmount.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            totalAmount.setFont(boldTotalAmtFont);
            totalAmount.setAlignment(HorizontalAlignment.RIGHT);
            totalAmount.setVerticalAlignment(VerticalAlignment.CENTER);
            totalAmount.setDataFormat(wb.createDataFormat().getFormat(CURRENCY_FORMAT));
            setBorder(totalAmount, border);
        }

        private XSSFCellStyle makeDataStyle(XSSFWorkbook wb, XSSFColor bg, XSSFColor border,
                                             XSSFFont font, HorizontalAlignment align, String numFmt) {
            XSSFCellStyle st = wb.createCellStyle();
            if (bg != null) { st.setFillForegroundColor(bg); st.setFillPattern(FillPatternType.SOLID_FOREGROUND); }
            st.setFont(font);
            st.setAlignment(align);
            st.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorder(st, border);
            if (numFmt != null) st.setDataFormat(wb.createDataFormat().getFormat(numFmt));
            return st;
        }

        private void setBorder(XSSFCellStyle st, XSSFColor color) {
            st.setBorderTop(BorderStyle.THIN);    st.setTopBorderColor(color);
            st.setBorderBottom(BorderStyle.THIN); st.setBottomBorderColor(color);
            st.setBorderLeft(BorderStyle.THIN);   st.setLeftBorderColor(color);
            st.setBorderRight(BorderStyle.THIN);  st.setRightBorderColor(color);
        }
    }
}
