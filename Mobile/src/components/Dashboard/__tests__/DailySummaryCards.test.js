jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({ SURFACE: "#FFF", BORDER: "#EEE", EXPENSE: "#EF4444", ACTION_EXPENSE: "#EF4444", INCOME: "#22C55E", ACTION_INCOME: "#22C55E" }),
}));
jest.mock("../../ui/AmountText", () => ({ value, type, style }) => null);

import React from "react";
import { render } from "@testing-library/react-native";
import DailySummaryCards from "../DailySummaryCards";

describe("DailySummaryCards", () => {
  test("renders expense and income labels", () => {
    const { getByText } = render(<DailySummaryCards totalIncome={1000000} totalExpense={500000} />);
    expect(getByText("dashboardComponents.expenseType")).toBeTruthy();
    expect(getByText("dashboardComponents.incomeType")).toBeTruthy();
  });

  test("renders with zero values", () => {
    const { getByText } = render(<DailySummaryCards />);
    expect(getByText("dashboardComponents.expenseType")).toBeTruthy();
    expect(getByText("dashboardComponents.incomeType")).toBeTruthy();
  });
});
