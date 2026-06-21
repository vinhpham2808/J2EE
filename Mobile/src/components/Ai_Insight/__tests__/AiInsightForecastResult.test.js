import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AiInsightForecastResult from "../AiInsightForecastResult";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "aiInsightForecastResult.forecastByCategory": "Dự báo theo danh mục",
        "aiInsightForecastResult.aiAnalysis": "Phân tích từ AI",
        "aiInsightForecastResult.reAnalyze": "Phân tích lại",
        "aiInsightForecastResult.confirm": "Xác nhận",
        "aiInsightForecastResult.categoriesAtRisk": "Hạng mục có rủi ro",
        "aiInsightForecastResult.expected": "Dự kiến:",
      };
      if (key === "aiInsightForecastResult.forecastMonth") {
        return `Dự báo tháng ${options.month}/${options.year}`;
      }
      if (key === "aiInsightForecastResult.totalExpectedExpense") {
        return "Tổng chi tiêu dự kiến";
      }
      if (key === "aiInsightForecastResult.anomaliesCount") {
        return `${options.count} cảnh báo bất thường`;
      }
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    EXPENSE_COLOR: "#EF4444",
    WARNING_LIGHT: "#FFF8E1",
    WARNING: "#FFE082",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    CARD: "#FFFFFF",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

jest.mock("../aiInsightFormatters", () => ({
  formatInsightMoney: (val) => `$${val}`,
  getTrendColor: () => "#FF0000",
  getTrendText: (val) => `Trend: ${val}`,
}));

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, ...props }) => <View {...props}>{children}</View>,
  };
});

jest.mock("../../ui/AppIcon", () => "AppIcon");

describe("AiInsightForecastResult", () => {
  const mockResult = {
    month: 6,
    year: 2026,
    totalPredictedExpense: 4200000,
    topRiskCategory: {
      categoryName: "Ăn uống",
      predictedAmount: 1800000,
      trend: "UP",
    },
    anomalies: [
      { categoryName: "Giải trí", message: "Tăng bất thường" },
    ],
    categories: [
      { categoryId: 1, categoryName: "Ăn uống", predictedAmount: 1800000, trend: "UP" },
      { categoryId: 2, categoryName: "Mua sắm", predictedAmount: 1200000, trend: "DOWN" },
    ],
    narrative: "Chi tiêu của bạn trong tháng này có xu hướng tăng nhẹ.",
  };

  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
    mockOnRetry.mockClear();
  });

  test("renders null when result is undefined", () => {
    const { toJSON } = render(
      <AiInsightForecastResult
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onRetry={mockOnRetry}
        result={undefined}
      />
    );
    expect(toJSON()).toBeNull();
  });

  test("renders all results blocks correctly when provided", () => {
    const { getByText, getAllByText } = render(
      <AiInsightForecastResult
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onRetry={mockOnRetry}
        result={mockResult}
      />
    );

    expect(getByText("Dự báo tháng 6/2026")).toBeTruthy();
    expect(getByText("Tổng chi tiêu dự kiến")).toBeTruthy();
    expect(getByText("$4200000")).toBeTruthy();

    // Risk Card
    expect(getByText("Hạng mục có rủi ro")).toBeTruthy();
    expect(getAllByText("Ăn uống").length).toBe(2);
    expect(getByText("Dự kiến: $1800000 · Trend: UP")).toBeTruthy();

    // Anomalies
    expect(getByText("1 cảnh báo bất thường")).toBeTruthy();

    // Category lists
    expect(getByText("Dự báo theo danh mục")).toBeTruthy();
    expect(getByText("Mua sắm")).toBeTruthy();
    expect(getByText("$1200000")).toBeTruthy();

    // Narrative
    expect(getByText("Phân tích từ AI")).toBeTruthy();
    expect(getByText("Chi tiêu của bạn trong tháng này có xu hướng tăng nhẹ.")).toBeTruthy();
  });

  test("triggers callbacks correctly when buttons are pressed", () => {
    const { getByText } = render(
      <AiInsightForecastResult
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onRetry={mockOnRetry}
        result={mockResult}
      />
    );

    const reAnalyzeBtn = getByText("Phân tích lại");
    fireEvent.press(reAnalyzeBtn);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);

    const confirmBtn = getByText("Xác nhận");
    fireEvent.press(confirmBtn);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});
