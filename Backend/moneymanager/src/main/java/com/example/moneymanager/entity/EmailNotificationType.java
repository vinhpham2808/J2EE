package com.example.moneymanager.entity;

public enum EmailNotificationType {

    // CRITICAL EMAILS (Cannot be disabled)
    ACCOUNT_SECURITY("Bảo mật tài khoản", "🔐", true, false),
    PAYMENT_CONFIRMATION("Xác nhận thanh toán", "💳", true, false),
    SUBSCRIPTION_EXPIRATION("Cảnh báo hết hạn subscription", "🚨", true, false),

    // OPTIONAL EMAILS (Can be disabled)
    BUDGET_ALERTS("Cảnh báo vượt mức budget", "📊", false, true),
    DAILY_EXPENSE_REPORT("Báo cáo chi tiêu hàng ngày", "💰", false, true),
    WEEKLY_REPORT("Báo cáo hàng tuần", "📈", false, true),
    MONTHLY_REPORT("Báo cáo hàng tháng", "📊", false, true),
    SAVING_GOAL_PROGRESS("Tiến độ mục tiêu tiết kiệm", "🎯", false, true),
    TIPS_AND_RECOMMENDATIONS("Mẹo & Khuyến nghị", "💡", false, true),
    PROMOTIONS("Khuyến mãi & Cập nhật", "📢", false, true);

    private final String displayName;
    private final String icon;
    private final boolean critical;
    private final boolean optional;

    EmailNotificationType(String displayName, String icon, boolean critical, boolean optional) {
        this.displayName = displayName;
        this.icon = icon;
        this.critical = critical;
        this.optional = optional;
    }

    public String getDisplayName() { return displayName; }
    public String getIcon() { return icon; }
    public boolean isCritical() { return critical; }
    public boolean isOptional() { return optional; }
    public boolean getDefaultEnabled() { return true; }
}
