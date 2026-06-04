import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Fetch monthly report for the current authenticated user (current month)
 * @returns {Promise<{success: boolean, data: object}>}
 */
export const fetchCurrentMonthReport = async () => {
  const response = await apiClient.get(API_ENDPOINTS.MONTHLY_REPORT);
  return response.data;
};

/**
 * Fetch monthly report for a specific month and year
 * @param {number} year 
 * @param {number} month 
 * @returns {Promise<{success: boolean, data: object}>}
 */
export const fetchReportByMonth = async (year, month) => {
  const response = await apiClient.get(API_ENDPOINTS.MONTHLY_REPORT_BY_MONTH(year, month));
  return response.data;
};
