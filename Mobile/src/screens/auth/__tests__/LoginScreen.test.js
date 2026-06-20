jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => ({ "auth.login.title": "Đăng nhập", "auth.login.subtitle": "Chào mừng trở lại", "auth.login.authenticating": "Đang xác thực..." }[key] || key) }),
}));

jest.mock("../../../hooks/useLoginActions", () => () => ({
  email: "", setEmail: jest.fn(), password: "", setPassword: jest.fn(),
  rememberMe: false, loading: false, googleAuthLoading: false,
  onToggleRemember: jest.fn(), onSubmit: jest.fn(), onGooglePress: jest.fn(),
}));

jest.mock("../../../components/auth/LoginForm", () => "LoginForm");
jest.mock("../../../components/common/LanguagePill", () => "LanguagePill");
jest.mock("../../../constants/colors", () => ({ useAppColors: () => ({ APP_BACKGROUND: "#F2F2F7", BADGE_POSITIVE_BG: "rgba(124,77,255,0.08)", TEXT: "#1A0F14", TEXT_SECONDARY: "#8B7B80", OVERLAY: "rgba(0,0,0,0.5)", SURFACE: "#FFFFFF", BORDER: "#E5E7EB", PRIMARY: "#7C4DFF" }) }));
jest.mock("../../../utils/layoutScale", () => ({ scale: (s) => s, clampScale: (s) => s }));

import React from "react";
import { render } from "@testing-library/react-native";
import LoginScreen from "../LoginScreen";

describe("LoginScreen", () => {
  test("renders title and subtitle", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText("Đăng nhập")).toBeTruthy();
    expect(getByText("Chào mừng trở lại")).toBeTruthy();
  });

  test("renders LoginForm and LanguagePill components", () => {
    const { UNSAFE_getByType } = render(<LoginScreen />);
    expect(UNSAFE_getByType("LoginForm")).toBeTruthy();
    expect(UNSAFE_getByType("LanguagePill")).toBeTruthy();
  });
});
