import React from "react";
import { render } from "@testing-library/react-native";
import BudgetSummary from "../BudgetSummary";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "budgetSummary.monthlyBudget": "Ngân sách tháng",
        "budgetSummary.limit": "Hạn mức:",
        "budgetSummary.spent": "Đã chi:",
      };
      if (key === "budgetSummary.itemsNearLimit") {
        return `${options?.count || 0} mục sắp chạm hạn mức`;
      }
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatMoney: (val) => `$${val}`,
}));

describe("BudgetSummary", () => {
  const mockSummary = {
    totalLimit: 5000000,
    totalSpent: 1200000,
    warningCount: 2,
  };

  test("renders all text labels correctly", () => {
    const { getByText } = render(<BudgetSummary summary={mockSummary} />);

    expect(getByText("Ngân sách tháng")).toBeTruthy();
    expect(getByText("Hạn mức: $5000000")).toBeTruthy();
    expect(getByText("Đã chi: $1200000")).toBeTruthy();
    expect(getByText("2 mục sắp chạm hạn mức")).toBeTruthy();
  });
});
