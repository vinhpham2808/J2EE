import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PasswordInput from "../PasswordInput";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "auth.password.newPassword": "Mật khẩu mới",
        "auth.common.enterPassword": "Nhập mật khẩu",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    PRIMARY_LIGHT: "#B388FF",
    DARK_INPUT_BG: "#1a1614",
    DARK_BORDER: "#514541",
    PRIMARY: "#7C4DFF",
    DARK_TEXT: "#f3eeeb",
    DARK_TEXT_SECONDARY: "#d3c3bd",
    DARK_BG: "#161311",
  },
}));

describe("PasswordInput", () => {
  const defaultProps = {
    value: "",
    onChangeText: jest.fn(),
    onFocus: jest.fn(),
    onBlur: jest.fn(),
    focused: false,
    placeholder: "",
  };

  beforeEach(() => {
    defaultProps.onChangeText.mockClear();
    defaultProps.onFocus.mockClear();
    defaultProps.onBlur.mockClear();
  });

  test("renders label and TextInput with default placeholder when empty", () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <PasswordInput {...defaultProps} />
    );

    expect(getByText("Mật khẩu mới")).toBeTruthy();
    expect(getByPlaceholderText("Nhập mật khẩu")).toBeTruthy();
    // Clear button '✕' should not be present when value is empty
    expect(queryByText("✕")).toBeNull();
  });

  test("renders custom placeholder", () => {
    const { getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} placeholder="Nhập lại mật khẩu" />
    );
    expect(getByPlaceholderText("Nhập lại mật khẩu")).toBeTruthy();
  });

  test("calls onChangeText when typing", () => {
    const { getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} />
    );

    const input = getByPlaceholderText("Nhập mật khẩu");
    fireEvent.changeText(input, "mySecurePassword");

    expect(defaultProps.onChangeText).toHaveBeenCalledWith("mySecurePassword");
  });

  test("renders clear button when value is not empty and clears input on press", () => {
    const { getByText } = render(
      <PasswordInput {...defaultProps} value="hello" />
    );

    const clearButton = getByText("✕");
    expect(clearButton).toBeTruthy();

    fireEvent.press(clearButton);
    expect(defaultProps.onChangeText).toHaveBeenCalledWith("");
  });

  test("triggers onFocus and onBlur callbacks", () => {
    const { getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} />
    );

    const input = getByPlaceholderText("Nhập mật khẩu");
    
    fireEvent(input, "focus");
    expect(defaultProps.onFocus).toHaveBeenCalledTimes(1);

    fireEvent(input, "blur");
    expect(defaultProps.onBlur).toHaveBeenCalledTimes(1);
  });
});
