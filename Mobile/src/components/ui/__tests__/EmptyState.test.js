jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    TEXT: "#111",
    TEXT_SECONDARY: "#666",
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
      { onPress, testID: "action-btn" },
      React.createElement(Text, null, title)
    );
});

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import EmptyState from "../EmptyState";

describe("EmptyState", () => {
  // ─── Title ───────────────────────────────────────────────────────────────────

  it("renders custom title when provided", () => {
    const { getByText } = render(<EmptyState title="Không có dữ liệu" />);
    expect(getByText("Không có dữ liệu")).toBeTruthy();
  });

  it("falls back to t('emptyState.noData') when title not provided", () => {
    const { getByText } = render(<EmptyState />);
    expect(getByText("emptyState.noData")).toBeTruthy();
  });

  // ─── Description ─────────────────────────────────────────────────────────────

  it("renders description when provided", () => {
    const { getByText } = render(
      <EmptyState description="Hãy thêm giao dịch đầu tiên" />
    );
    expect(getByText("Hãy thêm giao dịch đầu tiên")).toBeTruthy();
  });

  it("does NOT render description when not provided", () => {
    const { queryByText } = render(<EmptyState />);
    expect(queryByText("Hãy thêm")).toBeNull();
  });

  // ─── Action button ────────────────────────────────────────────────────────────

  it("renders action button when both actionTitle and onActionPress provided", () => {
    const { getByTestId } = render(
      <EmptyState actionTitle="Thêm mới" onActionPress={jest.fn()} />
    );
    expect(getByTestId("action-btn")).toBeTruthy();
  });

  it("does NOT render action button when only actionTitle is provided", () => {
    const { queryByTestId } = render(<EmptyState actionTitle="Thêm mới" />);
    expect(queryByTestId("action-btn")).toBeNull();
  });

  it("does NOT render action button when only onActionPress is provided", () => {
    const { queryByTestId } = render(<EmptyState onActionPress={jest.fn()} />);
    expect(queryByTestId("action-btn")).toBeNull();
  });

  it("calls onActionPress when action button is pressed", () => {
    const onActionPress = jest.fn();
    const { getByTestId } = render(
      <EmptyState actionTitle="Thêm mới" onActionPress={onActionPress} />
    );
    fireEvent.press(getByTestId("action-btn"));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });
});
