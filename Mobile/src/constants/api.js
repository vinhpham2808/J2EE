const FALLBACK_PROD_API_URL = "https://money-manager-ln9d.onrender.com/api/v1.0";

export const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_PROD_API_URL;
export const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "dcr9ovybu";
export const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "moneymanager";

export const API_ENDPOINTS = {
  // Health
  HEALTH: "/health",

  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  ACTIVATE: "/activate",
  VERIFY_OTP: "/verify-activation",
  RESEND_OTP: "/otp/resend",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_RESET_OTP: "/verify-reset-otp",
  RESET_PASSWORD: "/reset-password",
  COMPLETE_PROFILE: "/complete-profile",
  GOOGLE_AUTH: "/auth/google",

  // Profile
  GET_USER_INFO: "/profile",
  UPDATE_PROFILE: "/profile",
  UPDATE_AUTO_RENEW: "/profile/subscription/auto-renew",

  // Notifications
  GET_NOTIFICATIONS: "/notifications",
  GET_UNREAD_COUNT: "/notifications/unread-count",
  MARK_NOTIFICATION_READ: (id) => `/notifications/${id}/read`,
  MARK_ALL_NOTIFICATIONS_READ: "/notifications/read-all",

  // Email Preferences
  GET_EMAIL_PREFERENCES: "/profile/email-preferences",
  UPDATE_EMAIL_PREFERENCES: "/profile/email-preferences",

  // Documents/Export
  EXPORT_EXPENSE: "/documents/report/expense",
  EXPORT_INCOME: "/documents/report/income",

  // Dashboard
  DASHBOARD_DATA: "/dashboard",
  AI_INSIGHT: "/dashboard/ai-insight",
  AI_INSIGHT_DETAILED: "/dashboard/ai-insight/detailed",
  AI_INSIGHT_FORECAST: (year, month) => `/dashboard/ai-insight/forecast?year=${year}&month=${month}`,

  // Gemini AI
  VOICE_PARSE: "/gemini/voice-parse",
  GEMINI_CHAT: "/gemini/chat",
  AI_CHAT: "/ai/chat",
  AI_PARSE_INTENT: "/ai/parse-intent",
  AI_CONFIRM_ACTION: "/ai/confirm-action",
  AI_UNDO: (operationId) => `/ai/undo/${operationId}`,
  AI_PAGE_CONTEXT: (page) => `/ai/page-context?page=${page}`,
  AI_CHAT_SESSIONS: "/ai/chat/sessions",
  AI_CHAT_MESSAGES: (sessionId) => `/ai/chat/sessions/${sessionId}/messages`,
  AI_CHAT_REPLACE_MESSAGES: (sessionId) => `/ai/chat/sessions/${sessionId}/messages`,
  AI_CHAT_RENAME_SESSION: (sessionId) => `/ai/chat/sessions/${sessionId}/rename`,
  AI_CHAT_DELETE_SESSION: (sessionId) => `/ai/chat/sessions/${sessionId}`,
  INCOME_EXCEL_DOWNLOAD: "/excel/download/income",
  EXPENSE_EXCEL_DOWNLOAD: "/excel/download/expense",
  EMAIL_INCOME: "/email/income-excel",
  EMAIL_EXPENSE: "/email/expense-excel",

  // Reports
  MONTHLY_REPORT: "/reports/monthly",
  MONTHLY_REPORT_BY_MONTH: (year, month) => `/reports/monthly/${year}/${month}`,

  // Categories
  GET_ALL_CATEGORIES: "/categories",
  ADD_CATEGORY: "/categories",
  UPDATE_CATEGORY: (categoryId) => `/categories/${categoryId}`,
  DELETE_CATEGORY: (categoryId) => `/categories/${categoryId}`,
  CATEGORY_BY_TYPE: (type) => `/categories/type/${type}`,

  // Expenses
  GET_ALL_EXPENSE: "/expenses",
  ADD_EXPENSE: "/expenses",
  DELETE_EXPENSE: (expenseId) => `/expenses/${expenseId}`,

  // Receipt Import (PREMIUM)
  ANALYZE_EXPENSE_RECEIPT: "/expenses/import-receipt/analyze",
  CONFIRM_EXPENSE_RECEIPT_IMPORT: "/expenses/import-receipt/confirm",

  // Incomes
  GET_ALL_INCOMES: "/incomes",
  ADD_INCOME: "/incomes",
  DELETE_INCOME: (incomeId) => `/incomes/${incomeId}`,

  // Budgets
  GET_BUDGETS: "/budgets",
  SET_BUDGET: "/budgets",
  DELETE_BUDGET: (id) => `/budgets/${id}`,

  // Goals
  GET_GOALS: "/saving-goals",
  ADD_GOAL: "/saving-goals",
  UPDATE_GOAL: (id) => `/saving-goals/${id}`,
  DELETE_GOAL: (id) => `/saving-goals/${id}`,
  GOAL_CONTRIBUTIONS: (id) => `/saving-goals/${id}/contributions`,
  ADD_GOAL_CONTRIBUTION: (id) => `/saving-goals/${id}/contributions`,

  // Filters
  APPLY_FILTERS: "/filter",

  // Forecast (PREMIUM)
  FORECAST_MONTHLY: (year, month) => `/forecast/monthly?year=${year}&month=${month}`,
  FORECAST_ANOMALIES: (year, month) => (
    year && month ? `/forecast/anomalies?year=${year}&month=${month}` : "/forecast/anomalies"
  ),
  FORECAST_CATEGORY_TREND: (categoryId, months = 6) => `/forecast/category-trend/${categoryId}?months=${months}`,
  FORECAST_INSIGHTS: "/forecast/insights",

  // Payment & OTP
  REQUEST_PAYMENT_OTP: "/payments/otp/request",
  VERIFY_PAYMENT_OTP: "/payments/otp/verify",
  CREATE_PAYMENT: "/payments/payos/create",
  GET_PAYMENT_BY_ORDER_CODE: (orderCode) => `/payments/${orderCode}`,
  SYNC_PAYMENT_STATUS: (orderCode) => `/payments/${orderCode}/status`,

  // Image upload
  UPLOAD_IMAGE: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,

  // Jar endpoints
  GET_JARS: "/jars",
  ADD_JAR: "/jars",
  UPDATE_JAR: (jarId) => `/jars/${jarId}`,
  DELETE_JAR: (jarId) => `/jars/${jarId}`,
  TRANSFER_JAR: "/jars/transfer"
};
