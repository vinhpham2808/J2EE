jest.mock("../../services/apiClient", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../constants/api", () => ({ API_ENDPOINTS: { LOGIN: "/auth/login", GET_USER_INFO: "/profile/me" } }));
jest.mock("../../storage/tokenStorage", () => ({ tokenStorage: { getToken: jest.fn(), setToken: jest.fn(), clearToken: jest.fn() } }));
jest.mock("../../services/authGoogleService", () => ({ signInWithGoogleNative: jest.fn(), exchangeGoogleToken: jest.fn(), signOutGoogle: jest.fn() }));

import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { AuthProvider, AuthContext } from "../AuthContext";

describe("AuthContext", () => {
  const apiClient = require("../../services/apiClient");
  const { tokenStorage } = require("../../storage/tokenStorage");
  const { signInWithGoogleNative, exchangeGoogleToken, signOutGoogle } = require("../../services/authGoogleService");

  beforeEach(() => { jest.clearAllMocks(); });

  test("provides default values", () => {
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });

    expect(result.current.user).toBeNull();
    expect(result.current.isBootstrapping).toBe(true);
    expect(result.current.googleAuthLoading).toBe(false);
  });

  test("bootstraps with existing token", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    tokenStorage.getToken.mockResolvedValueOnce("valid-token");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(tokenStorage.getToken).toHaveBeenCalled();
    expect(apiClient.get).toHaveBeenCalledWith("/profile/me");
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isBootstrapping).toBe(false);
  });

  test("bootstraps without token sets user null", async () => {
    tokenStorage.getToken.mockResolvedValueOnce(null);

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(result.current.user).toBeNull();
    expect(result.current.isBootstrapping).toBe(false);
  });

  test("bootstraps clears token on error", async () => {
    tokenStorage.getToken.mockResolvedValueOnce("invalid-token");
    apiClient.get.mockRejectedValueOnce(new Error("Unauthorized"));

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(tokenStorage.clearToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isBootstrapping).toBe(false);
  });

  test("signIn with email/password returns user", async () => {
    tokenStorage.getToken.mockResolvedValueOnce(null);
    apiClient.post.mockResolvedValueOnce({ data: { token: "new-token", user: { id: 1, email: "test@example.com" } } });

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    let user;
    await act(async () => { user = await result.current.signIn({ email: "test@example.com", password: "pass123" }); });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/login", { email: "test@example.com", password: "pass123" });
    expect(tokenStorage.setToken).toHaveBeenCalledWith("new-token", { remember: false });
    expect(result.current.user).toEqual({ id: 1, email: "test@example.com" });
    expect(user).toEqual({ id: 1, email: "test@example.com" });
  });

  test("signIn throws without token", async () => {
    tokenStorage.getToken.mockResolvedValueOnce(null);
    apiClient.post.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    await expect(async () => {
      await act(async () => { await result.current.signIn({ email: "test@example.com", password: "pass123" }); });
    }).rejects.toThrow("Không nhận được token từ máy chủ");
  });

  test("signIn with remember me", async () => {
    tokenStorage.getToken.mockResolvedValueOnce(null);
    apiClient.post.mockResolvedValueOnce({ data: { token: "new-token", user: { id: 1 } } });

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    await act(async () => { await result.current.signIn({ email: "test@example.com", password: "pass123", rememberMe: true }); });

    expect(tokenStorage.setToken).toHaveBeenCalledWith("new-token", { remember: true });
  });

  test("signOut clears token and user", async () => {
    tokenStorage.getToken.mockResolvedValueOnce(null);
    signOutGoogle.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    await act(async () => { await result.current.signOut(); });

    expect(tokenStorage.clearToken).toHaveBeenCalled();
    expect(signOutGoogle).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  test("signInWithGoogle returns user on success", async () => {
    tokenStorage.getToken.mockResolvedValueOnce(null);
    signInWithGoogleNative.mockResolvedValueOnce({ idToken: "google-token" });
    exchangeGoogleToken.mockResolvedValueOnce({ token: "backend-token", user: { id: 2, email: "google@example.com" } });

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    let user;
    await act(async () => { user = await result.current.signInWithGoogle(); });

    expect(exchangeGoogleToken).toHaveBeenCalledWith("google-token");
    expect(tokenStorage.setToken).toHaveBeenCalledWith("backend-token", { remember: true });
    expect(result.current.user).toEqual({ id: 2, email: "google@example.com" });
  });

  test("signInWithGoogle handles cancellation", async () => {
    tokenStorage.getToken.mockResolvedValueOnce(null);
    signInWithGoogleNative.mockResolvedValueOnce(null);

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    const user = await act(async () => result.current.signInWithGoogle());
    expect(user).toBeNull();
    expect(exchangeGoogleToken).not.toHaveBeenCalled();
  });

  test("signInWithGoogle handles SIGN_IN_CANCELLED error", async () => {
    tokenStorage.getToken.mockResolvedValueOnce(null);
    signInWithGoogleNative.mockRejectedValueOnce(new Error("SIGN_IN_CANCELLED"));

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    const user = await act(async () => result.current.signInWithGoogle());
    expect(user).toBeNull();
  });

  test("signInWithGoogle handles backend error response", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    tokenStorage.getToken.mockResolvedValueOnce(null);
    signInWithGoogleNative.mockResolvedValueOnce({ idToken: "google-token" });
    exchangeGoogleToken.mockRejectedValueOnce({ response: { data: { message: "Backend error" } } });

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    await expect(async () => {
      await act(async () => { await result.current.signInWithGoogle(); });
    }).rejects.toThrow("Backend error");
    consoleErrorSpy.mockRestore();
  });

  test("refreshUser fetches and sets user", async () => {
    tokenStorage.getToken.mockResolvedValueOnce(null);
    const mockUser = { id: 1, email: "refreshed@example.com" };
    apiClient.get.mockResolvedValueOnce({ data: mockUser });

    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: AuthProvider });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    let data;
    await act(async () => { data = await result.current.refreshUser(); });

    expect(apiClient.get).toHaveBeenCalledWith("/profile/me");
    expect(result.current.user).toEqual(mockUser);
    expect(data).toEqual(mockUser);
  });
});
