let mockNavigate = jest.fn();
let mockRouteParams = { email: "test@example.com", initialCountdown: 60 };

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "auth.otp.missingCode": "Vui lòng nhập đủ mã OTP",
      "auth.otp.verifyFailed": "Xác thực thất bại",
      "auth.otp.signupSuccessTitle": "Đăng ký thành công",
      "auth.otp.signupSuccessMessage": "Tài khoản của bạn đã được kích hoạt",
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
    VERIFY_OTP: "/auth/verify-otp",
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
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import VerifyOtpScreen from "../VerifyOtpScreen";

describe("VerifyOtpScreen", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockCodeValue = "";
    mockRouteParams = { email: "test@example.com", initialCountdown: 60 };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("navigates back to Signup screen if email parameter is missing", () => {
    mockRouteParams = { email: "", initialCountdown: 0 };
    render(<VerifyOtpScreen />);
    expect(mockNavigate).toHaveBeenCalledWith("Signup");
  });

  it("sets error message if submitting OTP code with length not equal to 6", () => {
    mockCodeValue = "12345"; // Length 5
    const { getByTestId, queryByTestId } = render(<VerifyOtpScreen />);

    fireEvent.press(getByTestId("action-button"));
    expect(getByTestId("error-text").props.children).toBe("Vui lòng nhập đủ mã OTP");
  });

  it("calls verify API endpoint and alerts on success", async () => {
    mockCodeValue = "123456";
    const apiClient = require("../../../services/apiClient");
    apiClient.post.mockResolvedValueOnce({ data: {} });

    const { getByTestId } = render(<VerifyOtpScreen />);
    fireEvent.press(getByTestId("action-button"));

    expect(apiClient.post).toHaveBeenCalledWith("/auth/verify-otp", {
      email: "test@example.com",
      otp: "123456",
    });

    // Wait for the success state and timeout to trigger Alert
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Đăng ký thành công",
      "Tài khoản của bạn đã được kích hoạt",
      [{ text: "OK", onPress: expect.any(Function) }]
    );

    // Call onPress to verify navigation to SetupProfile
    const okButton = alertSpy.mock.calls[0][2][0];
    okButton.onPress();
    expect(mockNavigate).toHaveBeenCalledWith("SetupProfile", {
      email: "test@example.com",
    });
  });

  it("sets API error response message when verification fails", async () => {
    mockCodeValue = "111111";
    const apiClient = require("../../../services/apiClient");
    apiClient.post.mockRejectedValueOnce({
      response: { data: { message: "Mã OTP đã hết hạn" } },
    });

    const { getByTestId } = render(<VerifyOtpScreen />);
    fireEvent.press(getByTestId("action-button"));

    await waitFor(() => {
      expect(getByTestId("error-text").props.children).toBe("Mã OTP đã hết hạn");
    });
  });

  it("sends request to resend OTP API endpoint when clicking Resend", async () => {
    const apiClient = require("../../../services/apiClient");
    apiClient.post.mockResolvedValueOnce({ data: {} });

    const { getByTestId } = render(<VerifyOtpScreen />);
    fireEvent.press(getByTestId("resend-button"));

    expect(mockStartCountdown).toHaveBeenCalledWith(60);
    expect(mockReset).toHaveBeenCalled();
    expect(apiClient.post).toHaveBeenCalledWith("/auth/resend-otp", {
      email: "test@example.com",
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Đã gửi lại mã", "Vui lòng kiểm tra email");
    });
  });

  it("handles rate-limit block gracefully on resend failure using retry after seconds", async () => {
    const apiClient = require("../../../services/apiClient");
    const { getRetryAfterSeconds } = require("../../../utils/authOtp");

    apiClient.post.mockRejectedValueOnce(new Error("Rate limit exceeded"));
    getRetryAfterSeconds.mockReturnValueOnce(45);

    const { getByTestId } = render(<VerifyOtpScreen />);
    fireEvent.press(getByTestId("resend-button"));

    await waitFor(() => {
      // First calls startCountdown with 60 initially, then resets it to 45 on rate-limit error
      expect(mockStartCountdown).toHaveBeenLastCalledWith(45);
    });
  });
});
