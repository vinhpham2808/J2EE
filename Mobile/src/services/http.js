import axios from "axios";
import { BASE_URL } from "../constants/api";
import { tokenStorage } from "../storage/tokenStorage";

const publicEndpoints = [
  "/login",
  "/register",
  "/activate",
  "/verify-activation",
  "/verify-otp",
  "/otp/resend",
  "/resend-otp",
  "/forgot-password",
  "/verify-reset-otp",
  "/reset-password",
  "/auth/google",
  "/health"
];

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Platform": "mobile"
  }
});

http.interceptors.request.use(async (config) => {
  const shouldSkipToken = publicEndpoints.some((endpoint) => config.url?.includes(endpoint));
  if (shouldSkipToken) {
    return config;
  }

  const token = await tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default http;
