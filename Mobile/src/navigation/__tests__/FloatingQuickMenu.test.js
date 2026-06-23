jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, colors, ...props }) =>
      React.createElement(View, { testID: "gradient", ...props }, children),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFF",
    TEXT: "#000",
    SHADOW_COLOR: "#000",
  }),
}));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import FloatingQuickMenu, { FloatingTabButton } from "../FloatingQuickMenu";

describe("FloatingTabButton", () => {
  it("renders without crash", () => {
    const { getByLabelText } = render(
      <FloatingTabButton onPress={jest.fn()} isOpen={false} />
    );
    expect(getByLabelText("Mở menu nhanh")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPressMock = jest.fn();
    const { getByLabelText } = render(
      <FloatingTabButton onPress={onPressMock} isOpen={false} />
    );
    fireEvent.press(getByLabelText("Mở menu nhanh"));
    expect(onPressMock).toHaveBeenCalled();
  });
});

describe("FloatingQuickMenu", () => {
  const defaultProps = {
    visible: false,
    onClose: jest.fn(),
    onSelectRoute: jest.fn(),
    focusedKey: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when visible is false", () => {
    const { toJSON } = render(<FloatingQuickMenu {...defaultProps} />);
    expect(toJSON()).toBeNull();
  });

  it("renders 5 action items when visible is true", () => {
    const { getByText } = render(
      <FloatingQuickMenu {...defaultProps} visible={true} />
    );
    expect(getByText("Thu nhập")).toBeTruthy();
    expect(getByText("Chi tiêu")).toBeTruthy();
    expect(getByText("Dự báo")).toBeTruthy();
    expect(getByText("Ngân sách")).toBeTruthy();
    expect(getByText("Chat AI")).toBeTruthy();
  });

  it("calls onSelectRoute with correct key when an action card is pressed", () => {
    const onSelectRouteMock = jest.fn();
    const { getByText } = render(
      <FloatingQuickMenu
        {...defaultProps}
        visible={true}
        onSelectRoute={onSelectRouteMock}
      />
    );

    fireEvent.press(getByText("Thu nhập"));
    expect(onSelectRouteMock).toHaveBeenCalledWith("Income");

    fireEvent.press(getByText("Chi tiêu"));
    expect(onSelectRouteMock).toHaveBeenCalledWith("Expense");

    fireEvent.press(getByText("Chat AI"));
    expect(onSelectRouteMock).toHaveBeenCalledWith("Chat");
  });

  it("calls onClose when the backdrop overlay is pressed", () => {
    const onCloseMock = jest.fn();
    const { UNSAFE_getByProps } = render(
      <FloatingQuickMenu {...defaultProps} visible={true} onClose={onCloseMock} />
    );

    const backdrop = UNSAFE_getByProps({ onPress: onCloseMock });
    expect(backdrop).toBeTruthy();
    fireEvent.press(backdrop);
    expect(onCloseMock).toHaveBeenCalled();
  });
});
