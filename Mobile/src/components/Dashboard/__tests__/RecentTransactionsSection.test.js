jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { TEXT: "#333", },

  useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#B8A6AC" }),
}));
jest.mock("../../../utils/layoutScale", () => ({ clampScale: (v) => v, scale: (v) => v }));
jest.mock("../../../utils/dashboard", () => ({ formatRelativeTime: (d) => d ? "2h ago" : "" }));
jest.mock("../../ui/TransactionIcon", () => ({ iconValue, containerSize, size, style }) => null);
jest.mock("../../ui/AmountText", () => ({ value, type, showSign, style }) => null);

import React from "react";
import { render } from "@testing-library/react-native";
import RecentTransactionsSection from "../RecentTransactionsSection";

describe("RecentTransactionsSection", () => {
  const transactions = [
    { id: "1", name: "Lunch", amount: 50000, type: "EXPENSE", icon: "food", createdAt: new Date().toISOString() },
    { id: "2", name: "Salary", amount: 5000000, type: "INCOME", icon: "cash", createdAt: new Date().toISOString() },
  ];

  test("renders section title", () => {
    const { getByText } = render(<RecentTransactionsSection transactions={[]} />);
    expect(getByText("dashboardComponents.recentTransactions")).toBeTruthy();
  });

  test("renders transaction rows", () => {
    const { getByText } = render(<RecentTransactionsSection transactions={transactions} />);
    expect(getByText("Lunch")).toBeTruthy();
    expect(getByText("Salary")).toBeTruthy();
  });

  test("renders empty state when no transactions", () => {
    const { getByText } = render(<RecentTransactionsSection transactions={[]} />);
    expect(getByText("dashboardComponents.noRecentTransactions")).toBeTruthy();
  });
});
