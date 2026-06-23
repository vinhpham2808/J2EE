jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    TEXT: "#111",
    TEXT_SECONDARY: "#666",
    EXPENSE_LIGHT: "#FEECEC",
    EXPENSE: "#EF4444",
    PRIMARY: "#7C4DFF",
    PRIMARY_GLOW: "#EDE7FF",
    PRIMARY_LIGHT: "#EDE7FF",
  }),
}));
jest.mock("../../../utils/layoutScale", () => ({ scale: (n) => n }));
jest.mock("../AppIcon", () => () => null);
jest.mock("../AppButton", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ title, onPress }) =>
    React.createElement(
      TouchableOpacity,
      { onPress, testID: "retry-btn" },
      React.createElement(Text, null, title)
    );
});

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ErrorState from "../ErrorState";

describe("ErrorState", () => {
  it("always renders 'Lỗi kết nối' title", () => {
    const { getByText } = render(<ErrorState />);
    expect(getByText("Lỗi kết nối")).toBeTruthy();
  });

  it("renders default error message when error not provided", () => {
    const { getByText } = render(<ErrorState />);
    expect(getByText("Đã xảy ra lỗi không mong muốn.")).toBeTruthy();
  });

  it("renders custom error message", () => {
    const { getByText } = render(<ErrorState error="Không thể kết nối máy chủ" />);
    expect(getByText("Không thể kết nối máy chủ")).toBeTruthy();
  });

  it("renders retry button when onRetry provided", () => {
    const { getByTestId } = render(<ErrorState onRetry={jest.fn()} />);
    expect(getByTestId("retry-btn")).toBeTruthy();
  });

  it("does NOT render retry button when onRetry not provided", () => {
    const { queryByTestId } = render(<ErrorState />);
    expect(queryByTestId("retry-btn")).toBeNull();
  });

  it("calls onRetry when retry button is pressed", () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(<ErrorState onRetry={onRetry} />);
    fireEvent.press(getByTestId("retry-btn"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
