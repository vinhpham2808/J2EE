import { API_ENDPOINTS } from "../constants/api";
import http from "./http";

const normalizeCategoryType = (type) => {
  const normalized = String(type || "").trim().toLowerCase();
  return normalized === "income" ? "income" : "expense";
};

export const fetchCategoriesByType = async (type) => {
  const response = await http.get(API_ENDPOINTS.CATEGORY_BY_TYPE(normalizeCategoryType(type)));
  return Array.isArray(response.data) ? response.data : [];
};

export const fetchCategories = async () => {
  const response = await http.get(API_ENDPOINTS.GET_ALL_CATEGORIES);
  return Array.isArray(response.data) ? response.data : [];
};
