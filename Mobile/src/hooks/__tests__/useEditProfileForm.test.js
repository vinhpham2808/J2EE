jest.mock("../../services/apiClient", () => ({ put: jest.fn() }));
jest.mock("../../constants/api", () => ({ API_ENDPOINTS: { UPDATE_PROFILE: "/profile/update" } }));
jest.mock("../../storage/tokenStorage", () => ({ tokenStorage: { setToken: jest.fn() } }));
jest.mock("../../utils/profileImage", () => ({ default: jest.fn(), uploadProfileImage: jest.fn() }));
jest.mock("../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.message || f }));
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

jest.mock("../../contexts/AuthContext", () => {
  const ReactMock = require("react");
  const MockContext = ReactMock.createContext({ user: null, refreshUser: jest.fn() });
  return {
    AuthContext: MockContext,
    __esModule: true,
  };
});

import { AuthContext } from "../../contexts/AuthContext";
import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import React from "react";
import useEditProfileForm from "../useEditProfileForm";

function createWrapper(user) {
  const refreshUser = jest.fn().mockResolvedValue(user);
  return ({ children }) => (
    <AuthContext.Provider value={{ user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

describe("useEditProfileForm", () => {
  const apiClient = require("../../services/apiClient");
  const ImagePicker = require("expo-image-picker");
  const { tokenStorage } = require("../../storage/tokenStorage");
  const { uploadProfileImage } = require("../../utils/profileImage");

  beforeEach(() => { jest.clearAllMocks(); });

  const mockUser = { fullName: "John Doe", email: "john@example.com", profileImageUrl: "http://example.com/avatar.jpg" };

  test("returns initial state from user context", () => {
    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });
    expect(result.current.fullName).toBe("John Doe");
    expect(result.current.email).toBe("john@example.com");
    expect(result.current.previewUri).toBe("http://example.com/avatar.jpg");
    expect(result.current.saving).toBe(false);
    expect(result.current.showPasswordFields).toBe(false);
  });

  test("onPickImage requests permission and sets photo", async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: true });
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: "file://photo.jpg" }] });

    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });
    await act(async () => { await result.current.onPickImage(); });

    expect(result.current.previewUri).toBe("file://photo.jpg");
  });

  test("onPickImage shows alert if permission denied", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false });

    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });
    await act(async () => { await result.current.onPickImage(); });

    expect(alertSpy).toHaveBeenCalledWith("editProfile.permissionTitle", "editProfile.permissionMsg");
  });

  test("onRemoveImage clears photo", () => {
    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });
    act(() => { result.current.onRemoveImage(); });
    expect(result.current.previewUri).toBe("");
  });

  test("validates missing name on save", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const user = { ...mockUser, fullName: "" };
    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(user) });

    act(() => { result.current.onSave(); });
    expect(alertSpy).toHaveBeenCalledWith("editProfile.missingInfoTitle", "editProfile.missingName");
  });

  test("validates invalid email on save", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });

    act(() => { result.current.setEmail("invalid-email"); });
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("editProfile.invalidEmailTitle", "editProfile.invalidEmailMsg");
  });

  test("validates password fields when shown", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });

    act(() => { result.current.setShowPasswordFields(true); });
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("editProfile.missingInfoTitle", "editProfile.missingCurrentPw");
  });

  test("validates new password length", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });

    act(() => {
      result.current.setShowPasswordFields(true);
      result.current.setCurrentPassword("oldpass");
      result.current.setNewPassword("ab");
    });
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("editProfile.invalidNewPwTitle", "editProfile.invalidNewPwMsg");
  });

  test("validates password mismatch", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });

    act(() => {
      result.current.setShowPasswordFields(true);
      result.current.setCurrentPassword("oldpass");
      result.current.setNewPassword("newpass123");
      result.current.setConfirmPassword("different");
    });
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("editProfile.pwMismatchTitle", "editProfile.pwMismatchMsg");
  });

  test("onSave updates profile successfully", async () => {
    apiClient.put.mockResolvedValueOnce({ data: { token: "new-token" } });
    uploadProfileImage.mockResolvedValueOnce("http://example.com/new-avatar.jpg");

    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });

    act(() => {
      result.current.setFullName("John Updated");
      result.current.setEmail("updated@example.com");
    });

    await act(async () => { await result.current.onSave(); });

    expect(apiClient.put).toHaveBeenCalledWith("/profile/update", expect.objectContaining({
      fullName: "John Updated",
      email: "updated@example.com",
      profileImageUrl: "http://example.com/avatar.jpg",
    }));
    expect(tokenStorage.setToken).toHaveBeenCalledWith("new-token");
  });

  test("onSave handles API error", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    apiClient.put.mockRejectedValueOnce(new Error("Update failed"));

    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });
    await act(async () => { await result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("editProfile.updateFailTitle", "Update failed");
  });

  test("onSave with password change includes passwords", async () => {
    apiClient.put.mockResolvedValueOnce({ data: { token: "new-token" } });

    const { result } = renderHook(() => useEditProfileForm(), { wrapper: createWrapper(mockUser) });

    act(() => {
      result.current.setShowPasswordFields(true);
      result.current.setCurrentPassword("oldpass");
      result.current.setNewPassword("newpass123");
      result.current.setConfirmPassword("newpass123");
    });

    await act(async () => { await result.current.onSave(); });

    expect(apiClient.put).toHaveBeenCalledWith("/profile/update", expect.objectContaining({
      currentPassword: "oldpass",
      newPassword: "newpass123",
    }));
  });
});
