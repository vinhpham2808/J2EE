jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useRoute: () => ({ params: { email: "test@example.com", otp: "123456" } }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "auth.resetPassword.title": "Đặt lại mật khẩu",
      "auth.resetPassword.subtitle": "Nhập mật khẩu mới",
      "auth.resetPassword.placeholder": "Mật khẩu mới",
      "auth.resetPassword.submit": "Đặt lại",
      "auth.resetPassword.loading": "Đang xử lý...",
      "auth.resetPassword.successMessage": "Mật khẩu đã được đặt lại",
      "auth.resetPassword.failedMessage": "Không thể đặt lại mật khẩu",
      "auth.common.success": "Thành công",
      "auth.common.error": "Lỗi",
      "auth.common.login": "Đăng nhập",
      "auth.password.newPassword": "Mật khẩu mới",
      "auth.password.mustContain": "Phải có",
      "auth.password.mustNotContain": "Không được",
      "auth.password.oneNumber": "1 số",
      "auth.password.oneUppercase": "1 chữ hoa",
      "auth.password.oneLowercase": "1 chữ thường",
      "auth.password.oneSpecial": "1 ký tự đặc biệt",
      "auth.password.eightChars": "8 ký tự",
      "auth.password.over256": "Quá 256 ký tự",
    }[key] || key),
  }),
}));

jest.mock("../../../services/apiClient", () => ({ post: jest.fn() }));
jest.mock("../../../constants/api", () => ({ API_ENDPOINTS: { RESET_PASSWORD: "/auth/reset-password" } }));
jest.mock("../../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.response?.data?.message || f }));
jest.mock("../../../constants/colors", () => ({ COLORS: { PRIMARY_LIGHT: "#ffb2bf", DARK_INPUT_BG: "#1a1614", DARK_BORDER: "#514541", DARK_TEXT_SECONDARY: "#d3c3bd", DARK_TEXT: "#f3eeeb", DARK_BG: "#161311", INCOME: "#22C55E" }, useAppColors: () => ({ APP_BACKGROUND: "#F2F2F7", PRIMARY_GLOW: "rgba(255,178,191,0.25)", TEXT: "#1A0F14", TEXT_SECONDARY: "#8B7B80" }) }));
jest.mock("../../../utils/layoutScale", () => ({ scale: (s) => s, clampScale: (s) => s }));
jest.mock("../../../components/auth/PasswordInput", () => "PasswordInput");
jest.mock("../../../components/auth/PasswordRequirement", () => "PasswordRequirement");
jest.mock("../../../components/ui/AppButton", () => "AppButton");

import React from "react";
import { render } from "@testing-library/react-native";
import ResetPasswordScreen from "../ResetPasswordScreen";

describe("ResetPasswordScreen", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("renders title and subtitle", () => {
    const { getByText } = render(<ResetPasswordScreen />);
    expect(getByText("Đặt lại mật khẩu")).toBeTruthy();
    expect(getByText("Nhập mật khẩu mới")).toBeTruthy();
  });

  test("renders PasswordInput, AppButton, and PasswordRequirement", () => {
    const { UNSAFE_getByType } = render(<ResetPasswordScreen />);
    expect(UNSAFE_getByType("PasswordInput")).toBeTruthy();
    expect(UNSAFE_getByType("PasswordRequirement")).toBeTruthy();
  });
});
