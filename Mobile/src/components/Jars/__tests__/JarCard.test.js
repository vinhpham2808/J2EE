import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import JarCard from "../JarCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "jarCard.target": "Mục tiêu:",
        "jarCard.reachedTarget": "Đạt mục tiêu",
        "jarCard.belowTarget": "Dưới mục tiêu",
        "jarCard.actualRatio": "Tỷ lệ thực tế:",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    PRIMARY: "#EF5E83",
    INCOME: "#10B981",
    INCOME_LIGHT: "#E6F4EA",
    WARNING: "#F59E0B",
    WARNING_LIGHT: "#FEF7E0",
    EXPENSE: "#EF4444",
  }),
}));

jest.mock("../../../utils/jar", () => ({
  formatJarMoney: (val) => `${val} VND`,
  getJarActualPercent: (current, total) => total > 0 ? ((current / total) * 100).toFixed(1) : "0.0",
  getJarProgressWidth: (current, total) => total > 0 ? Math.min((Math.abs(current) / total) * 100, 100) : 0,
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

describe("JarCard", () => {
  const mockItem = {
    name: "Tiết kiệm",
    icon: "🐖",
    color: "#10B981",
    targetPercentage: 30,
    currentBalance: 3000000,
  };
  const totalBalance = 10000000;
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders normal jar card, actual ratio and target info correctly", () => {
    const { getByText } = render(
      <JarCard item={mockItem} totalBalance={totalBalance} onPress={mockOnPress} />
    );

    expect(getByText("Tiết kiệm")).toBeTruthy();
    expect(getByText("🐖")).toBeTruthy();
    expect(getByText("Mục tiêu: 30%")).toBeTruthy();
    expect(getByText("30.0% / 30%")).toBeTruthy();
    expect(getByText("3000000 VND")).toBeTruthy();
  });

  test("displays 'Reached Target' status badge when actual percent is >= target", () => {
    const { getByText } = render(
      <JarCard item={mockItem} totalBalance={totalBalance} onPress={mockOnPress} />
    );
    expect(getByText("Đạt mục tiêu")).toBeTruthy();
  });

  test("displays 'Below Target' status badge when actual percent is < target", () => {
    const lowBalanceItem = { ...mockItem, currentBalance: 2000000 }; // 20% of 10M, target is 30%
    const { getByText } = render(
      <JarCard item={lowBalanceItem} totalBalance={totalBalance} onPress={mockOnPress} />
    );
    expect(getByText("Dưới mục tiêu")).toBeTruthy();
  });

  test("calls onPress when pressed", () => {
    const { getByText } = render(
      <JarCard item={mockItem} totalBalance={totalBalance} onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText("Tiết kiệm"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test("handles negative currentBalance by styling balance text as EXPENSE color", () => {
    const negativeBalanceItem = { ...mockItem, currentBalance: -500000 };
    const { getByText } = render(
      <JarCard item={negativeBalanceItem} totalBalance={totalBalance} onPress={mockOnPress} />
    );

    const balanceText = getByText("-500000 VND");
    expect(balanceText).toBeTruthy();
    expect(balanceText.props.style).toContainEqual(expect.objectContaining({ color: "#EF4444" }));
  });
});
