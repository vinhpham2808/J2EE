import { useEffect, useRef, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import http from "./http";
import { API_ENDPOINTS } from "../constants/api";

// Đóng browser nếu session đang mở khi app mount lại
WebBrowser.maybeCompleteAuthSession();

// Cấu hình Google OAuth từ biến môi trường
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/**
 * Hook đăng nhập Google dùng expo-auth-session.
 *
 * expo-auth-session tự động sinh redirectUri phù hợp với nền tảng:
 * - Android dev build: moneymanager://...
 * - iOS dev build:    moneymanager://...
 * - Expo Go:          exp://...  (qua proxy auth.expo.io)
 *
 * ⚠️ QUAN TRỌNG: Redirect URI này PHẢI được thêm vào Google Cloud Console:
 *    https://console.cloud.google.com/apis/credentials
 *    → Chọn Web Client ID → Authorized redirect URIs
 *    → Thêm URI được log ra ở dòng "[googleAuth] request.redirectUri"
 *
 * Returns:
 *   [request, promptAsync, isLoading, error]
 */
export function useGoogleAuth() {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID || ANDROID_CLIENT_ID,
    selectAccount: true, // Luôn cho user chọn tài khoản Google
    // Google Cloud Console đối với Web Client ID không hỗ trợ custom scheme.
    // Nên chúng ta dùng redirect proxy của expo hoặc scheme mặc định.
    // Trong trường hợp này, expo sẽ tạo redirect URI "com.money.manager.mobile:/oauthredirect"
  });

  // Trích xuất lỗi từ response nếu có
  const [error, setError] = useState(null);

  useEffect(() => {
    if (response?.type === "error") {
      const errorMsg =
        response?.params?.error_description ||
        response?.error?.message ||
        "Google đăng nhập thất bại";
      if (isMounted.current) {
        setError(errorMsg);
      }
    } else if (response?.type === "success" || response?.type === "dismiss") {
      if (isMounted.current) {
        setError(null);
      }
    }
  }, [response]);

  // Loading: request chưa sẵn sàng (đang khởi tạo Google OAuth)
  const isLoading = !request;

  return [request, promptAsync, isLoading, error];
}

/**
 * Gửi idToken nhận được từ Google lên backend để đăng nhập/tạo tài khoản.
 *
 * @param {string} idToken - Google ID Token từ useGoogleAuth
 * @returns {Promise<{token: string, user: object}>}
 */
export async function exchangeGoogleToken(idToken) {
  const res = await http.post(API_ENDPOINTS.GOOGLE_AUTH, { idToken });
  return res.data;
}
