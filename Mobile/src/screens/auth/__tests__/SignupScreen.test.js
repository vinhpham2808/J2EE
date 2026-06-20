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
      "auth.signup.title": "Tạo tài khoản",
      "auth.signup.subtitle": "Nhập email để bắt đầu",
      "auth.common.email": "Email",
      "auth.common.next": "Tiếp theo",
      "auth.common.processing": "Đang xử lý...",
      "auth.signup.hasAccount": "Đã có tài khoản?",
      "auth.signup.missingTitle": "Thiếu thông tin",
      "auth.signup.missingEmail": "Vui lòng nhập email",
      "auth.signup.failedTitle": "Đăng ký thất bại",
      "auth.signup.failedMessage": "Không thể đăng ký",
    }[key] || key),
  }),
}));

jest.mock("../../../services/apiClient", () => ({ post: jest.fn() }));
jest.mock("../../../constants/api", () => ({ API_ENDPOINTS: { REGISTER: "/auth/register" } }));
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
import SignupScreen from "../SignupScreen";

describe("SignupScreen", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => { jest.clearAllMocks(); });

  test("renders title and subtitle", () => {
    const { getByText } = render(<SignupScreen />);
    expect(getByText("Đã có tài khoản?")).toBeTruthy();
  });

  test("shows alert when submitting empty email", async () => {
    const { getByText } = render(<SignupScreen />);
    fireEvent.press(getByText("Tiếp theo"));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Thiếu thông tin", "Vui lòng nhập email");
    });
  });

  test("calls API and navigates on successful signup", async () => {
    const apiClient = require("../../../services/apiClient");
    apiClient.post.mockResolvedValueOnce({ data: {} });

    const { getByText, getByDisplayValue } = render(<SignupScreen />);
    fireEvent.changeText(getByDisplayValue(""), "test@example.com");
    fireEvent.press(getByText("Tiếp theo"));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/auth/register", { email: "test@example.com" });
    });
  });

  test("shows error alert when API fails", async () => {
    const apiClient = require("../../../services/apiClient");
    apiClient.post.mockRejectedValueOnce({ response: { data: { message: "Email đã tồn tại" } } });

    const { getByText, getByDisplayValue } = render(<SignupScreen />);
    fireEvent.changeText(getByDisplayValue(""), "existing@test.com");
    fireEvent.press(getByText("Tiếp theo"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Đăng ký thất bại", "Email đã tồn tại");
    });
  });
});
