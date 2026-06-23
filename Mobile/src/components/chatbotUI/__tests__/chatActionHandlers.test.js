jest.mock("../../../services/apiClient", () => ({ get: jest.fn() }));
jest.mock("../../../constants/api", () => ({
  API_ENDPOINTS: {
    INCOME_EXCEL_DOWNLOAD: "/excel/download/income",
    EXPENSE_EXCEL_DOWNLOAD: "/excel/download/expense",
    EMAIL_INCOME: "/email/income-excel",
    EMAIL_EXPENSE: "/email/expense-excel",
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => ({ "chatbot.unknownAction": "Không xác định", "chatbot.exportIncome": "Đã xuất thu nhập", "chatbot.exportExpense": "Đã xuất chi tiêu", "chatbot.emailIncome": "Đã gửi email thu nhập", "chatbot.emailExpense": "Đã gửi email chi tiêu" }[key] || key) }),
}));

import { executeExportAction } from "../chatActionHandlers";

describe("chatActionHandlers", () => {
  const apiClient = require("../../../services/apiClient");
  const { useTranslation } = require("react-i18next");
  const { t } = useTranslation();

  beforeEach(() => { jest.clearAllMocks(); });

  test("EXPORT_EXCEL_INCOME calls correct endpoint", async () => {
    apiClient.get.mockResolvedValueOnce({});
    const message = await executeExportAction("EXPORT_EXCEL_INCOME", t);
    expect(apiClient.get).toHaveBeenCalledWith("/excel/download/income");
    expect(message).toBe("Đã xuất thu nhập");
  });

  test("EXPORT_EXCEL_EXPENSE calls correct endpoint", async () => {
    apiClient.get.mockResolvedValueOnce({});
    const message = await executeExportAction("EXPORT_EXCEL_EXPENSE", t);
    expect(apiClient.get).toHaveBeenCalledWith("/excel/download/expense");
    expect(message).toBe("Đã xuất chi tiêu");
  });

  test("EMAIL_INCOME_REPORT calls correct endpoint", async () => {
    apiClient.get.mockResolvedValueOnce({});
    const message = await executeExportAction("EMAIL_INCOME_REPORT", t);
    expect(apiClient.get).toHaveBeenCalledWith("/email/income-excel");
    expect(message).toBe("Đã gửi email thu nhập");
  });

  test("EMAIL_EXPENSE_REPORT calls correct endpoint", async () => {
    apiClient.get.mockResolvedValueOnce({});
    const message = await executeExportAction("EMAIL_EXPENSE_REPORT", t);
    expect(apiClient.get).toHaveBeenCalledWith("/email/expense-excel");
    expect(message).toBe("Đã gửi email chi tiêu");
  });

  test("throws for unknown intent", async () => {
    await expect(executeExportAction("UNKNOWN_ACTION", t)).rejects.toThrow("Không xác định");
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  test("propagates API error", async () => {
    apiClient.get.mockRejectedValueOnce(new Error("Network error"));
    await expect(executeExportAction("EXPORT_EXCEL_INCOME", t)).rejects.toThrow("Network error");
  });
});
