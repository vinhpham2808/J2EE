import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { tokenStorage } from "../storage/tokenStorage";
import { useGoogleAuth, exchangeGoogleToken } from "../services/googleAuth";

export const AuthContext = createContext({
  user: null,
  isBootstrapping: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  googleAuthLoading: false,
  signOut: async () => {},
  refreshUser: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  // Hook Google Auth (phải nằm trong component React)
  const [, googlePromptAsync, googleRequestLoading, googleError] = useGoogleAuth();

  const refreshUser = useCallback(async () => {
    const response = await http.get(API_ENDPOINTS.GET_USER_INFO);
    setUser(response.data || null);
    return response.data;
  }, []);

  const signIn = useCallback(async ({ email, password, rememberMe = false }) => {
    const response = await http.post(API_ENDPOINTS.LOGIN, { email, password });
    const { token, user: profile } = response.data || {};

    if (!token) {
      throw new Error("Không nhận được token từ máy chủ");
    }

    await tokenStorage.setToken(token, { remember: rememberMe });

    if (profile) {
      setUser(profile);
      return profile;
    }

    return refreshUser();
  }, [refreshUser]);

  const signInWithGoogle = useCallback(async () => {
    if (!googlePromptAsync) {
      throw new Error("Google Sign-In chưa sẵn sàng. Vui lòng thử lại.");
    }

    setGoogleAuthLoading(true);

    try {
      console.log("[AuthContext] Opening Google Sign-In...");
      // Mở browser để user đăng nhập Google
      const result = await googlePromptAsync();

      console.log("[AuthContext] Google auth result:", {
        type: result?.type,
        hasIdToken: !!result?.params?.id_token,
        error: result?.params?.error_description,
      });

      if (result?.type === "success") {
        const { id_token } = result.params;

        if (!id_token) {
          throw new Error("Không nhận được idToken từ Google");
        }

        // Gửi idToken lên backend
        console.log("[AuthContext] Exchanging idToken with backend...");
        const { token, user: profile } = await exchangeGoogleToken(id_token);

        if (!token) {
          throw new Error("Backend không trả về token xác thực.");
        }

        // Lưu token
        console.log("[AuthContext] Saving token, user:", profile?.email);
        await tokenStorage.setToken(token, { remember: true });

        if (profile) {
          setUser(profile);
          console.log("[AuthContext] User set, navigating to main app...");
          return profile;
        }

        return refreshUser();
      }

      if (result?.type === "error") {
        const msg = result?.params?.error_description || "Google đăng nhập thất bại";
        console.warn("[AuthContext] Google auth error:", msg);
        throw new Error(msg);
      }

      // type === "dismiss" / "cancel" → user huỷ, không throw lỗi
      console.log("[AuthContext] User dismissed Google Sign-In");
      return null;
    } catch (error) {
      console.error("[AuthContext] Google Sign-In failed:", error?.message);
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    } finally {
      setGoogleAuthLoading(false);
    }
  }, [googlePromptAsync, refreshUser]);

  const signOut = useCallback(async () => {
    await tokenStorage.clearToken();
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const token = await tokenStorage.getToken();
        if (!token) {
          if (active) {
            setUser(null);
          }
          return;
        }

        await refreshUser();
      } catch {
        await tokenStorage.clearToken();
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  const value = useMemo(() => ({
    user,
    isBootstrapping,
    signIn,
    signInWithGoogle,
    googleAuthLoading: googleAuthLoading || googleRequestLoading,
    signOut,
    refreshUser
  }), [
    isBootstrapping,
    refreshUser,
    signIn,
    signInWithGoogle,
    googleAuthLoading,
    googleRequestLoading,
    signOut,
    user
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}