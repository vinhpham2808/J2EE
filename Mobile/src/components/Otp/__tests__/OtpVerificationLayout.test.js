import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";
import OtpVerificationLayout from "../OtpVerificationLayout";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "auth.common.verify": "Xác nhận",
        "auth.common.verifying": "Đang xác nhận...",
        "auth.common.resend": "Gửi lại mã",
        "auth.common.noCode": "Không nhận được mã?",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    APP_BACKGROUND: "#F2F2F7",
    PRIMARY_GLOW: "rgba(255, 178, 191, 0.25)",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    SURFACE: "#FFFFFF",
    BORDER: "#E5E7EB",
    EXPENSE_LIGHT: "#FDE8E3",
    PRIMARY: "#EF5E83",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

jest.mock("../../ui/AppButton", () => "AppButton");

describe("OtpVerificationLayout", () => {
  const mockOnAction = jest.fn();
  const mockOnResend = jest.fn();

  const defaultProps = {
    title: "Xác thực OTP",
    subtitle: "Vui lòng nhập mã gửi đến",
    email: "test@example.com",
    error: "",
    actionLabel: "Tiếp tục",
    actionLoading: false,
    actionDisabled: false,
    onAction: mockOnAction,
    resendDisabled: false,
    countdown: 60,
    onResend: mockOnResend,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders text details, action button, and children slot correctly", () => {
    const { getByText, UNSAFE_getByType } = render(
      <OtpVerificationLayout {...defaultProps}>
        <Text>OTP Input Field</Text>
      </OtpVerificationLayout>
    );

    expect(getByText("Xác thực OTP")).toBeTruthy();
    expect(getByText("Vui lòng nhập mã gửi đến")).toBeTruthy();
    expect(getByText("test@example.com")).toBeTruthy();
    expect(getByText("OTP Input Field")).toBeTruthy();

    const appButton = UNSAFE_getByType("AppButton");
    expect(appButton.props.title).toBe("Tiếp tục");
    expect(appButton.props.disabled).toBe(false);

    fireEvent(appButton, "press");
    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  test("renders verifying state and disables verification button when actionLoading is true", () => {
    const { UNSAFE_getByType } = render(
      <OtpVerificationLayout {...defaultProps} actionLoading={true} />
    );

    const appButton = UNSAFE_getByType("AppButton");
    expect(appButton.props.title).toBe("Đang xác nhận...");
    expect(appButton.props.loading).toBe(true);
  });

  test("displays error message if error prop is provided", () => {
    const { getByText } = render(
      <OtpVerificationLayout {...defaultProps} error="Mã OTP sai hoặc đã hết hạn" />
    );

    expect(getByText("Mã OTP sai hoặc đã hết hạn")).toBeTruthy();
  });

  test("resend button functionality and countdown state", () => {
    // 1. Resend enabled state
    const { getByText, rerender, UNSAFE_getByType } = render(
      <OtpVerificationLayout {...defaultProps} resendDisabled={false} />
    );

    const resendBtn = UNSAFE_getByType(Pressable);
    expect(getByText("Gửi lại mã")).toBeTruthy();

    fireEvent.press(resendBtn);
    expect(mockOnResend).toHaveBeenCalledTimes(1);

    // 2. Resend disabled with countdown state
    rerender(<OtpVerificationLayout {...defaultProps} resendDisabled={true} countdown={45} />);
    expect(getByText("Gửi lại mã (45s)")).toBeTruthy();
  });
});
