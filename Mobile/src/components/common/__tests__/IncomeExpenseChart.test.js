jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { CARD: "#FFF", CARD_BORDER: "#EEE", TEXT_SECONDARY: "#999" },
  useAppColors: () => ({ CARD: "#FFF", CARD_BORDER: "#EEE", TEXT_SECONDARY: "#999" }),
}));
jest.mock("react-native-chart-kit", () => ({ LineChart: ({ data, width, height }) => null }));

import React from "react";
import { render } from "@testing-library/react-native";
import IncomeExpenseChart from "../IncomeExpenseChart";

describe("IncomeExpenseChart", () => {
  test("renders empty state when no data", () => {
    const { getByText } = render(<IncomeExpenseChart />);
    expect(getByText("chartComponents.noData")).toBeTruthy();
  });

  test("renders empty state when empty array", () => {
    const { getByText } = render(<IncomeExpenseChart data={[]} />);
    expect(getByText("chartComponents.noData")).toBeTruthy();
  });

  test("renders title when data provided", () => {
    const data = [{ date: "2026-06-01", amount: 500 }];
    const { getByText } = render(<IncomeExpenseChart data={data} title="Income vs Expense" />);
    expect(getByText("Income vs Expense")).toBeTruthy();
  });

  test("renders chart with data", () => {
    const data = [
      { date: "2026-06-01", amount: 1000 },
      { date: "2026-06-02", amount: 2000 },
    ];
    const { queryByText } = render(<IncomeExpenseChart data={data} title="Chart" />);
    expect(queryByText("chartComponents.noData")).toBeNull();
  });

  test("groups data by date label", () => {
    const data = [
      { date: "2026-06-01T00:00:00", amount: 1000 },
      { date: "2026-06-01T12:00:00", amount: 500 },
    ];
    const { queryByText } = render(<IncomeExpenseChart data={data} title="Chart" />);
    expect(queryByText("chartComponents.noData")).toBeNull();
  });

  test("handles data without date field", () => {
    const data = [{ amount: 1000 }];
    const { queryByText } = render(<IncomeExpenseChart data={data} title="Chart" />);
    expect(queryByText("chartComponents.noData")).toBeTruthy();
  });

  test("handles data with invalid date parts", () => {
    const data = [{ date: "invalid", amount: 1000 }];
    const { queryByText } = render(<IncomeExpenseChart data={data} title="Chart" />);
    expect(queryByText("chartComponents.noData")).toBeTruthy();
  });

  test("uses custom colorPrimary", () => {
    const data = [{ date: "2026-06-01", amount: 500 }];
    const { queryByText } = render(<IncomeExpenseChart data={data} title="Chart" colorPrimary="#FF0000" />);
    expect(queryByText("chartComponents.noData")).toBeNull();
  });
});
