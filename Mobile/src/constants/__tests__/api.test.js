import { API_ENDPOINTS, BASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../api";

describe("api constants", () => {
  test("exports required values", () => {
    expect(BASE_URL).toBeTruthy();
    expect(CLOUDINARY_CLOUD_NAME).toBeTruthy();
    expect(CLOUDINARY_UPLOAD_PRESET).toBeTruthy();
  });

  test("API_ENDPOINTS contains all expected keys", () => {
    const expectedTopLevelKeys = [
      "HEALTH", "LOGIN", "REGISTER", "ACTIVATE", "VERIFY_OTP", "RESEND_OTP",
      "FORGOT_PASSWORD", "VERIFY_RESET_OTP", "RESET_PASSWORD", "COMPLETE_PROFILE", "GOOGLE_AUTH",
      "GET_USER_INFO", "UPDATE_PROFILE", "UPDATE_AUTO_RENEW",
      "DASHBOARD_DATA", "AI_INSIGHT", "AI_INSIGHT_DETAILED",
      "GET_ALL_EXPENSE", "ADD_EXPENSE", "UPDATE_EXPENSE", "DELETE_EXPENSE",
      "GET_ALL_INCOMES", "ADD_INCOME", "UPDATE_INCOME", "DELETE_INCOME",
      "GET_BUDGETS", "SET_BUDGET", "DELETE_BUDGET",
      "GET_GOALS", "ADD_GOAL", "UPDATE_GOAL", "DELETE_GOAL",
      "GET_JARS", "ADD_JAR", "UPDATE_JAR", "DELETE_JAR",
      "GET_ALL_CATEGORIES", "ADD_CATEGORY", "UPDATE_CATEGORY", "DELETE_CATEGORY",
      "GET_NOTIFICATIONS", "GET_UNREAD_COUNT",
      "MONTHLY_REPORT", "MONTHLY_REPORT_BY_MONTH",
      "UPLOAD_IMAGE", "ANALYZE_EXPENSE_RECEIPT",
      "FORECAST_MONTHLY", "FORECAST_ANOMALIES", "FORECAST_INSIGHTS",
      "REQUEST_PAYMENT_OTP", "VERIFY_PAYMENT_OTP", "GET_PAYMENTS", "CREATE_PAYMENT",
      "INCOME_EXCEL_DOWNLOAD", "EXPENSE_EXCEL_DOWNLOAD",
      "EMAIL_INCOME", "EMAIL_EXPENSE",
      "VOICE_PARSE", "GEMINI_CHAT", "AI_CHAT", "AI_PARSE_INTENT",
      "GET_EMAIL_PREFERENCES", "UPDATE_EMAIL_PREFERENCES",
    ];

    expectedTopLevelKeys.forEach((key) => {
      expect(API_ENDPOINTS).toHaveProperty(key);
    });
  });

  test("function endpoints return dynamic paths", () => {
    expect(API_ENDPOINTS.UPDATE_EXPENSE("123")).toBe("/expenses/123");
    expect(API_ENDPOINTS.MARK_NOTIFICATION_READ("abc")).toBe("/notifications/abc/read");
    expect(API_ENDPOINTS.FORECAST_MONTHLY(2026, 6)).toBe("/forecast/monthly?year=2026&month=6");
    expect(API_ENDPOINTS.FORECAST_CATEGORY_TREND("cat1", 3)).toBe("/forecast/category-trend/cat1?months=3");
    expect(API_ENDPOINTS.AI_UNDO("op1")).toBe("/ai/undo/op1");
    expect(API_ENDPOINTS.AI_CHAT_MESSAGES("session1")).toBe("/ai/chat/sessions/session1/messages");
  });

  test("UPLOAD_IMAGE includes Cloudinary URL", () => {
    expect(API_ENDPOINTS.UPLOAD_IMAGE).toContain("cloudinary.com");
    expect(API_ENDPOINTS.UPLOAD_IMAGE).toContain(CLOUDINARY_CLOUD_NAME);
  });

  test("HEALTH endpoint is correct", () => {
    expect(API_ENDPOINTS.HEALTH).toBe("/health");
  });
});
