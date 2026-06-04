import { API_ENDPOINTS } from "../constants/api";
import apiClient from "../services/apiClient";
import { getApiErrorMessage } from "./format";
import { getRetryAfterSeconds } from "./authOtp";

export function isActivationRequiredError(error) {
  if (error?.response?.data?.needsActivation) {
    return true;
  }

  const message = getApiErrorMessage(error, "").toLowerCase();
  return (
    message.includes("chưa được kích hoạt") ||
    message.includes("kich hoat") ||
    message.includes("xác thực otp") ||
    message.includes("xac thuc otp")
  );
}

export function getActivationEmail(error, fallbackEmail = "") {
  return error?.response?.data?.email || fallbackEmail;
}

export async function openActivationOtp(navigation, email) {
  const params = { email };

  try {
    await apiClient.post(API_ENDPOINTS.RESEND_OTP, { email });
  } catch (error) {
    const retryAfterSeconds = getRetryAfterSeconds(error);
    if (retryAfterSeconds > 0) {
      params.initialCountdown = retryAfterSeconds;
    } else {
      throw error;
    }
  }

  navigation.navigate("VerifyOtp", params);
}
