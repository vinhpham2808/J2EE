jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useRoute: () => ({ params: { email: "test@example.com", fullName: "Nguyen Van A" } }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "auth.createPassword.title": "Tạo mật khẩu",
      "auth.createPassword.subtitle": "Tạo mật khẩu cho tài khoản của bạn",
      "auth.common.enterPassword": "Nhập mật khẩu",
      "auth.common.next": "Tiếp theo",
      "auth.createPassword.loading": "Đang xử lý...",
      "auth.createPassword.completeTitle": "Hoàn tất",
      "auth.createPassword.completeMessage": "Tài khoản đã được tạo",
      "auth.createPassword.weakTitle": "Mật khẩu yếu",
      "auth.createPassword.weakMessage": "Mật khẩu không được chứa thông tin cá nhân",
      "auth.createPassword.failedMessage": "Không thể thiết lập tài khoản",
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
      "auth.password.personalInfo": "Không chứa thông tin cá nhân",
    }[key] || key),
  }),
}));

jest.mock("../../../services/apiClient", () => ({ put: jest.fn() }));
jest.mock("../../../constants/api", () => ({ API_ENDPOINTS: { COMPLETE_PROFILE: "/auth/complete-profile" } }));
jest.mock("../../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.response?.data?.message || f }));
jest.mock("../../../constants/colors", () => ({ COLORS: { PRIMARY_LIGHT: "#ffb2bf", DARK_INPUT_BG: "#1a1614", DARK_BORDER: "#514541", DARK_TEXT_SECONDARY: "#d3c3bd", DARK_TEXT: "#f3eeeb", DARK_BG: "#161311", INCOME: "#22C55E" }, useAppColors: () => ({ APP_BACKGROUND: "#F2F2F7", PRIMARY_GLOW: "rgba(255,178,191,0.25)", TEXT: "#1A0F14", TEXT_SECONDARY: "#8B7B80" }) }));
jest.mock("../../../utils/layoutScale", () => ({ scale: (s) => s, clampScale: (s) => s }));
jest.mock("../../../components/auth/PasswordInput", () => "PasswordInput");
jest.mock("../../../components/auth/PasswordRequirement", () => "PasswordRequirement");
jest.mock("../../../components/ui/AppButton", () => "AppButton");

import React from "react";
import { render } from "@testing-library/react-native";
import CreatePasswordScreen from "../CreatePasswordScreen";

describe("CreatePasswordScreen", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("renders title and subtitle", () => {
    const { getByText } = render(<CreatePasswordScreen />);
    expect(getByText("Tạo mật khẩu")).toBeTruthy();
    expect(getByText("Tạo mật khẩu cho tài khoản của bạn")).toBeTruthy();
  });

  test("renders PasswordInput, AppButton, and PasswordRequirement", () => {
    const { UNSAFE_getByType } = render(<CreatePasswordScreen />);
    expect(UNSAFE_getByType("PasswordInput")).toBeTruthy();
    expect(UNSAFE_getByType("PasswordRequirement")).toBeTruthy();
  });
});
