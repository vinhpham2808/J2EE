jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../Ai_Insight/AiInsightButton", () => ({ onPress, style }) => null);
jest.mock("../FinanceOverviewChart", () => ({ totalBalance, totalIncome, totalExpense, monthlySeries }) => null);
jest.mock("../DashboardSection", () => ({
  DashboardSectionHeader: ({ title, children }) => {
    const { Text } = require("react-native");
    return <><Text>{title}</Text>{children}</>;
  },
}));
jest.mock("../../../utils/layoutScale", () => ({ scale: (v) => v }));

import React from "react";
import { render } from "@testing-library/react-native";
import FinanceOverviewSection from "../FinanceOverviewSection";

describe("FinanceOverviewSection", () => {
  test("renders title", () => {
    const { getByText } = render(<FinanceOverviewSection />);
    expect(getByText("dashboardComponents.financeOverview")).toBeTruthy();
  });
});
