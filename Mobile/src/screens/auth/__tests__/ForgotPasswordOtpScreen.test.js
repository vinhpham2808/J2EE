let mockNavigate = jest.fn();
let mockRouteParams = { email: "reset@example.com" };

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "auth.otp.missingCode": "Vui lòng nhập đủ mã OTP",
      "auth.otp.resetInvalid": "Mã xác nhận không hợp lệ",
      "auth.otp.resentTitle": "Đã gửi lại mã",
      "auth.otp.resentMessage": "Vui lòng kiểm tra email",
      "auth.otp.resendFailed": "Gửi lại mã thất bại",
    }[key] || key),
  }),
}));

// Mock hooks
let mockCodeValue = "";
const mockReset = jest.fn();
jest.mock("../../../hooks/useOtpInput", () => () => ({
  otp: Array(6).fill(""),
  code: mockCodeValue,
  inputRefs: { current: [] },
  handleChange: jest.fn(),
  handleKeyDown: jest.fn(),
  reset: mockReset,
}));

let mockResendDisabled = false;
let mockCountdown = 0;
const mockStartCountdown = jest.fn();
const mockStopCountdown = jest.fn();
jest.mock("../../../hooks/useOtpCountdown", () => () => ({
  resendDisabled: mockResendDisabled,
  countdown: mockCountdown,
  startCountdown: mockStartCountdown,
  stopCountdown: mockStopCountdown,
}));

// Mock components
jest.mock("../../../components/Otp/OtpInput", () => "OtpInput");
jest.mock("../../../components/Otp/OtpVerificationLayout", () => {
  const React = require("react");
  const { TouchableOpacity, Text, View } = require("react-native");
  return ({ children, onAction, onResend, actionDisabled, error }) =>
    React.createElement(
      View,
      { testID: "verification-layout" },
      React.createElement(
        TouchableOpacity,
        { testID: "action-button", onPress: onAction, disabled: actionDisabled },
        React.createElement(Text, null, "Verify")
      ),
      React.createElement(
        TouchableOpacity,
        { testID: "resend-button", onPress: onResend },
        React.createElement(Text, null, "Resend")
      ),
      error ? React.createElement(Text, { testID: "error-text" }, error) : null,
      children
    );
});

jest.mock("../../../services/apiClient", () => ({ post: jest.fn() }));
jest.mock("../../../constants/api", () => ({
  API_ENDPOINTS: {
    VERIFY_RESET_OTP: "/auth/verify-reset-otp",
    RESEND_OTP: "/auth/resend-otp",
  },
}));
jest.mock("../../../utils/format", () => ({
  getApiErrorMessage: (err, fallback) => err?.response?.data?.message || fallback,
}));
jest.mock("../../../utils/authOtp", () => ({
  getRetryAfterSeconds: jest.fn(() => 0),
}));

import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ForgotPasswordOtpScreen from "../ForgotPasswordOtpScreen";

describe("ForgotPasswordOtpScreen", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockCodeValue = "";
    mockRouteParams = { email: "reset@example.com" };
  });

  it("navigates back to ForgotPassword screen if email parameter is missing", () => {
    mockRouteParams = { email: "" };
    render(<ForgotPasswordOtpScreen />);
    expect(mockNavigate).toHaveBeenCalledWith("ForgotPassword");
  });

  it("sets error message if submitting OTP code with length not equal to 6", () => {
    mockCodeValue = "1234"; // Length 4
    const { getByTestId, queryByTestId } = render(<ForgotPasswordOtpScreen />);

    fireEvent.press(getByTestId("action-button"));
    expect(getByTestId("error-text").props.children).toBe("Vui lòng nhập đủ mã OTP");
  });

  it("calls verify API endpoint and navigates to ResetPassword screen on success", async () => {
    mockCodeValue = "654321";
    const apiClient = require("../../../services/apiClient");
    apiClient.post.mockResolvedValueOnce({ data: {} });

    const { getByTestId } = render(<ForgotPasswordOtpScreen />);
    fireEvent.press(getByTestId("action-button"));

    expect(apiClient.post).toHaveBeenCalledWith("/auth/verify-reset-otp", {
      email: "reset@example.com",
      otp: "654321",
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("ResetPassword", {
        email: "reset@example.com",
        otp: "654321",
      });
    });
  });

  it("sets API error response message when reset OTP verification fails", async () => {
    mockCodeValue = "000000";
    const apiClient = require("../../../services/apiClient");
    apiClient.post.mockRejectedValueOnce({
      response: { data: { message: "Mã xác nhận không chính xác" } },
    });

    const { getByTestId } = render(<ForgotPasswordOtpScreen />);
    fireEvent.press(getByTestId("action-button"));

    await waitFor(() => {
      expect(getByTestId("error-text").props.children).toBe("Mã xác nhận không chính xác");
    });
  });

  it("sends request to resend OTP API endpoint when clicking Resend", async () => {
    const apiClient = require("../../../services/apiClient");
    apiClient.post.mockResolvedValueOnce({ data: {} });

    const { getByTestId } = render(<ForgotPasswordOtpScreen />);
    fireEvent.press(getByTestId("resend-button"));

    expect(mockStartCountdown).toHaveBeenCalledWith(60);
    expect(mockReset).toHaveBeenCalled();
    expect(apiClient.post).toHaveBeenCalledWith("/auth/resend-otp", {
      email: "reset@example.com",
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Đã gửi lại mã", "Vui lòng kiểm tra email");
    });
  });
});
