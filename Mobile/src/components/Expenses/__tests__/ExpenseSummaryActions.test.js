jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { CARD: "#FFF", CARD_BORDER: "#EEE", PRIMARY: "#E8597A", EXPENSE: "#EF4444", TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#999", BG: "#F5F5F5", PRIMARY_LIGHT: "#FFD4DC", WHITE: "#FFF", ROSE_MIST: "#FFE4E9" },
  useAppColors: () => ({ CARD: "#FFF", CARD_BORDER: "#EEE", PRIMARY: "#E8597A", EXPENSE: "#EF4444", TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#999", BG: "#F5F5F5", PRIMARY_LIGHT: "#FFD4DC", WHITE: "#FFF", ROSE_MIST: "#FFE4E9" }),
}));
jest.mock("../../../utils/format", () => ({ formatMoney: (v) => String(v) }));
jest.mock("../../common/VoiceInputButton", () => ({ iconSource, noBackground, onResult }) => null);
jest.mock("../../../assets/accessories/mic.png", () => "mic.png");
jest.mock("../../../assets/accessories/camera.png", () => "camera.png");

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ExpenseSummaryActions from "../ExpenseSummaryActions";

describe("ExpenseSummaryActions", () => {
  test("renders total expense and add button", () => {
    const { getByText } = render(<ExpenseSummaryActions totalExpense={100000} expenseCount={5} onAddExpense={jest.fn()} onExport={jest.fn()} />);
    expect(getByText("100000")).toBeTruthy();
    expect(getByText(/expenseSummary.addExpense/)).toBeTruthy();
  });

  test("calls onAddExpense when add pressed", () => {
    const onAddExpense = jest.fn();
    const { getByText } = render(<ExpenseSummaryActions totalExpense={0} expenseCount={0} onAddExpense={onAddExpense} onExport={jest.fn()} />);
    fireEvent.press(getByText(/expenseSummary.addExpense/));
    expect(onAddExpense).toHaveBeenCalled();
  });

  test("calls onExport when export pressed", () => {
    const onExport = jest.fn();
    const { getByText } = render(<ExpenseSummaryActions totalExpense={0} expenseCount={0} filterType="all" onAddExpense={jest.fn()} onExport={onExport} />);
    fireEvent.press(getByText("expenseSummary.downloadAll"));
    expect(onExport).toHaveBeenCalled();
  });

  test("shows generating state when isExporting", () => {
    const { getByText, queryByText } = render(<ExpenseSummaryActions totalExpense={0} expenseCount={0} isExporting onAddExpense={jest.fn()} onExport={jest.fn()} />);
    expect(getByText("expenseSummary.generating")).toBeTruthy();
    expect(queryByText("expenseSummary.downloadAll")).toBeNull();
  });

  test("shows download month text for current filter", () => {
    const { getByText } = render(<ExpenseSummaryActions totalExpense={0} expenseCount={0} filterType="current" onAddExpense={jest.fn()} onExport={jest.fn()} />);
    expect(getByText("expenseSummary.downloadMonth")).toBeTruthy();
  });

  test("shows premium hint for non-premium", () => {
    const { getByText } = render(<ExpenseSummaryActions totalExpense={0} expenseCount={0} isPremium={false} onAddExpense={jest.fn()} onExport={jest.fn()} />);
    expect(getByText("expenseSummary.premiumHint")).toBeTruthy();
  });

  test("transaction count displays correctly", () => {
    const { getByText } = render(<ExpenseSummaryActions totalExpense={0} expenseCount={3} onAddExpense={jest.fn()} onExport={jest.fn()} />);
    expect(getByText(/3/)).toBeTruthy();
  });
});
