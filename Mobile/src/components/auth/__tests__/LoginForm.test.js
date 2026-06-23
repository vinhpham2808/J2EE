import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import LoginForm from "../LoginForm";

jest.mock("react-i18next", () => {
  const dict = {
    "auth.common.enterEmail": "Nhap email",
    "auth.common.enterPassword": "Nhap mat khau",
    "auth.login.rememberMe": "Ghi nho dang nhap",
    "auth.login.forgotPassword": "Quen mat khau?",
    "auth.common.loginAction": "Dang nhap",
    "auth.login.loading": "Dang dang nhap...",
    "auth.login.divider": "hoac",
    "auth.login.noAccount": "Chua co tai khoan?",
    "auth.login.signup": "Dang ky",
  };

  return {
    useTranslation: () => ({ t: (key) => dict[key] || key }),
  };
});

jest.mock("../../ui/AppIcon", () => "AppIcon");

jest.mock(  "../../../constants/colors", () => ({
  useAppColors: () => ({
    SURFACE: "#FFFFFF",
    BORDER: "#E5E7EB",
    APP_BACKGROUND: "#F2F2F7",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    PRIMARY: "#7C4DFF",
    PRIMARY_LIGHT: "#B388FF",
  }),
}));

describe("LoginForm", () => {
  const defaultProps = {
    email: "",
    password: "",
    rememberMe: false,
    loading: false,
    googleLoading: false,
    onEmailChange: jest.fn(),
    onPasswordChange: jest.fn(),
    onToggleRemember: jest.fn(),
    onSubmit: jest.fn(),
    onForgotPassword: jest.fn(),
    onGooglePress: jest.fn(),
    onSignup: jest.fn(),
  };

  const renderComponent = (props = {}) =>
    render(<LoginForm {...defaultProps} {...props} />);

  describe("renders all elements", () => {
    test("renders email input, password input, and login button", () => {
      const { getByTestId } = renderComponent();

      expect(getByTestId("email-input")).toBeTruthy();
      expect(getByTestId("password-input")).toBeTruthy();
      expect(getByTestId("login-button")).toBeTruthy();
    });

    test("renders remember switch, forgot password, signup, and google button", () => {
      const { getByTestId } = renderComponent();

      expect(getByTestId("remember-switch")).toBeTruthy();
      expect(getByTestId("forgot-password-button")).toBeTruthy();
      expect(getByTestId("signup-button")).toBeTruthy();
      expect(getByTestId("google-login-button")).toBeTruthy();
    });

    test("shows login text when not loading", () => {
      const { getByText } = renderComponent();

      expect(getByText("Dang nhap")).toBeTruthy();
    });
  });

  describe("user interactions", () => {
    test("calls onEmailChange when typing email", () => {
      const onEmailChange = jest.fn();
      const { getByTestId } = renderComponent({ onEmailChange });

      fireEvent.changeText(getByTestId("email-input"), "user@example.com");

      expect(onEmailChange).toHaveBeenCalledWith("user@example.com");
    });

    test("calls onPasswordChange when typing password", () => {
      const onPasswordChange = jest.fn();
      const { getByTestId } = renderComponent({ onPasswordChange });

      fireEvent.changeText(getByTestId("password-input"), "secret123");

      expect(onPasswordChange).toHaveBeenCalledWith("secret123");
    });

    test("calls onSubmit when pressing login button", () => {
      const onSubmit = jest.fn();
      const { getByTestId } = renderComponent({ onSubmit });

      fireEvent.press(getByTestId("login-button"));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test("calls onToggleRemember when toggling remember switch", () => {
      const onToggleRemember = jest.fn();
      const { getByTestId } = renderComponent({ onToggleRemember });

      fireEvent(getByTestId("remember-switch"), "onValueChange", true);

      expect(onToggleRemember).toHaveBeenCalledWith(true);
    });

    test("calls onForgotPassword when pressing forgot password", () => {
      const onForgotPassword = jest.fn();
      const { getByTestId } = renderComponent({ onForgotPassword });

      fireEvent.press(getByTestId("forgot-password-button"));

      expect(onForgotPassword).toHaveBeenCalledTimes(1);
    });

    test("calls onSignup when pressing signup button", () => {
      const onSignup = jest.fn();
      const { getByTestId } = renderComponent({ onSignup });

      fireEvent.press(getByTestId("signup-button"));

      expect(onSignup).toHaveBeenCalledTimes(1);
    });

    test("calls onGooglePress when pressing google button", () => {
      const onGooglePress = jest.fn();
      const { getByTestId } = renderComponent({ onGooglePress });

      fireEvent.press(getByTestId("google-login-button"));

      expect(onGooglePress).toHaveBeenCalledTimes(1);
    });
  });

  describe("loading state", () => {
    test("disables login button and shows loading text when loading", () => {
      const { getByTestId, getByText } = renderComponent({ loading: true });

      expect(getByTestId("login-button")).toBeDisabled();
      expect(getByText("Dang dang nhap...")).toBeTruthy();
    });

    test("disables google button when googleLoading is true", () => {
      const { getByTestId } = renderComponent({ googleLoading: true });

      expect(getByTestId("google-login-button")).toBeDisabled();
    });
  });

  describe("pre-filled values", () => {
    test("displays email and password values", () => {
      const { getByTestId } = renderComponent({
        email: "admin@test.com",
        password: "mypassword",
      });

      expect(getByTestId("email-input").props.value).toBe("admin@test.com");
      expect(getByTestId("password-input").props.value).toBe("mypassword");
    });
  });
});
