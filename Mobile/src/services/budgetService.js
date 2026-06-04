import { API_ENDPOINTS } from "../constants/api";
import apiClient from "./apiClient";

export async function fetchBudgets() {
  const response = await apiClient.get(API_ENDPOINTS.GET_BUDGETS);
  return Array.isArray(response.data) ? response.data : [];
}

export async function saveBudget(payload) {
  return apiClient.post(API_ENDPOINTS.SET_BUDGET, payload);
}

export async function deleteBudgetById(id) {
  return apiClient.delete(API_ENDPOINTS.DELETE_BUDGET(id));
}
