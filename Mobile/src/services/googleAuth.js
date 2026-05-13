import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import http from "./http";
import { API_ENDPOINTS } from "../constants/api";

// Cấu hình Google Sign-In từ biến môi trường
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/**
 * Cấu hình GoogleSignin một lần khi app khởi động.
 * Universal Sign In (v16+) chỉ cần webClientId.
 * Gọi hàm này ở App.js startup.
 */
export function configureGoogleSignin() {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
  });
}

/**
 * Native Google Sign-In.
 *
 * Sử dụng @react-native-google-signin/google-signin để mở bottom sheet
 * đăng nhập Google thay vì browser redirect.
 *
 * Returns:
 *   { idToken, user: { email, name, photo, ... } }
 *
 * Throws:
 *   - Error("SIGN_IN_CANCELLED") nếu user huỷ
 *   - Error(errorMessage) nếu thất bại khác
 */
export async function signInWithGoogleNative() {
  try {
    // Kiểm tra Google Play Services (Android)
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    // Đăng nhập
    const response = await GoogleSignin.signIn();

    // response.data chứa idToken, user info, ...
    const data = response.data || response;
    const idToken = data.idToken;

    if (!idToken) {
      throw new Error("Không nhận được idToken từ Google");
    }

    // Lấy thông tin user
    const currentUser = await GoogleSignin.getCurrentUser();
    const userInfo = currentUser?.data?.user || currentUser?.user || data?.user || {};

    console.log("[googleAuth] Native sign-in success:", userInfo.email);

    return { idToken, user: userInfo };
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log("[googleAuth] User cancelled sign-in");
      throw new Error("SIGN_IN_CANCELLED");
    }

    if (error.code === statusCodes.IN_PROGRESS) {
      console.log("[googleAuth] Sign-in already in progress");
      throw new Error("Google đăng nhập đang được xử lý. Vui lòng đợi.");
    }

    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.warn("[googleAuth] Play Services not available");
      throw new Error("Google Play Services không khả dụng trên thiết bị này.");
    }

    console.error("[googleAuth] Native sign-in error:", error?.message || error);
    throw error;
  }
}

/**
 * Đăng xuất khỏi Google (gọi khi user sign out khỏi app).
 */
export async function signOutGoogle() {
  try {
    await GoogleSignin.signOut();
    console.log("[googleAuth] Signed out from Google");
  } catch (error) {
    console.warn("[googleAuth] Sign-out error:", error?.message);
  }
}

/**
 * Gửi idToken nhận được từ Google lên backend để đăng nhập/tạo tài khoản.
 *
 * @param {string} idToken - Google ID Token
 * @returns {Promise<{token: string, user: object}>}
 */
export async function exchangeGoogleToken(idToken) {
  const res = await http.post(API_ENDPOINTS.GOOGLE_AUTH, { idToken });
  return res.data;
}
