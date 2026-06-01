import axios from "axios";
import { BASE_URL } from "./apiEndpoints.js";
import { redirectToExpiredSessionLogin } from "./authRedirect.js";
import { axiosShowLoading, axiosHideLoading } from "./axiosLoadingBridge.js";

const axiosConfig = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json;charset=UTF-8",
    Accept: "application/json"
  }
});

axiosConfig.interceptors.request.use(
  (config) => {
    if (config._skipGlobalLoading !== true) {
      axiosShowLoading(config._loadingMessage || null);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosConfig.interceptors.response.use(
  (response) => {
    if (response.config?._skipGlobalLoading !== true) {
      axiosHideLoading();
    }
    return response;
  },
  (error) => {
    if (error.config?._skipGlobalLoading !== true) {
      axiosHideLoading();
    }

    redirectToExpiredSessionLogin({
      status: error.response?.status,
    });

    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        error.message = error.response.data?.message || error.response.data?.error || "Bạn không có quyền truy cập hoặc thực hiện hành động này (403).";
      } else if (status === 401) {
        error.message = error.response.data?.message || error.response.data?.error || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại (401).";
      } else if (status === 404) {
        error.message = error.response.data?.message || error.response.data?.error || "Không tìm thấy tài nguyên yêu cầu (404).";
      } else if (status >= 500) {
        error.message = error.response.data?.message || error.response.data?.error || "Hệ thống gặp sự cố kỹ thuật. Vui lòng thử lại sau (500).";
      }
    } else if (error.request) {
      error.message = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.";
    }

    return Promise.reject(error);
  }
);

export default axiosConfig;
