jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { EXPENSE: "#EF4444", TEXT: "#333", TEXT_SECONDARY: "#999" },
  useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999" }),
}));
jest.mock("../ExpenseListOverview", () => () => null);
jest.mock("../ExpenseSummaryActions", () => () => null);
jest.mock("../ExpenseFilterTabs", () => ({ filterType, onChange }) => null);

import React from "react";
import { render } from "@testing-library/react-native";
import ExpenseListHeader from "../ExpenseListHeader";

describe("ExpenseListHeader", () => {
  test("renders without crash", () => {
    const { toJSON } = render(<ExpenseListHeader expenses={[]} filterType="current" onFilterChange={jest.fn()} />);
    expect(toJSON()).not.toBeNull();
  });
});
