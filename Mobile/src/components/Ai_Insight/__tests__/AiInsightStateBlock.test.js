import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AiInsightStateBlock from "../AiInsightStateBlock";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "aiInsightStateBlock.analyzing": "Đang phân tích dữ liệu...",
        "aiInsightStateBlock.retry": "Thử lại",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    PRIMARY: "#7C4DFF",
    TEXT_SECONDARY: "#8B7B80",
    EXPENSE_COLOR: "#EF4444",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

jest.mock("../../ui/AppIcon", () => "AppIcon");

describe("AiInsightStateBlock", () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  test("renders loader and analyzing text when loading is true", () => {
    const { getByText, UNSAFE_getByType } = render(
      <AiInsightStateBlock loading={true} error={null} onRetry={mockOnRetry} />
    );

    expect(getByText("Đang phân tích dữ liệu...")).toBeTruthy();
    expect(UNSAFE_getByType("ActivityIndicator")).toBeTruthy();
  });

  test("renders nothing (returns null) when loading is false and error is null", () => {
    const { toJSON } = render(
      <AiInsightStateBlock loading={false} error={null} onRetry={mockOnRetry} />
    );

    expect(toJSON()).toBeNull();
  });

  test("renders error message and retry button when loading is false and error exists", () => {
    const { getByText, UNSAFE_getByType } = render(
      <AiInsightStateBlock loading={false} error="Mất kết nối mạng" onRetry={mockOnRetry} />
    );

    expect(getByText("Mất kết nối mạng")).toBeTruthy();
    expect(getByText("Thử lại")).toBeTruthy();
    expect(UNSAFE_getByType("AppIcon").props.name).toBe("warning-outline");
  });

  test("calls onRetry when retry button is pressed", () => {
    const { getByText } = render(
      <AiInsightStateBlock loading={false} error="Lỗi máy chủ" onRetry={mockOnRetry} />
    );

    const retryBtn = getByText("Thử lại");
    fireEvent.press(retryBtn);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
});
