import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AiInsightSheet from "../AiInsightSheet";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "aiInsight.subtitle": "Phân tích tài chính cá nhân",
        "aiInsight.selectMonth": "Chọn tháng",
        "aiInsight.readyToAnalyze": "Sẵn sàng phân tích",
        "aiInsight.premiumRequired": "Yêu cầu Premium",
        "aiInsight.analyze": "Phân tích",
      };
      if (key === "forecastComponents.forecastForMonth") {
        return `Dự báo tháng ${options.month}/${options.year}`;
      }
      if (key === "aiInsight.readyDescription") {
        return `Sẵn sàng phân tích dữ liệu tháng ${options.month}/${options.year}`;
      }
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    SHADOW_COLOR: "#000000",
    PRIMARY: "#EF5E83",
    ACTION_VOICE: "#A855F7",
    BG: "#FFFFFF",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, ...props }) => <View {...props}>{children}</View>,
  };
});

jest.mock("../AiInsightForecastResult", () => "AiInsightForecastResult");
jest.mock("../AiInsightStateBlock", () => "AiInsightStateBlock");
jest.mock("../../Forecast/ForecastMonthPicker", () => "ForecastMonthPicker");
jest.mock("../../ui/AppIcon", () => "AppIcon");

describe("AiInsightSheet", () => {
  const defaultProps = {
    availableMonths: [
      { month: 6, year: 2026, label: "Tháng 06/2026" },
      { month: 7, year: 2026, label: "Tháng 07/2026" },
    ],
    canGoNext: true,
    canGoPrev: true,
    error: null,
    goToMonth: jest.fn(),
    goToNextMonth: jest.fn(),
    goToPrevMonth: jest.fn(),
    isIdle: true,
    isPremium: true,
    loading: false,
    onAnalyze: jest.fn(),
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    onRetry: jest.fn(),
    result: null,
    selectedMonth: 6,
    selectedYear: 2026,
    visible: true,
  };

  beforeEach(() => {
    defaultProps.goToMonth.mockClear();
    defaultProps.onAnalyze.mockClear();
    defaultProps.onClose.mockClear();
    defaultProps.onConfirm.mockClear();
    defaultProps.onRetry.mockClear();
  });

  test("renders sheet title, subtitle and month picker correctly", () => {
    const { getByText, UNSAFE_getByType } = render(
      <AiInsightSheet {...defaultProps} />
    );

    expect(getByText("AI Insight")).toBeTruthy();
    expect(getByText("Phân tích tài chính cá nhân")).toBeTruthy();

    const picker = UNSAFE_getByType("ForecastMonthPicker");
    expect(picker.props.label).toBe("Tháng 06/2026");
  });

  test("displays premium required box when isPremium is false", () => {
    const { getByText, queryByText } = render(
      <AiInsightSheet {...defaultProps} isPremium={false} />
    );

    expect(getByText("Yêu cầu Premium")).toBeTruthy();
    expect(queryByText("Sẵn sàng phân tích")).toBeNull();
  });

  test("displays ready card when isPremium is true and isIdle is true", () => {
    const { getByText } = render(
      <AiInsightSheet {...defaultProps} isPremium={true} isIdle={true} />
    );

    expect(getByText("Sẵn sàng phân tích")).toBeTruthy();
    expect(getByText("Sẵn sàng phân tích dữ liệu tháng 6/2026")).toBeTruthy();
  });

  test("displays analyze button when premium, no data, and not loading", () => {
    const { getByText } = render(
      <AiInsightSheet {...defaultProps} result={null} loading={false} />
    );

    const analyzeBtn = getByText("Phân tích");
    expect(analyzeBtn).toBeTruthy();

    fireEvent.press(analyzeBtn);
    expect(defaultProps.onAnalyze).toHaveBeenCalledTimes(1);
  });

  test("renders state block with correct props", () => {
    const { UNSAFE_getByType } = render(
      <AiInsightSheet {...defaultProps} error="Lỗi" loading={true} />
    );

    const stateBlock = UNSAFE_getByType("AiInsightStateBlock");
    expect(stateBlock.props.error).toBe("Lỗi");
    expect(stateBlock.props.loading).toBe(true);
  });

  test("renders forecast result when has data and not loading/error", () => {
    const mockResult = { totalPredictedExpense: 1000 };
    const { UNSAFE_getByType, queryByText } = render(
      <AiInsightSheet {...defaultProps} result={mockResult} loading={false} error={null} />
    );

    const forecastResult = UNSAFE_getByType("AiInsightForecastResult");
    expect(forecastResult.props.result).toEqual(mockResult);
    expect(queryByText("Phân tích")).toBeNull(); // Analyze button is hidden
  });

  test("handles month selection via ForecastMonthPicker", () => {
    const { UNSAFE_getByType } = render(
      <AiInsightSheet {...defaultProps} />
    );

    const picker = UNSAFE_getByType("ForecastMonthPicker");
    picker.props.onSelect(7, 2026);

    expect(defaultProps.goToMonth).toHaveBeenCalledWith(7, 2026);
  });
});
