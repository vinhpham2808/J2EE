import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BudgetCard from "../BudgetCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "budgetCard.budget": "Ngân sách",
        "budgetSummary.spent": "Đã chi",
        "budgetSummary.limit": "Hạn mức",
      };
      if (key.startsWith("forecastComponents.month")) {
        return "Tháng " + key.replace("forecastComponents.month", "");
      }
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#F0E2E6",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    EXPENSE: "#E76F51",
    ACTION_EXPENSE: "#F97316",
  }),
}));

jest.mock("../../../utils/budget", () => ({
  getBudgetVisual: jest.fn(() => ({
    bg: "#FFF3E0",
    border: "#FFB84D",
    color: "#FFB84D",
    label: "Cảnh báo",
  })),
}));

jest.mock("../../../utils/format", () => ({
  formatMoney: (val) => `$${val}`,
}));

jest.mock("../../../utils/categoryIcons", () => ({
  getIconColor: () => "#FF0000",
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

jest.mock("../../ui/AppIcon", () => "AppIcon");
jest.mock("../../ui/TransactionIcon", () => "TransactionIcon");

describe("BudgetCard", () => {
  const mockItem = {
    id: "1",
    amountLimit: 1000000,
    totalSpent: 850000,
    month: 6,
    year: 2026,
    categoryName: "Ăn uống",
    categoryIcon: "food",
  };

  const mockOnDelete = jest.fn();

  test("renders card info and formatting correctly", () => {
    const { getByText } = render(
      <BudgetCard item={mockItem} onDelete={mockOnDelete} />
    );

    expect(getByText("Ăn uống")).toBeTruthy();
    expect(getByText("Tháng 6 2026")).toBeTruthy();
    expect(getByText("$850000")).toBeTruthy();
    expect(getByText("$1000000")).toBeTruthy();
    expect(getByText("85%")).toBeTruthy();
    expect(getByText("Cảnh báo")).toBeTruthy();
  });

  test("calls onDelete when delete button is pressed", () => {
    const { getByRole } = render(
      <BudgetCard item={mockItem} onDelete={mockOnDelete} />
    );

    const deleteBtn = getByRole("button");
    fireEvent.press(deleteBtn);

    expect(mockOnDelete).toHaveBeenCalledWith("1");
  });
});
