import axios from "axios";
import { BASE_URL } from "./apiEndpoints.js";

const axiosConfig = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

const excludeEndpoints = ["/login", "/register", "/status", "/activate", "/health", "/forgot-password", "/reset-password", "/auth/google"];

axiosConfig.interceptors.request.use(
  (config) => {
    const shouldSkipToken = excludeEndpoints.some((endpoint) => config.url?.includes(endpoint));
    if (!shouldSkipToken) {
      const accessToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosConfig.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosConfig;
