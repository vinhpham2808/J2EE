import { API_ENDPOINTS } from "../constants/api";
import http from "./http";

export async function fetchJars() {
  const response = await http.get(API_ENDPOINTS.GET_JARS);
  return Array.isArray(response.data) ? response.data : [];
}
