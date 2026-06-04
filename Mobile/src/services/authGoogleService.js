import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes
} from "@react-native-google-signin/google-signin";
import { API_ENDPOINTS } from "../constants/api";
import apiClient from "./apiClient";

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let isConfigured = false;

function createGoogleAuthError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function requireWebClientId() {
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw createGoogleAuthError(
      "Google Web Client ID chưa được cấu hình. Vui lòng thêm EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID vào Mobile/.env.",
      "GOOGLE_WEB_CLIENT_ID_MISSING"
    );
  }
}

export function configureGoogleSignin() {
  const config = {
    offlineAccess: false,
    scopes: ["email", "profile"],
    profileImageSize: 120
  };

  if (GOOGLE_WEB_CLIENT_ID) {
    config.webClientId = GOOGLE_WEB_CLIENT_ID;
  }

  if (GOOGLE_IOS_CLIENT_ID) {
    config.iosClientId = GOOGLE_IOS_CLIENT_ID;
  }

  GoogleSignin.configure(config);
  isConfigured = true;
}

function ensureConfigured() {
  if (!isConfigured) {
    configureGoogleSignin();
  }
}

async function getIdTokenFromResponse(googleUser) {
  if (googleUser?.idToken) {
    return googleUser.idToken;
  }

  const tokens = await GoogleSignin.getTokens();
  return tokens?.idToken || null;
}

export async function signInWithGoogleNative() {
  ensureConfigured();
  requireWebClientId();

  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true
    });

    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) {
      return null;
    }

    if (!isSuccessResponse(response)) {
      return null;
    }

    const googleUser = response.data;
    const idToken = await getIdTokenFromResponse(googleUser);

    if (!idToken) {
      throw createGoogleAuthError(
        "Không nhận được idToken từ Google. Hãy kiểm tra Google Web Client ID đang dùng trong app.",
        "GOOGLE_ID_TOKEN_MISSING"
      );
    }

    return {
      ...googleUser,
      idToken
    };
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return null;
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        throw createGoogleAuthError(
          "Google đăng nhập đang được xử lý. Vui lòng đợi trong giây lát.",
          error.code
        );
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw createGoogleAuthError(
          "Google Play Services không khả dụng hoặc cần được cập nhật trên thiết bị này.",
          error.code
        );
      }
    }

    throw error;
  }
}

export async function exchangeGoogleToken(idToken) {
  if (!idToken) {
    throw createGoogleAuthError(
      "Không thể đăng nhập bằng Google vì thiếu idToken.",
      "GOOGLE_ID_TOKEN_MISSING"
    );
  }

  const response = await apiClient.post(API_ENDPOINTS.GOOGLE_AUTH, { idToken });
  return response.data || {};
}

export async function signOutGoogle() {
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch (error) {
    console.warn("[googleAuth] Google sign-out skipped:", error?.message || error);
  }
}
