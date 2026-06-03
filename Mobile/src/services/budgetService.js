import { API_ENDPOINTS } from "../constants/api";
import http from "./http";

export async function fetchBudgets() {
  const response = await http.get(API_ENDPOINTS.GET_BUDGETS);
  return Array.isArray(response.data) ? response.data : [];
}

export async function saveBudget(payload) {
  return http.post(API_ENDPOINTS.SET_BUDGET, payload);
}

export async function deleteBudgetById(id) {
  return http.delete(API_ENDPOINTS.DELETE_BUDGET(id));
}
