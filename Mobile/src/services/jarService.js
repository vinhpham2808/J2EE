import { API_ENDPOINTS } from "../constants/api";
import apiClient from "./apiClient";

export async function fetchJars() {
  const response = await apiClient.get(API_ENDPOINTS.GET_JARS);
  return Array.isArray(response.data) ? response.data : [];
}
