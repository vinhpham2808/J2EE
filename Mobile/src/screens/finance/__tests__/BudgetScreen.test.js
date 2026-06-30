jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "finance.budget.title": "Ngân sách",
      "finance.budget.listTitle": "Danh sách ngân sách",
      "finance.budget.emptyTitle": "Không có ngân sách",
      "finance.budget.emptyDescription": "Bạn chưa tạo ngân sách nào",
    }[key] || key),
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: { TEXT: "#000", TEXT_SECONDARY: "#666" },
  useAppColors: () => ({
    BG: "#FFF",
    TEXT: "#000",
    TEXT_SECONDARY: "#666",
    PRIMARY: "#ef5e83",
    ROSE_MIST: "rgba(239,94,131,0.1)",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (s) => s,
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: () => 40,
  getSafeAreaBottom: () => 20,
}));

// Mock hook
const mockBudget = {
  budgets: [{ id: "1", name: "Food", limit: 3000000 }],
  summary: { totalLimit: 5000000 },
  refreshing: false,
  onRefresh: jest.fn(),
  onDelete: jest.fn(),
};
jest.mock("../../../hooks/useBudget", () => () => mockBudget);

// Mock subcomponents
jest.mock("../../../components/ui/AppIcon", () => "AppIcon");
jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return ({ title }) => React.createElement(View, { testID: "screen-header" }, React.createElement(Text, null, title));
});

jest.mock("../../../components/Budgets/BudgetCard", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ item, onDelete }) =>
    React.createElement(
      TouchableOpacity,
      { testID: `budget-card-${item.id}`, onPress: () => onDelete(item.id) },
      React.createElement(Text, null, item.name)
    );
});

jest.mock("../../../components/Budgets/BudgetForm", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return () => React.createElement(View, { testID: "budget-form" }, React.createElement(Text, null, "BudgetForm"));
});

jest.mock("../../../components/Budgets/BudgetSummary", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ summary }) =>
    React.createElement(
      View,
      { testID: "budget-summary" },
      React.createElement(Text, null, `SummaryLimit: ${summary.totalLimit}`)
    );
});

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BudgetScreen from "../BudgetScreen";

describe("BudgetScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBudget.budgets = [{ id: "1", name: "Food", limit: 3000000 }];
    mockBudget.summary = { totalLimit: 5000000 };
    mockBudget.refreshing = false;
  });

  it("renders BudgetScreen with elements and list of budgets successfully", () => {
    const { getByTestId, getByText, queryByText } = render(<BudgetScreen />);

    expect(getByTestId("screen-header")).toBeTruthy();
    expect(getByText("Ngân sách")).toBeTruthy();
    expect(getByTestId("budget-summary")).toBeTruthy();
    expect(getByText("SummaryLimit: 5000000")).toBeTruthy();
    expect(getByTestId("budget-form")).toBeTruthy();
    expect(getByTestId("budget-card-1")).toBeTruthy();
    expect(getByText("Food")).toBeTruthy();
    expect(getByText("Danh sách ngân sách")).toBeTruthy();
    expect(queryByText("Không có ngân sách")).toBeNull();
  });

  it("calls onDelete callback when delete is triggered on budget card", () => {
    const { getByTestId } = render(<BudgetScreen />);
    fireEvent.press(getByTestId("budget-card-1"));
    expect(mockBudget.onDelete).toHaveBeenCalledWith("1");
  });

  it("renders BudgetEmptyState when budgets list is empty", () => {
    mockBudget.budgets = [];
    const { queryByTestId, getByText, queryByText } = render(<BudgetScreen />);

    expect(queryByTestId("budget-card-1")).toBeNull();
    expect(getByText("Không có ngân sách")).toBeTruthy();
    expect(getByText("Bạn chưa tạo ngân sách nào")).toBeTruthy();
    expect(queryByText("Danh sách ngân sách")).toBeNull();
  });
});
