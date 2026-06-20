jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("react-native-svg", () => {
  const React = require("react");
  const Svg = ({ children, width, height, viewBox, style }) => React.createElement(React.Fragment, null, children);
  return {
    __esModule: true,
    default: Svg,
    Svg: Svg,
    Path: () => null,
    G: ({ children }) => React.createElement(React.Fragment, null, children),
    Defs: () => null,
    LinearGradient: () => null,
    Stop: () => null,
    Text: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});
jest.mock("../../../constants/colors", () => ({
  COLORS: { INCOME: "#22C55E", EXPENSE: "#EF4444", PRIMARY: "#E8597A" },
  useAppColors: () => ({ INCOME: "#22C55E", EXPENSE: "#EF4444", PRIMARY: "#E8597A", TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#B8A6AC", CARD: "#FFF", CARD_BORDER: "#EEE", BG: "#F5F5F5", ROSE_MIST: "#FFE4E9" }),
}));
jest.mock("../../../utils/financeStats", () => ({
  buildRecentMonthKeys: () => ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"],
  formatMonthKeyLabel: (k) => k ? "Month " + k : "",
  formatMonthShortLabel: (k) => k ? k.slice(-2) : "",
  toMonthKey: () => "2026-06",
}));
jest.mock("../../../utils/format", () => ({ formatMoney: (v) => String(v) }));

import React from "react";
import { render } from "@testing-library/react-native";
import FinanceOverviewChart from "../FinanceOverviewChart";

describe("FinanceOverviewChart", () => {
  test("renders empty state when no data", () => {
    const { getByText } = render(<FinanceOverviewChart totalBalance={0} totalIncome={0} totalExpense={0} />);
    expect(getByText("dashboardComponents.noStatsThisMonth")).toBeTruthy();
  });

  test("renders month label", () => {
    const { getByText } = render(<FinanceOverviewChart totalBalance={1000000} totalIncome={5000000} totalExpense={3000000} />);
    expect(getByText(/Month/)).toBeTruthy();
  });
});
