jest.mock("../../../components/ui/AppButton", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ title, onPress, disabled, testID, style }) =>
    React.createElement(
      TouchableOpacity,
      { onPress, disabled, testID, style },
      React.createElement(Text, null, title)
    );
});

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { email: "test@example.com" } }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "auth.setupProfile.fullNameRequired": "Họ và tên (bắt buộc)",
      "auth.setupProfile.fullNamePlaceholder": "Nhập họ và tên của bạn",
      "auth.common.next": "Tiếp theo",
    }[key] || key),
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {},
  useAppColors: () => ({
    APP_BACKGROUND: "#F2F2F7",
    PRIMARY_GLOW: "rgba(255,178,191,0.25)",
    TEXT: "#1A0F14",
    TEXT_MUTED: "#B8A6AC",
    PRIMARY: "#ef5e83",
    BORDER: "#E5E7EB",
    SURFACE_SECONDARY: "#F2F2F7",
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20 }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (s) => s,
  clampScale: (s) => s,
}));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SetupProfileScreen from "../SetupProfileScreen";

describe("SetupProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with input placeholder and label", () => {
    const { getByPlaceholderText, getByText } = render(<SetupProfileScreen />);
    expect(getByText("Họ và tên (bắt buộc)")).toBeTruthy();
    expect(getByPlaceholderText("Nhập họ và tên của bạn")).toBeTruthy();
  });

  it("disables Next button when name input is empty", () => {
    const { getByText } = render(<SetupProfileScreen />);
    const nextButton = getByText("Tiếp theo");
    // AppButton maps disabled prop to TouchableOpacity's disabled prop.
    // Let's fire a press event and verify navigation is not called.
    fireEvent.press(nextButton);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("enables Next button and navigates to CreatePassword when name is typed", () => {
    const { getByPlaceholderText, getByText } = render(<SetupProfileScreen />);
    const textInput = getByPlaceholderText("Nhập họ và tên của bạn");

    fireEvent.changeText(textInput, "  Nguyen Van A  ");
    fireEvent.press(getByText("Tiếp theo"));

    expect(mockNavigate).toHaveBeenCalledWith("CreatePassword", {
      email: "test@example.com",
      fullName: "Nguyen Van A",
    });
  });

  it("shows clear button and clears input text when pressed", () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <SetupProfileScreen />
    );
    const textInput = getByPlaceholderText("Nhập họ và tên của bạn");

    // Initially no clear button
    expect(queryByText("✕")).toBeNull();

    fireEvent.changeText(textInput, "Nguyen Van A");
    // Clear button appears
    const clearButton = getByText("✕");
    expect(clearButton).toBeTruthy();

    fireEvent.press(clearButton);
    expect(textInput.props.value).toBe("");
  });
});
