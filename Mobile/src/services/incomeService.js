import { API_ENDPOINTS } from "../constants/api";
import { downloadAndShareFile } from "../utils/downloadFile";
import apiClient from "./apiClient";

export async function fetchIncomesByFilter(filterType) {
  const params = {};
  if (filterType === "all") {
    params.all = true;
  }

  const response = await apiClient.get(API_ENDPOINTS.GET_ALL_INCOMES, { params });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createIncome(payload) {
  return apiClient.post(API_ENDPOINTS.ADD_INCOME, payload);
}

export async function deleteIncomeById(id) {
  return apiClient.delete(API_ENDPOINTS.DELETE_INCOME(id));
}

export async function parseIncomeVoice(text) {
  const response = await apiClient.post(API_ENDPOINTS.VOICE_PARSE, { text });
  return response.data;
}

export async function exportIncomeReport(filterType) {
  const now = new Date();
  const isAllReport = filterType === "all";
  const payload = isAllReport
    ? { all: true, month: now.getMonth() + 1, year: now.getFullYear() }
    : { month: now.getMonth() + 1, year: now.getFullYear() };

  const response = await apiClient.post(API_ENDPOINTS.EXPORT_INCOME, payload);
  if (!response.data?.presignedUrl) {
    throw new Error("Không lấy được link tải file");
  }

  const fileName = isAllReport
    ? "income_report_all_months.xlsx"
    : `income_report_${payload.month}_${payload.year}.xlsx`;

  await downloadAndShareFile(response.data.presignedUrl, fileName);
}
