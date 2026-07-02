import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../services/apiClient";
import { API_ENDPOINTS } from "../constants/api";
import { tokenStorage } from "../storage/tokenStorage";
import { signOutGoogle } from "../services/authGoogleService";

export const AuthContext = createContext({
  user: null,
  isBootstrapping: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshUser: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const refreshUser = useCallback(async () => {
    const response = await apiClient.get(API_ENDPOINTS.GET_USER_INFO);
    setUser(response.data || null);
    return response.data;
  }, []);

  const signIn = useCallback(async ({ email, password, rememberMe = false }) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, { email, password });
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
    signOut,
    refreshUser
  }), [
    isBootstrapping,
    refreshUser,
    signIn,
    signOut,
    user
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
