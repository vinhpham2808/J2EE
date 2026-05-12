export const BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1.0";
export const CLOUDINARY_CLOUD_NAME =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dcr9ovybu";
export const CLOUDINARY_UPLOAD_PRESET =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "moneymanager";

export const API_ENDPOINTS = {
    // Auth endpoints
    LOGIN: "/login",
    REGISTER: "/register",
    VERIFY_ACTIVATION: "/verify-activation",
    OTP_RESEND: "/otp/resend",
    FORGOT_PASSWORD: "/forgot-password",
    VERIFY_RESET_OTP: "/verify-reset-otp",
    RESET_PASSWORD: "/reset-password",
    GOOGLE_AUTH: "/auth/google",

    // User profile endpoints
    GET_USER_INFO: "/profile",
    UPDATE_PROFILE: "/profile",
    UPDATE_AUTO_RENEW: "/profile/subscription/auto-renew",

    // Payment endpoints
    CREATE_PAYMENT: "/payments/payos/create",
    CONFIRM_PAYMENT_WEBHOOK: "/payments/payos/confirm-webhook",
    GET_PAYMENT_BY_ORDER_CODE: (orderCode) => `/payments/${orderCode}`,
    SYNC_PAYMENT_STATUS: (orderCode) => `/payments/${orderCode}/status`,

    // Category endpoints
    GET_ALL_CATEGORIES: "/categories",
    ADD_CATEGORY: "/categories",
    UPDATE_CATEGORY: (categoryId) => `/categories/${categoryId}`,
    DELETE_CATEGORY: (categoryId) => `/categories/${categoryId}`,
    CATEGORY_BY_TYPE: (type) => `/categories/type/${type}`,

    // Income endpoints
    GET_ALL_INCOMES: "/incomes",
    ADD_INCOME: "/incomes",
    DELETE_INCOME: (incomeId) => `/incomes/${incomeId}`,
    INCOME_EXCEL_DOWNLOAD: "excel/download/income",
    EMAIL_INCOME: "/email/income-excel",

    // Expense endpoints
    GET_ALL_EXPENSE: "/expenses",
    ADD_EXPENSE: "/expenses",
    IMPORT_EXPENSE_RECEIPT: "/expenses/import-receipt",
    ANALYZE_EXPENSE_RECEIPT: "/expenses/import-receipt/analyze",
    CONFIRM_EXPENSE_RECEIPT_IMPORT: "/expenses/import-receipt/confirm",
    DELETE_EXPENSE: (expenseId) => `/expenses/${expenseId}`,
    EXPENSE_EXCEL_DOWNLOAD: "excel/download/expense",
    EMAIL_EXPENSE: "/email/expense-excel",

    // Filter & Dashboard endpoints
    APPLY_FILTERS: "/filter",
    DASHBOARD_DATA: "/dashboard",

    // Budget endpoints
    GET_BUDGETS: "/budgets",
    SET_BUDGET: "/budgets",
    DELETE_BUDGET: (budgetId) => `/budgets/${budgetId}`,

    // AI assistant endpoints
    GEMINI_CHAT: "/gemini/chat",
    GEMINI_SPENDING_TIPS: "/gemini/spending-tips",

    // Monthly Report endpoints
    MONTHLY_REPORT_CURRENT: "/reports/monthly",
    MONTHLY_REPORT_BY_MONTH: (year, month) => `/reports/monthly/${year}/${month}`,

    // Admin endpoints
    ADMIN_OVERVIEW: "/admin/overview",
    ADMIN_PAYMENTS: "/admin/payments",
    ADMIN_BROADCAST: "/admin/notifications/broadcast",
    ADMIN_NOTIFICATIONS: "/admin/notifications",
    ADMIN_NOTIFICATION_UPDATE: (id) => `/admin/notifications/${id}`,
    ADMIN_NOTIFICATION_DELETE: (id) => `/admin/notifications/${id}`,
    ADMIN_USERS: "/admin/users",
    ADMIN_USER_DETAIL: (id) => `/admin/users/${id}`,
    ADMIN_USER_UPDATE: (id) => `/admin/users/${id}`,
    ADMIN_USER_DELETE: (id) => `/admin/users/${id}`,

    // Notification endpoints
    GET_NOTIFICATIONS: "/notifications",
    GET_UNREAD_COUNT: "/notifications/unread-count",
    MARK_NOTIFICATION_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_NOTIFICATIONS_READ: "/notifications/read-all",

    // Saving Goal endpoints
    GET_SAVING_GOALS: "/saving-goals",
    ADD_SAVING_GOAL: "/saving-goals",
    SAVING_GOAL_DETAIL: (id) => `/saving-goals/${id}`,
    UPDATE_SAVING_GOAL: (id) => `/saving-goals/${id}`,
    DELETE_SAVING_GOAL: (id) => `/saving-goals/${id}`,
    SAVING_GOAL_CONTRIBUTIONS: (id) => `/saving-goals/${id}/contributions`,
    ADD_SAVING_GOAL_CONTRIBUTION: (id) => `/saving-goals/${id}/contributions`,

    // Document generation (Lambda)
    GENERATE_INVOICE: "/documents/invoice",
    GENERATE_EXPENSE_REPORT: "/documents/report/expense",

    // Image upload
    UPLOAD_IMAGE: "/files/upload",

    // Email Notification Preferences
    GET_EMAIL_PREFERENCES: "/profile/email-preferences",
    UPDATE_EMAIL_PREFERENCES: "/profile/email-preferences",
    RESET_EMAIL_PREFERENCES: "/profile/email-preferences/reset",

    // Forecast endpoints
    FORECAST_MONTHLY: (year, month) => `/forecast/monthly?year=${year}&month=${month}`,
    FORECAST_ANOMALIES: "/forecast/anomalies",
    FORECAST_CATEGORY_TREND: (categoryId, months) => `/forecast/category-trend/${categoryId}?months=${months}`,
    FORECAST_INSIGHTS: "/forecast/insights",
}
