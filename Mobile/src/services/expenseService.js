import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/api";
import { downloadAndShareFile } from "../utils/downloadFile";

const ALL_EXPENSE_FILTER = "all";

export async function fetchExpensesByFilter(filterType) {
  const params = {};
  if (filterType === ALL_EXPENSE_FILTER) {
    params.all = true;
  }

  const response = await apiClient.get(API_ENDPOINTS.GET_ALL_EXPENSE, { params });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createExpense(payload) {
  return apiClient.post(API_ENDPOINTS.ADD_EXPENSE, payload);
}

export async function deleteExpenseById(id) {
  return apiClient.delete(API_ENDPOINTS.DELETE_EXPENSE(id));
}

export async function parseExpenseVoice(text) {
  const response = await apiClient.post(API_ENDPOINTS.VOICE_PARSE, { text });
  return response.data;
}

export async function exportExpenseReport(filterType) {
  const now = new Date();
  const isAllReport = filterType === ALL_EXPENSE_FILTER;
  const payload = isAllReport
    ? { all: true, month: now.getMonth() + 1, year: now.getFullYear() }
    : { month: now.getMonth() + 1, year: now.getFullYear() };

  const response = await apiClient.post(API_ENDPOINTS.EXPORT_EXPENSE, payload);
  if (!response.data?.presignedUrl) {
    throw new Error("Không lấy được link tải file");
  }

  const fileName = isAllReport
    ? "expense_report_all_months.xlsx"
    : `expense_report_${payload.month}_${payload.year}.xlsx`;

  await downloadAndShareFile(response.data.presignedUrl, fileName);
}
