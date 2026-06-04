import apiClient from "../../services/apiClient";
import { API_ENDPOINTS } from "../../constants/api";

const ACTION_CONFIG = {
  EXPORT_EXCEL_INCOME: {
    endpoint: API_ENDPOINTS.INCOME_EXCEL_DOWNLOAD,
    message: "📥 Đã chuẩn bị báo cáo Excel thu nhập tháng này!"
  },
  EXPORT_EXCEL_EXPENSE: {
    endpoint: API_ENDPOINTS.EXPENSE_EXCEL_DOWNLOAD,
    message: "📥 Đã chuẩn bị báo cáo Excel chi tiêu tháng này!"
  },
  EMAIL_INCOME_REPORT: {
    endpoint: API_ENDPOINTS.EMAIL_INCOME,
    message: "📧 Đã gửi báo cáo thu nhập tháng này đến email của bạn!"
  },
  EMAIL_EXPENSE_REPORT: {
    endpoint: API_ENDPOINTS.EMAIL_EXPENSE,
    message: "📧 Đã gửi báo cáo chi tiêu tháng này đến email của bạn!"
  }
};

export async function executeExportAction(intent) {
  const config = ACTION_CONFIG[intent];
  if (!config) {
    throw new Error("Không xác định được hành động.");
  }

  await apiClient.get(config.endpoint);
  return config.message;
}
