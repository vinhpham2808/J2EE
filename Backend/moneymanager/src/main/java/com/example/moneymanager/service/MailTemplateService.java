package com.example.moneymanager.service;

import org.springframework.stereotype.Service;

@Service
public class MailTemplateService {

    // ─── Shared HTML wrapper ─────────────────────────────────────────

    public String wrapInTemplate(String title, String contentHtml) {
        return "<!DOCTYPE html><html lang=\"vi\">"
            + "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">"
            + "<title>" + escape(title) + "</title></head>"
            + "<body style=\"margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background-color:#f4f6f8;\">"
            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background-color:#f4f6f8;\">"
            + "<tr><td align=\"center\" style=\"padding:40px 20px;\">"
            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"600\" style=\"max-width:600px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;\">"

            // Header
            + "<tr><td style=\"background-color:#667eea;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:36px 40px 28px;text-align:center;\">"
            + "<div style=\"font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;\">&#128176; Money Manager</div>"
            + "<div style=\"font-size:13px;color:rgba(255,255,255,0.82);margin-top:6px;font-weight:400;\">Qu&#7843;n l&#253; t&#224;i ch&#237;nh th&#244;ng minh</div>"
            + "</td></tr>"

            // Content
            + "<tr><td style=\"padding:36px 40px 28px;\">" + contentHtml + "</td></tr>"

            // Footer
            + "<tr><td style=\"background-color:#f8fafc;border-top:1px solid #e8ecf0;padding:20px 40px;text-align:center;\">"
            + "<p style=\"margin:0;font-size:12px;color:#9ca3af;line-height:1.7;\">"
            + java.time.Year.now().getValue() + " - &#272;&#432;&#7907;c ph&#225;t tri&#7875;n v&#224; x&#226;y d&#7921;ng b&#7903;i <strong style=\"color:#d97706;\">BotDev</strong><br>"
            + "Email n&#224;y &#273;&#432;&#7907;c g&#7917;i t&#7921; &#273;&#7897;ng &#8211; vui l&#242;ng kh&#244;ng tr&#7843; l&#7901;i.<br>"
            + "N&#7871;u b&#7841;n kh&#244;ng y&#234;u c&#7847;u h&#224;nh &#273;&#7897;ng n&#224;y, h&#227;y b&#7887; qua email n&#224;y."
            + "</p></td></tr>"

            + "</table></td></tr></table>"
            + "</body></html>";
    }

    // ─── OTP: Account Activation ─────────────────────────────────────

    public String buildActivationOtpEmail(String fullName, String otpCode) {
        String name = fullName != null && !fullName.isBlank() ? escape(fullName) : "b&#7841;n";
        String content =
            "<h2 style=\"margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1a2e;\">X&#225;c th&#7921;c t&#224;i kho&#7843;n</h2>"
            + "<p style=\"margin:0 0 20px;font-size:15px;color:#6b7280;\">Xin ch&#224;o <strong style=\"color:#374151;\">" + name + "</strong>,</p>"
            + "<p style=\"margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;\">C&#7843;m &#417;n b&#7841;n &#273;&#227; &#273;&#259;ng k&#253; t&#224;i kho&#7843;n <strong>Money Manager</strong>. H&#227;y nh&#7853;p m&#227; OTP b&#234;n d&#432;&#7899;i &#273;&#7875; ho&#224;n t&#7845;t vi&#7879;c x&#225;c th&#7921;c:</p>"

            // OTP box
            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"margin-bottom:28px;\">"
            + "<tr><td align=\"center\">"
            + "<div style=\"display:inline-block;background:#f0f0ff;border:2px dashed #667eea;border-radius:16px;padding:24px 52px;text-align:center;\">"
            + "<div style=\"font-size:11px;font-weight:700;letter-spacing:3px;color:#7c3aed;text-transform:uppercase;margin-bottom:10px;\">M&#195;&#195; X&#193;C TH&#7920;C</div>"
            + "<div style=\"font-size:44px;font-weight:800;letter-spacing:12px;color:#667eea;font-family:'Courier New',Courier,monospace;\">" + escapeOtp(otpCode) + "</div>"
            + "<div style=\"font-size:12px;color:#9ca3af;margin-top:10px;\">Hi&#7879;u l&#7921;c trong <strong style=\"color:#dc2626;\">200 gi&#226;y</strong></div>"
            + "</div>"
            + "</td></tr></table>"

            // Warning box
            + "<div style=\"background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;margin-bottom:24px;\">"
            + "<p style=\"margin:0;font-size:13px;color:#92400e;line-height:1.7;\"><strong>&#9888;&#65039; L&#432;u &#253; b&#7843;o m&#7853;t:</strong><br>"
            + "&#8226; M&#227; OTP ch&#7881; c&#243; hi&#7879;u l&#7921;c trong <strong>200 gi&#226;y</strong><br>"
            + "&#8226; Kh&#244;ng chia s&#7867; m&#227; n&#224;y v&#7899;i b&#7845;t k&#7923; ai<br>"
            + "&#8226; Money Manager s&#7869; kh&#244;ng bao gi&#7901; h&#7887;i m&#227; OTP qua &#273;i&#7879;n tho&#7841;i</p>"
            + "</div>"

            + "<p style=\"margin:0;font-size:13px;color:#9ca3af;\">N&#7871;u b&#7841;n kh&#244;ng th&#7921;c hi&#7879;n &#273;&#259;ng k&#253; t&#224;i kho&#7843;n n&#224;y, vui l&#242;ng b&#7887; qua email n&#224;y.</p>";

        return wrapInTemplate("Xác thực tài khoản Money Manager", content);
    }

    // ─── OTP: Password Reset ─────────────────────────────────────────

    public String buildPasswordResetOtpEmail(String fullName, String otpCode) {
        String name = fullName != null && !fullName.isBlank() ? escape(fullName) : "b&#7841;n";
        String content =
            "<h2 style=\"margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1a2e;\">&#272;&#7863;t l&#7841;i m&#7853;t kh&#7849;u</h2>"
            + "<p style=\"margin:0 0 20px;font-size:15px;color:#6b7280;\">Xin ch&#224;o <strong style=\"color:#374151;\">" + name + "</strong>,</p>"
            + "<p style=\"margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;\">Ch&#250;ng t&#244;i nh&#7853;n &#273;&#432;&#7907;c y&#234;u c&#7847;u &#273;&#7863;t l&#7841;i m&#7853;t kh&#7849;u cho t&#224;i kho&#7843;n <strong>Money Manager</strong> c&#7911;a b&#7841;n. Vui l&#242;ng s&#7917; d&#7909;ng m&#227; OTP b&#234;n d&#432;&#7899;i:</p>"

            // OTP box – red theme for urgency
            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"margin-bottom:28px;\">"
            + "<tr><td align=\"center\">"
            + "<div style=\"display:inline-block;background:#fff0f0;border:2px dashed #ef4444;border-radius:16px;padding:24px 52px;text-align:center;\">"
            + "<div style=\"font-size:11px;font-weight:700;letter-spacing:3px;color:#dc2626;text-transform:uppercase;margin-bottom:10px;\">M&#195;&#195; &#272;&#7840;T L&#7840;I M&#7840;T KH&#7842;U</div>"
            + "<div style=\"font-size:44px;font-weight:800;letter-spacing:12px;color:#ef4444;font-family:'Courier New',Courier,monospace;\">" + escapeOtp(otpCode) + "</div>"
            + "<div style=\"font-size:12px;color:#9ca3af;margin-top:10px;\">Hi&#7879;u l&#7921;c trong <strong style=\"color:#dc2626;\">200 gi&#226;y</strong></div>"
            + "</div>"
            + "</td></tr></table>"

            + "<div style=\"background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;margin-bottom:24px;\">"
            + "<p style=\"margin:0;font-size:13px;color:#92400e;line-height:1.7;\"><strong>&#9888;&#65039; L&#432;u &#253; b&#7843;o m&#7853;t:</strong><br>"
            + "&#8226; M&#227; OTP ch&#7881; c&#243; hi&#7879;u l&#7921;c trong <strong>200 gi&#226;y</strong><br>"
            + "&#8226; Kh&#244;ng chia s&#7867; m&#227; n&#224;y v&#7899;i b&#7845;t k&#7923; ai<br>"
            + "&#8226; Money Manager s&#7869; kh&#244;ng bao gi&#7901; h&#7887;i m&#227; OTP qua &#273;i&#7879;n tho&#7841;i</p>"
            + "</div>"

            + "<p style=\"margin:0;font-size:13px;color:#9ca3af;\">N&#7871;u b&#7841;n kh&#244;ng y&#234;u c&#7847;u &#273;&#7863;t l&#7841;i m&#7853;t kh&#7849;u, vui l&#242;ng b&#7887; qua email n&#224;y. T&#224;i kho&#7843;n c&#7911;a b&#7841;n v&#7851;n an to&#224;n.</p>";

        return wrapInTemplate("Đặt lại mật khẩu Money Manager", content);
    }

    // ─── Budget Alert ────────────────────────────────────────────────

    public String buildBudgetAlertEmail(String fullName, String alertType, String colorHex,
                                         String categoryName, String limitStr, String spentStr, String percentage) {
        String name = fullName != null && !fullName.isBlank() ? escape(fullName) : "b&#7841;n";
        boolean isExceeded = alertType.contains("V&#431;&#7906;T") || alertType.contains("VƯỢT") || alertType.contains("exceeded");
        String badgeBg = isExceeded ? "#fee2e2" : "#fef3c7";
        String badgeColor = isExceeded ? "#dc2626" : "#d97706";
        String icon = isExceeded ? "&#128680;" : "&#9888;&#65039;";

        String content =
            "<h2 style=\"margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1a2e;\">" + icon + " C&#7843;nh b&#225;o ng&#226;n s&#225;ch</h2>"
            + "<p style=\"margin:0 0 20px;font-size:15px;color:#6b7280;\">Xin ch&#224;o <strong style=\"color:#374151;\">" + name + "</strong>,</p>"

            + "<div style=\"background:" + badgeBg + ";border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;\">"
            + "<div style=\"font-size:17px;font-weight:700;color:" + badgeColor + ";\">" + escape(alertType) + "</div>"
            + "<div style=\"font-size:14px;color:" + badgeColor + ";margin-top:4px;\">Danh m&#7909;c: <strong>" + escape(categoryName) + "</strong></div>"
            + "</div>"

            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"border-collapse:collapse;margin-bottom:24px;\">"
            + "<tr style=\"background:#f8fafc;\"><td style=\"padding:11px 14px;border:1px solid #e2e8f0;font-size:14px;color:#6b7280;width:40%;\"><strong>Danh m&#7909;c</strong></td>"
            + "<td style=\"padding:11px 14px;border:1px solid #e2e8f0;font-size:14px;color:#374151;\">" + escape(categoryName) + "</td></tr>"
            + "<tr><td style=\"padding:11px 14px;border:1px solid #e2e8f0;font-size:14px;color:#6b7280;\"><strong>H&#7841;n m&#7913;c</strong></td>"
            + "<td style=\"padding:11px 14px;border:1px solid #e2e8f0;font-size:14px;color:#374151;\">" + escape(limitStr) + " VN&#272;</td></tr>"
            + "<tr style=\"background:#f8fafc;\"><td style=\"padding:11px 14px;border:1px solid #e2e8f0;font-size:14px;color:#6b7280;\"><strong>&#272;&#227; chi</strong></td>"
            + "<td style=\"padding:11px 14px;border:1px solid #e2e8f0;font-size:14px;color:#374151;\">" + escape(spentStr) + " VN&#272;</td></tr>"
            + "<tr><td style=\"padding:11px 14px;border:1px solid #e2e8f0;font-size:14px;color:#6b7280;\"><strong>T&#7927; l&#7879; s&#7917; d&#7909;ng</strong></td>"
            + "<td style=\"padding:11px 14px;border:1px solid #e2e8f0;font-size:14px;\"><strong style=\"color:" + colorHex + ";font-size:16px;\">" + escape(percentage) + "</strong></td></tr>"
            + "</table>"

            + "<p style=\"margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;\">H&#227;y ki&#7875;m tra v&#224; &#273;i&#7873;u ch&#7881;nh chi ti&#234;u c&#7911;a b&#7841;n &#273;&#7875; duy tr&#236; k&#7871; ho&#7841;ch t&#224;i ch&#237;nh.</p>"

            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:0 auto;\">"
            + "<tr><td align=\"center\" style=\"border-radius:10px;background-color:#667eea;\">"
            + "<a href=\"#\" style=\"display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;\">&#128200; Xem ng&#226;n s&#225;ch</a>"
            + "</td></tr></table>";

        return wrapInTemplate("Cảnh báo ngân sách – " + categoryName, content);
    }

    // ─── Report Email (S3 presigned link) ────────────────────────────

    public String buildReportEmail(String fullName, int month, int year, String reportType, String s3Link) {
        String name = fullName != null && !fullName.isBlank() ? escape(fullName) : "b&#7841;n";
        String reportLabel = reportType.contains("income") ? "thu nh&#7853;p" : "chi ti&#234;u";

        String content =
            "<h2 style=\"margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1a2e;\">&#128202; B&#225;o c&#225;o " + reportLabel + "</h2>"
            + "<p style=\"margin:0 0 20px;font-size:15px;color:#6b7280;\">Xin ch&#224;o <strong style=\"color:#374151;\">" + name + "</strong>,</p>"
            + "<p style=\"margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7;\">"
            + "B&#225;o c&#225;o <strong>" + reportLabel + "</strong> th&#225;ng <strong>" + month + "/" + year + "</strong> c&#7911;a b&#7841;n &#273;&#227; &#273;&#432;&#7907;c t&#7841;o th&#224;nh c&#244;ng."
            + "</p>"

            + "<div style=\"background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 20px;margin-bottom:28px;\">"
            + "<div style=\"font-size:14px;color:#15803d;\">&#9989; <strong>B&#225;o c&#225;o &#273;&#227; s&#7861;n s&#224;ng &#273;&#7875; t&#7843;i v&#7873;</strong></div>"
            + "<div style=\"font-size:13px;color:#16a34a;margin-top:5px;\">K&#7923; b&#225;o c&#225;o: Th&#225;ng " + month + "/" + year + "</div>"
            + "</div>"

            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:0 auto 28px;\">"
            + "<tr><td align=\"center\" style=\"border-radius:10px;background-color:#667eea;\">"
            + "<a href=\"" + s3Link + "\" style=\"display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;\">&#128229; T&#7843;i B&#225;o C&#225;o Excel</a>"
            + "</td></tr></table>"

            + "<p style=\"margin:0;font-size:12px;color:#9ca3af;text-align:center;\">&#9200; Li&#234;n k&#7871;t t&#7843;i v&#7873; c&#243; hi&#7879;u l&#7921;c trong <strong>1 gi&#7901;</strong> t&#7915; th&#7901;i &#273;i&#7875;m g&#7917;i email n&#224;y.</p>";

        return wrapInTemplate("Báo cáo " + (reportType.contains("income") ? "thu nhập" : "chi tiêu") + " tháng " + month + "/" + year, content);
    }

    // ─── Daily Reminder ──────────────────────────────────────────────

    public String buildDailyReminderEmail(String fullName, String frontendUrl) {
        String name = fullName != null && !fullName.isBlank() ? escape(fullName) : "b&#7841;n";
        String content =
            "<h2 style=\"margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1a2e;\">&#128221; Nh&#7855;c nh&#7903; h&#7857;ng ng&#224;y</h2>"
            + "<p style=\"margin:0 0 20px;font-size:15px;color:#6b7280;\">Xin ch&#224;o <strong style=\"color:#374151;\">" + name + "</strong>,</p>"
            + "<p style=\"margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.7;\">"
            + "&#272;&#226;y l&#224; l&#7901;i nh&#7855;c &#273;&#7875; b&#7841;n c&#7853;p nh&#7853;t c&#225;c kho&#7843;n thu v&#224; chi trong h&#244;m nay tr&#234;n <strong>Money Manager</strong>. Theo d&#245;i t&#224;i ch&#237;nh &#273;&#7873;u &#273;&#7863;n gi&#250;p b&#7841;n &#273;&#7841;t m&#7909;c ti&#234;u nhanh h&#417;n!"
            + "</p>"
            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:0 auto;\">"
            + "<tr><td align=\"center\" style=\"border-radius:10px;background-color:#667eea;\">"
            + "<a href=\"" + frontendUrl + "\" style=\"display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;\">&#128640; M&#7903; Money Manager</a>"
            + "</td></tr></table>";

        return wrapInTemplate("Nhắc nhở hằng ngày – Money Manager", content);
    }

    // ─── Daily Expense Summary ────────────────────────────────────────

    public String buildDailyExpenseSummaryEmail(String fullName, String tableHtml) {
        String name = fullName != null && !fullName.isBlank() ? escape(fullName) : "b&#7841;n";
        String content =
            "<h2 style=\"margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1a2e;\">&#128203; T&#7893;ng h&#7907;p chi ti&#234;u h&#244;m nay</h2>"
            + "<p style=\"margin:0 0 20px;font-size:15px;color:#6b7280;\">Xin ch&#224;o <strong style=\"color:#374151;\">" + name + "</strong>,</p>"
            + "<p style=\"margin:0 0 20px;font-size:15px;color:#6b7280;\">D&#432;&#7899;i &#273;&#226;y l&#224; t&#7893;ng h&#7907;p c&#225;c kho&#7843;n chi c&#7911;a b&#7841;n trong h&#244;m nay:</p>"
            + tableHtml
            + "<p style=\"margin:20px 0 0;font-size:13px;color:#9ca3af;\">Ti&#7871;p t&#7909;c theo d&#245;i chi ti&#234;u &#273;&#7875; &#273;&#7841;t m&#7909;c ti&#234;u t&#224;i ch&#237;nh c&#7911;a b&#7841;n! &#128170;</p>";

        return wrapInTemplate("Tổng hợp chi tiêu hằng ngày – Money Manager", content);
    }

    // ─── Welcome Email ───────────────────────────────────────────────

    public String buildWelcomeEmail(String fullName) {
        String name = fullName != null && !fullName.isBlank() ? escape(fullName) : "b&#7841;n";
        String content =
            "<h2 style=\"margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1a2e;\">Ch&#224;o m&#7915;ng b&#7841;n &#273;&#7871;n v&#7899;i Money Manager! &#127881;</h2>"
            + "<p style=\"margin:0 0 20px;font-size:15px;color:#6b7280;\">Xin ch&#224;o <strong style=\"color:#374151;\">" + name + "</strong>,</p>"
            + "<p style=\"margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7;\">T&#224;i kho&#7843;n c&#7911;a b&#7841;n &#273;&#227; &#273;&#432;&#7907;c k&#237;ch ho&#7841;t th&#224;nh c&#244;ng! Ch&#250;ng t&#244;i r&#7845;t vui m&#7915;ng &#273;&#432;&#7907;c &#273;&#7891;ng h&#224;nh c&#249;ng b&#7841;n tr&#234;n h&#224;nh tr&#236;nh qu&#7843;n l&#253; t&#224;i ch&#237;nh th&#244;ng minh h&#417;n.</p>"

            // Feature highlights
            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"margin:0 0 28px;\">"
            + "<tr><td style=\"background:#f0fdf4;border-radius:12px;padding:20px 24px;border-left:4px solid #22c55e;\">"
            + "<p style=\"margin:0 0 14px;font-size:14px;font-weight:700;color:#166534;\">B&#7841;n c&#243; th&#7875; l&#224;m g&#236; ngay b&#226;y gi&#7901;?</p>"
            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\">"
            + buildFeatureRow("&#128200;", "Theo d&#245;i thu chi h&#224;ng ng&#224;y d&#7877; d&#224;ng")
            + buildFeatureRow("&#127979;", "&#272;&#7863;t ng&#226;n s&#225;ch v&#224; nh&#7853;n c&#7843;nh b&#225;o khi v&#432;&#7907;t m&#7913;c")
            + buildFeatureRow("&#127919;", "T&#7841;o m&#7909;c ti&#234;u ti&#7871;t ki&#7879;m v&#224; theo d&#245;i ti&#7871;n &#273;&#7897;")
            + buildFeatureRow("&#129302;", "Ph&#226;n t&#237;ch chi ti&#234;u b&#7857;ng AI th&#244;ng minh")
            + "</table>"
            + "</td></tr></table>"

            // Plan badge
            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"margin:0 0 28px;\">"
            + "<tr><td style=\"background:#fff7ed;border-radius:12px;padding:16px 20px;border:1px solid #fed7aa;text-align:center;\">"
            + "<p style=\"margin:0;font-size:13px;color:#92400e;\">G&#243;i hi&#7879;n t&#7841;i c&#7911;a b&#7841;n: <strong style=\"color:#d97706;\">FREE</strong> &mdash; N&#226;ng c&#7845;p l&#234;n BASIC ho&#7863;c PREMIUM &#273;&#7875; m&#7903; kh&#243;a th&#234;m t&#237;nh n&#259;ng.</p>"
            + "</td></tr></table>"

            // CTA button
            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"margin:0 0 8px;\">"
            + "<tr><td align=\"center\">"
            + "<a href=\"https://moneymanager.io/dashboard\" style=\"display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;\">&#128640; B&#7855;t &#273;&#7847;u ngay</a>"
            + "</td></tr></table>";

        return wrapInTemplate("Chào mừng đến với Money Manager", content);
    }

    private String buildFeatureRow(String icon, String text) {
        return "<tr><td style=\"padding:4px 0;\">"
            + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\">"
            + "<tr>"
            + "<td style=\"font-size:14px;width:22px;vertical-align:top;padding-top:1px;\">" + icon + "</td>"
            + "<td style=\"font-size:13px;color:#374151;padding-left:8px;line-height:1.6;\">" + text + "</td>"
            + "</tr></table>"
            + "</td></tr>";
    }

    // ─── Helpers ─────────────────────────────────────────────────────

    private String escape(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private String escapeOtp(String otp) {
        if (otp == null) return "";
        // OTP is numeric only, so no HTML-special chars, but escape anyway
        return otp.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
