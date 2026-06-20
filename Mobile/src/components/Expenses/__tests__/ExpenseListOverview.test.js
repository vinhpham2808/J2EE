jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { EXPENSE: "#EF4444", TEXT: "#333", TEXT_SECONDARY: "#999" },
  useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999" }),
}));
jest.mock("../../common/IncomeExpenseChart", () => ({ data, title }) => null);
jest.mock("../../common/ShowMoreButton", () => ({ visible, expanded, onPress }) => null);

import React from "react";
import { render } from "@testing-library/react-native";
import ExpenseListOverview from "../ExpenseListOverview";

describe("ExpenseListOverview", () => {
  test("returns null when no expenses", () => {
    const { toJSON } = render(<ExpenseListOverview expenses={[]} />);
    expect(toJSON()).toBeNull();
  });

  test("renders list title with expenses", () => {
    const expenses = [{ id: 1, amount: 50000 }];
    const { getByText } = render(<ExpenseListOverview expenses={expenses} />);
    expect(getByText("expenseList.list")).toBeTruthy();
  });

  test("shows search results text when searchKeyword provided", () => {
    const expenses = [{ id: 1, amount: 50000 }];
    const { getByText } = render(<ExpenseListOverview expenses={expenses} searchKeyword="food" />);
    expect(getByText("expenseList.searchResults")).toBeTruthy();
  });
});
