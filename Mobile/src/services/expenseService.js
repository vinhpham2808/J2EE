import http from "./http";
import { API_ENDPOINTS } from "../constants/api";
import { EXPENSE_FILTER_TYPES } from "../constants/expenseConfig";
import { downloadAndShareFile } from "../utils/fileDownload";

export async function fetchExpensesByFilter(filterType) {
  const params = {};
  if (filterType === EXPENSE_FILTER_TYPES.all) {
    params.all = true;
  }

  const response = await http.get(API_ENDPOINTS.GET_ALL_EXPENSE, { params });
  return Array.isArray(response.data) ? response.data : [];
}

export async function deleteExpenseById(id) {
  return http.delete(API_ENDPOINTS.DELETE_EXPENSE(id));
}

export async function parseExpenseVoice(text) {
  const response = await http.post(API_ENDPOINTS.VOICE_PARSE, { text });
  return response.data;
}

export async function exportExpenseReport(filterType) {
  const now = new Date();
  const isAllReport = filterType === EXPENSE_FILTER_TYPES.all;
  const payload = isAllReport
    ? { all: true, month: now.getMonth() + 1, year: now.getFullYear() }
    : { month: now.getMonth() + 1, year: now.getFullYear() };

  const response = await http.post(API_ENDPOINTS.EXPORT_EXPENSE, payload);
  if (!response.data?.presignedUrl) {
    throw new Error("Không lấy được link tải file");
  }

  const fileName = isAllReport
    ? "expense_report_all_months.xlsx"
    : `expense_report_${payload.month}_${payload.year}.xlsx`;

  await downloadAndShareFile(response.data.presignedUrl, fileName);
}
