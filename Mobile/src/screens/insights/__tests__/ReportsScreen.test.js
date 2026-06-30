const mockRoute = { name: "Reports" };
jest.mock("@react-navigation/native", () => ({
  useRoute: () => mockRoute,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("../../../contexts/AuthContext", () => {
  const React = require("react");
  const AuthContext = React.createContext({ user: { createdAt: "2026-01-01" } });
  return {
    AuthContext,
  };
});

const mockMonthlyReport = {
  selectedMonth: 6,
  selectedYear: 2026,
  report: {
    netWorth: 10000000,
    categoryBreakdown: [{ id: "1", name: "Food", amount: 2000000 }],
    advice: "Keep saving",
    budgetsOnTrack: 3,
    totalBudgets: 5,
    completedGoalsThisMonth: 1,
  },
  loading: false,
  error: null,
  monthOptions: [
    { label: "Tháng 6, 2026", month: 6, year: 2026 },
    { label: "Tháng 5, 2026", month: 5, year: 2026 },
  ],
  monthPickerLabel: "Tháng 6, 2026",
  selectMonth: jest.fn(),
};

jest.mock("../../../hooks/useMonthlyReport", () => ({
  __esModule: true,
  default: () => mockMonthlyReport,
}));

jest.mock("../../../services/expenseService", () => ({
  fetchExpensesByFilter: jest.fn(() => Promise.resolve([{ id: "exp1", amount: 1000000 }])),
}));

jest.mock("../../../services/incomeService", () => ({
  fetchIncomesByFilter: jest.fn(() => Promise.resolve([{ id: "inc1", amount: 2000000 }])),
}));

jest.mock("../../../utils/financeStats", () => ({
  buildReportChartSeries: jest.fn(({ range }) => {
    return {
      title: `Chart Title (${range})`,
      subtitle: `Chart Subtitle (${range})`,
      labels: ["L1", "L2", "L3"],
      expense: [
        { key: "1", value: 1000000, summaryLabel: "W1" },
        { key: "2", value: 2000000, summaryLabel: "W2" },
        { key: "3", value: 3000000, summaryLabel: "W3" },
      ],
      income: [
        { key: "1", value: 4000000, summaryLabel: "W1" },
        { key: "2", value: 5000000, summaryLabel: "W2" },
        { key: "3", value: 6000000, summaryLabel: "W3" },
      ],
      expenseTotal: 6000000,
      incomeTotal: 15000000,
      totalLabel: "Total Label",
    };
  }),
}));

jest.mock("react-native-chart-kit", () => ({
  BarChart: ({ data }) => {
    const React = require("react");
    const { View, Text } = require("react-native");
    return (
      <View testID="BarChart">
        <Text>Chart Data Labels: {data.labels.join(",")}</Text>
        <Text>Chart Data Set: {data.datasets[0].data.join(",")}</Text>
      </View>
    );
  },
}));

jest.mock("../../../components/Forecast/ForecastMonthPicker", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ label, visible, onOpen, onSelect, onClose }) => (
    <View testID="ForecastMonthPicker">
      <Text>Picker Label: {label}</Text>
      <Text>Picker Visible: {visible ? "yes" : "no"}</Text>
      <TouchableOpacity testID="picker-open" onPress={onOpen} />
      <TouchableOpacity testID="picker-select" onPress={() => onSelect(5, 2026)} />
      <TouchableOpacity testID="picker-close" onPress={onClose} />
    </View>
  );
});

jest.mock("../../../components/Report/ReportMetricCard", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ report }) => (
    <View testID="ReportMetricCard">
      <Text>Report Net Worth: {report.netWorth}</Text>
    </View>
  );
});

jest.mock("../../../components/Report/CategoryBreakdownCard", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ categories }) => (
    <View testID="CategoryBreakdownCard">
      <Text>Categories Count: {categories?.length}</Text>
    </View>
  );
});

jest.mock("../../../components/Report/ReportAdviceCard", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ report }) => (
    <View testID="ReportAdviceCard">
      <Text>Advice: {report.advice}</Text>
    </View>
  );
});

jest.mock("../../../components/Report/BudgetGoalProgressCard", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ budgetsOnTrack, totalBudgets, completedGoalsThisMonth }) => (
    <View testID="BudgetGoalProgressCard">
      <Text>Budgets: {budgetsOnTrack}/{totalBudgets}</Text>
      <Text>Goals: {completedGoalsThisMonth}</Text>
    </View>
  );
});

jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ title }) => (
    <View testID="ScreenBackHeader">
      <Text>Header Title: {title}</Text>
    </View>
  );
});

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, name);
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock("i18next", () => ({
  language: "vi-VN",
  t: (key) => key,
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    APP_BACKGROUND: "#F2F2F7",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E5EA",
    TEXT: "#000000",
    TEXT_SECONDARY: "#8E8E93",
    TEXT_MUTED: "#AEAEB2",
    PRIMARY: "#007AFF",
    SHADOW_COLOR: "#000000",
  }),
}));

import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import ReportsScreen from "../ReportsScreen";
import { fetchExpensesByFilter } from "../../../services/expenseService";
import { fetchIncomesByFilter } from "../../../services/incomeService";
import { buildReportChartSeries } from "../../../utils/financeStats";

describe("ReportsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute.name = "Reports";
    mockMonthlyReport.loading = false;
    mockMonthlyReport.error = null;
    mockMonthlyReport.report = {
      netWorth: 10000000,
      categoryBreakdown: [{ id: "1", name: "Food", amount: 2000000 }],
      advice: "Keep saving",
      budgetsOnTrack: 3,
      totalBudgets: 5,
      completedGoalsThisMonth: 1,
    };
  });

  it("renders loading indicator when loading is true", async () => {
    mockMonthlyReport.loading = true;
    mockMonthlyReport.report = null;

    const { getByText } = render(<ReportsScreen />);
    expect(getByText("report.generating")).toBeTruthy();
  });

  it("renders error state when error is present", async () => {
    mockMonthlyReport.error = "Error fetching report";
    mockMonthlyReport.report = null;

    const { getByText } = render(<ReportsScreen />);
    expect(getByText("Error fetching report")).toBeTruthy();
  });

  it("renders empty state when report is null", async () => {
    mockMonthlyReport.report = null;

    const { getByText } = render(<ReportsScreen />);
    expect(getByText("report.noData")).toBeTruthy();
  });

  it("renders report content and subcomponents successfully when report is present", async () => {
    const { getByTestId, getByText } = render(<ReportsScreen />);

    // Wait for internal API promises to resolve
    await waitFor(() => {
      expect(fetchExpensesByFilter).toHaveBeenCalledWith("all");
    });
    expect(fetchIncomesByFilter).toHaveBeenCalledWith("all");

    expect(getByTestId("ScreenBackHeader")).toBeTruthy();
    expect(getByText("Header Title: report.title")).toBeTruthy();
    expect(getByTestId("ForecastMonthPicker")).toBeTruthy();
    expect(getByTestId("ReportMetricCard")).toBeTruthy();
    expect(getByText("Report Net Worth: 10000000")).toBeTruthy();
    expect(getByTestId("CategoryBreakdownCard")).toBeTruthy();
    expect(getByText("Categories Count: 1")).toBeTruthy();
    expect(getByTestId("ReportAdviceCard")).toBeTruthy();
    expect(getByText("Advice: Keep saving")).toBeTruthy();
    expect(getByTestId("BudgetGoalProgressCard")).toBeTruthy();
    expect(getByText("Budgets: 3/5")).toBeTruthy();
    expect(getByText("Goals: 1")).toBeTruthy();
  });

  it("does not render ScreenBackHeader when route name is CategoryMain", async () => {
    mockRoute.name = "CategoryMain";

    const { queryByTestId } = render(<ReportsScreen />);

    expect(queryByTestId("ScreenBackHeader")).toBeNull();
  });

  it("tests month picker open, select, and close callbacks", async () => {
    const { getByTestId, getByText } = render(<ReportsScreen />);

    // Initially closed
    expect(getByText("Picker Visible: no")).toBeTruthy();

    // Open picker
    await act(async () => {
      fireEvent.press(getByTestId("picker-open"));
    });
    expect(getByText("Picker Visible: yes")).toBeTruthy();

    // Close picker
    await act(async () => {
      fireEvent.press(getByTestId("picker-close"));
    });
    expect(getByText("Picker Visible: no")).toBeTruthy();

    // Reopen picker
    await act(async () => {
      fireEvent.press(getByTestId("picker-open"));
    });
    expect(getByText("Picker Visible: yes")).toBeTruthy();

    // Select month
    await act(async () => {
      fireEvent.press(getByTestId("picker-select"));
    });
    expect(mockMonthlyReport.selectMonth).toHaveBeenCalledWith(5, 2026);
    expect(getByText("Picker Visible: no")).toBeTruthy();
  });

  it("tests clicking segment buttons for chart range and verifies tab changes", async () => {
    const { getByText } = render(<ReportsScreen />);

    // Verify initial range is month
    expect(buildReportChartSeries).toHaveBeenLastCalledWith(
      expect.objectContaining({ range: "month" })
    );

    // Click week range
    await act(async () => {
      fireEvent.press(getByText("report.week"));
    });
    expect(buildReportChartSeries).toHaveBeenLastCalledWith(
      expect.objectContaining({ range: "week" })
    );

    // Click sixMonths range
    await act(async () => {
      fireEvent.press(getByText("report.sixMonths"));
    });
    expect(buildReportChartSeries).toHaveBeenLastCalledWith(
      expect.objectContaining({ range: "sixMonths" })
    );
  });
});
