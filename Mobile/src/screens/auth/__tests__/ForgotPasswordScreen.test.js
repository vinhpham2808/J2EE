jest.mock("../../../components/ui/AppButton", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ title, onPress, disabled, testID, style, loading }) =>
    React.createElement(
      TouchableOpacity,
      { onPress, disabled: disabled || loading, testID, style },
      loading ? React.createElement(Text, null, "loading...") : React.createElement(Text, null, title)
    );
});

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "auth.forgotPassword.title": "Quên mật khẩu",
      "auth.forgotPassword.subtitle": "Nhập email để đặt lại mật khẩu",
      "auth.common.enterEmail": "Nhập email",
      "auth.forgotPassword.sendRequest": "Gửi yêu cầu",
      "auth.forgotPassword.sending": "Đang gửi...",
      "auth.forgotPassword.backToLogin": "Quay lại đăng nhập",
      "auth.forgotPassword.missingTitle": "Thiếu thông tin",
      "auth.forgotPassword.missingEmail": "Vui lòng nhập email",
      "auth.forgotPassword.failedTitle": "Gửi yêu cầu thất bại",
      "auth.forgotPassword.failedMessage": "Không thể gửi yêu cầu",
    }[key] || key),
  }),
}));

jest.mock("../../../services/apiClient", () => ({ post: jest.fn() }));
jest.mock("../../../constants/api", () => ({ API_ENDPOINTS: { FORGOT_PASSWORD: "/auth/forgot-password" } }));
jest.mock("../../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.response?.data?.message || f }));
jest.mock("../../../utils/authActivation", () => ({ getActivationEmail: (e, f) => f, isActivationRequiredError: () => false, openActivationOtp: jest.fn() }));

jest.mock("../../../constants/colors", () => ({ COLORS: {}, useAppColors: () => ({
  APP_BACKGROUND: "#F2F2F7", PRIMARY_GLOW: "rgba(255,178,191,0.25)", TEXT: "#1A0F14",
  TEXT_SECONDARY: "#8B7B80", SURFACE: "#FFFFFF", BORDER: "#E5E7EB",
  SURFACE_SECONDARY: "#F2F2F7", TEXT_MUTED: "#B8A6AC", PRIMARY: "#ef5e83",
}) }));
jest.mock("../../../utils/layoutScale", () => ({ scale: (s) => s, clampScale: (s) => s }));

import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import ForgotPasswordScreen from "../ForgotPasswordScreen";

describe("ForgotPasswordScreen", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => { jest.clearAllMocks(); });

  test("renders title, subtitle, and back link", () => {
    const { getByText } = render(<ForgotPasswordScreen />);
    expect(getByText("Quên mật khẩu")).toBeTruthy();
    expect(getByText("Quay lại đăng nhập")).toBeTruthy();
  });

  test("shows alert when submitting empty email", async () => {
    const { getByText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByText("Gửi yêu cầu"));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Thiếu thông tin", "Vui lòng nhập email");
    });
  });

  test("calls API on success", async () => {
    const apiClient = require("../../../services/apiClient");
    apiClient.post.mockResolvedValueOnce({ data: {} });

    const { getByText, getByDisplayValue } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByDisplayValue(""), "user@test.com");
    fireEvent.press(getByText("Gửi yêu cầu"));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/auth/forgot-password", { email: "user@test.com" });
    });
  });

  test("shows error alert when API fails", async () => {
    const apiClient = require("../../../services/apiClient");
    apiClient.post.mockRejectedValueOnce({ response: { data: { message: "Email không tồn tại" } } });

    const { getByText, getByDisplayValue } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByDisplayValue(""), "unknown@test.com");
    fireEvent.press(getByText("Gửi yêu cầu"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Gửi yêu cầu thất bại", "Email không tồn tại");
    });
  });
});
