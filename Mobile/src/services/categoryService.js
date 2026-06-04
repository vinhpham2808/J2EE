import { API_ENDPOINTS } from "../constants/api";
import apiClient from "./apiClient";

const normalizeCategoryType = (type) => {
  const normalized = String(type || "").trim().toLowerCase();
  return normalized === "income" ? "income" : "expense";
};

export const fetchCategoriesByType = async (type) => {
  const response = await apiClient.get(API_ENDPOINTS.CATEGORY_BY_TYPE(normalizeCategoryType(type)));
  return Array.isArray(response.data) ? response.data : [];
};

export const fetchCategories = async () => {
  const response = await apiClient.get(API_ENDPOINTS.GET_ALL_CATEGORIES);
  return Array.isArray(response.data) ? response.data : [];
};

export const createCategory = async (payload) => {
  const response = await apiClient.post(API_ENDPOINTS.ADD_CATEGORY, payload);
  return response.data;
};

export const updateCategory = async (categoryId, payload) => {
  const response = await apiClient.put(API_ENDPOINTS.UPDATE_CATEGORY(categoryId), payload);
  return response.data;
};

export const deleteCategory = async (categoryId) => {
  const response = await apiClient.delete(API_ENDPOINTS.DELETE_CATEGORY(categoryId));
  return response.data;
};
