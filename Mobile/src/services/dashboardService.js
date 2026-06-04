import { API_ENDPOINTS } from "../constants/api";
import { buildMonthlyFinanceSeries } from "../utils/financeStats";
import apiClient from "./apiClient";

export async function fetchDashboardData() {
  const response = await apiClient.get(API_ENDPOINTS.DASHBOARD_DATA);
  return response.data || null;
}

export async function fetchUnreadNotificationCount() {
  try {
    const response = await apiClient.get(API_ENDPOINTS.GET_UNREAD_COUNT);
    return Number(response.data?.unreadCount || 0);
  } catch {
    return 0;
  }
}

export async function fetchDashboardGoals() {
  try {
    const response = await apiClient.get(API_ENDPOINTS.GET_GOALS);
    const goals = Array.isArray(response.data) ? response.data : [];
    return goals
      .filter((goal) => String(goal?.status || "ACTIVE").toUpperCase() === "ACTIVE")
      .slice(0, 3);
  } catch {
    return [];
  }
}

export async function fetchDashboardMonthlySeries() {
  const [incomeRes, expenseRes] = await Promise.all([
    apiClient.get(API_ENDPOINTS.GET_ALL_INCOMES, { params: { all: true } }),
    apiClient.get(API_ENDPOINTS.GET_ALL_EXPENSE)
  ]);

  const incomes = Array.isArray(incomeRes.data) ? incomeRes.data : [];
  const expenses = Array.isArray(expenseRes.data) ? expenseRes.data : [];
  return buildMonthlyFinanceSeries({ incomes, expenses, monthsBack: 6 });
}
