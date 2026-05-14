import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { tokenStorage } from "../storage/tokenStorage";
import { signInWithGoogleNative, exchangeGoogleToken, signOutGoogle } from "../services/googleAuth";

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
    setGoogleAuthLoading(true);

    try {
      console.log("[AuthContext] Opening native Google Sign-In...");

      // Native Google Sign-In bottom sheet
      const googleResult = await signInWithGoogleNative();

      // User huỷ
      if (!googleResult) {
        console.log("[AuthContext] User cancelled Google Sign-In");
        return null;
      }

      const { idToken } = googleResult;

      console.log("[AuthContext] Got idToken, exchanging with backend...");
      const { token, user: profile } = await exchangeGoogleToken(idToken);

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
    } catch (error) {
      // User huỷ → không throw lỗi
      if (error?.message === "SIGN_IN_CANCELLED") {
        console.log("[AuthContext] User cancelled Google Sign-In");
        return null;
      }

      console.error("[AuthContext] Google Sign-In failed:", error?.message);
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    } finally {
      setGoogleAuthLoading(false);
    }
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    await tokenStorage.clearToken();
    await signOutGoogle();
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
    googleAuthLoading,
    signOut,
    refreshUser
  }), [
    isBootstrapping,
    refreshUser,
    signIn,
    signInWithGoogle,
    googleAuthLoading,

    signOut,
    user
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}