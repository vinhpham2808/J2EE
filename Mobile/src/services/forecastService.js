import http from "./http";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Lấy dự báo chi tiêu theo tháng
 * @returns {Promise<{year, month, categories: Array}>}
 */
export const fetchMonthlyForecast = async (year, month) => {
  const response = await http.get(API_ENDPOINTS.FORECAST_MONTHLY(year, month));
  return response.data;
};

/**
 * Lấy danh sách giao dịch bất thường (tối đa 5)
 * @returns {Promise<Array<{transactionId, type, amount, categoryName, date, meanAmount, stdDev}>>}
 */
export const fetchAnomalies = async () => {
  const response = await http.get(API_ENDPOINTS.FORECAST_ANOMALIES);
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * Lấy dữ liệu xu hướng theo danh mục
 * @returns {Promise<{categoryName, dataPoints: Array}>}
 */
export const fetchCategoryTrend = async (categoryId, months = 6) => {
  const response = await http.get(
    API_ENDPOINTS.FORECAST_CATEGORY_TREND(categoryId, months)
  );
  return response.data;
};

/**
 * Lấy phân tích AI từ dữ liệu dự báo
 * @param {Object} forecastData - Dữ liệu MonthlyForecastDTO
 * @returns {Promise<{narrative, generatedAt}>}
 */
export const fetchInsights = async (forecastData) => {
  const response = await http.post(API_ENDPOINTS.FORECAST_INSIGHTS, forecastData);
  return response.data;
};
