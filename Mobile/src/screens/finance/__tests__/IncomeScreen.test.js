import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import IncomeScreen from "../IncomeScreen";
import useIncomeForm from "../../../hooks/useIncomeForm";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRoute = { name: "IncomeList", params: {} };

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => mockRoute,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "finance.income.editTitle": "Edit Income",
      "finance.income.addTitle": "Add Income",
      "finance.income.historyTitle": "Income History",
    }[key] || key),
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFF",
    TEXT: "#000",
    PRIMARY: "#ef5e83",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (s) => s,
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: () => 40,
  getSafeAreaBottom: () => 20,
  getSafeAreaContentStyle: () => ({ paddingTop: 40 }),
}));

// Mock subcomponents
jest.mock("../../../components/Incomes/IncomeEmptyState", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return () => (
    <View testID="income-empty-state">
      <Text>No Incomes</Text>
    </View>
  );
});

jest.mock("../../../components/Incomes/IncomeForm", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ form, title }) => (
    <View testID="income-form">
      <Text>{title}</Text>
      <TouchableOpacity testID="save-form-btn" onPress={() => form.onSave()} />
    </View>
  );
});

jest.mock("../../../components/Incomes/IncomeItem", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ item, onDelete, onEdit }) => (
    <View testID={`income-item-${item.id}`}>
      <Text>{item.description}</Text>
      <TouchableOpacity testID={`edit-income-btn-${item.id}`} onPress={() => onEdit(item)} />
      <TouchableOpacity testID={`delete-income-btn-${item.id}`} onPress={() => onDelete(item.id)} />
    </View>
  );
});

jest.mock("../../../components/Incomes/IncomeListHeader", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ filterType, incomes, isExporting, onAddIncome, onExport, onFilterChange, onVoiceResult, totalIncome }) => (
    <View testID="income-list-header">
      <Text>{`Total: ${totalIncome}`}</Text>
      <Text>{`Filter: ${filterType}`}</Text>
      <TouchableOpacity testID="add-income-btn" onPress={onAddIncome} />
      <TouchableOpacity testID="export-income-btn" onPress={onExport} />
      <TouchableOpacity testID="filter-change-btn" onPress={() => onFilterChange("newFilter")} />
      <TouchableOpacity testID="voice-result-btn" onPress={() => onVoiceResult("voice text")} />
    </View>
  );
});

jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ title }) => (
    <View testID="screen-back-header">
      <Text>{title}</Text>
    </View>
  );
});

// Mock hooks
const mockIncomeFormInstance = {
  onSave: jest.fn(),
};
jest.mock("../../../hooks/useIncomeForm", () => {
  return jest.fn((options) => {
    mockIncomeFormInstance.onSave = () => {
      if (options && options.onSaved) {
        options.onSaved();
      }
    };
    return mockIncomeFormInstance;
  });
});

const mockIncomesHook = {
  filterType: "all",
  handleExport: jest.fn(),
  handleVoiceResult: jest.fn((text, callback) => callback({ description: "Voice parse result" })),
  incomes: [],
  isExporting: false,
  onDelete: jest.fn(),
  onRefresh: jest.fn(),
  refreshing: false,
  setFilterType: jest.fn(),
  totalIncome: 10000000,
};
jest.mock("../../../hooks/useIncomes", () => () => mockIncomesHook);

describe("IncomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute = { name: "IncomeList", params: {} };
    mockIncomesHook.incomes = [];
    mockIncomesHook.filterType = "all";
    mockIncomesHook.totalIncome = 10000000;
  });

  describe("IncomeFormRoute (AddIncome route)", () => {
    it("renders IncomeForm with Add Title when initialData is not provided", () => {
      mockRoute = { name: "AddIncome", params: {} };
      const { getByTestId, getByText } = render(<IncomeScreen />);

      expect(getByTestId("income-form")).toBeTruthy();
      expect(getByText("Add Income")).toBeTruthy();
      expect(useIncomeForm).toHaveBeenCalledWith({
        initialData: undefined,
        onSaved: expect.any(Function),
      });
    });

    it("renders IncomeForm with Edit Title when initialData is provided", () => {
      const initialData = { id: "1", amount: 500000 };
      mockRoute = { name: "AddIncome", params: { initialData } };
      const { getByTestId, getByText } = render(<IncomeScreen />);

      expect(getByTestId("income-form")).toBeTruthy();
      expect(getByText("Edit Income")).toBeTruthy();
      expect(useIncomeForm).toHaveBeenCalledWith({
        initialData,
        onSaved: expect.any(Function),
      });
    });

    it("calls navigation.goBack() when form is saved", () => {
      mockRoute = { name: "AddIncome", params: {} };
      const { getByTestId } = render(<IncomeScreen />);

      fireEvent.press(getByTestId("save-form-btn"));
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe("IncomeListRoute (Default route)", () => {
    it("renders ScreenBackHeader, IncomeListHeader and empty state when incomes is empty", () => {
      const { getByTestId, getByText } = render(<IncomeScreen />);

      expect(getByTestId("screen-back-header")).toBeTruthy();
      expect(getByText("Income History")).toBeTruthy();
      expect(getByTestId("income-list-header")).toBeTruthy();
      expect(getByText("Total: 10000000")).toBeTruthy();
      expect(getByTestId("income-empty-state")).toBeTruthy();
    });

    it("renders list of incomes when incomes list is not empty", () => {
      mockIncomesHook.incomes = [
        { id: "1", description: "Salary", amount: 15000000 },
        { id: "2", description: "Bonus", amount: 2000000 },
      ];
      const { getByTestId, queryByTestId, getByText } = render(<IncomeScreen />);

      expect(queryByTestId("income-empty-state")).toBeNull();
      expect(getByTestId("income-item-1")).toBeTruthy();
      expect(getByTestId("income-item-2")).toBeTruthy();
      expect(getByText("Salary")).toBeTruthy();
      expect(getByText("Bonus")).toBeTruthy();
    });

    it("navigates to AddIncome screen when add income is pressed in list header", () => {
      const { getByTestId } = render(<IncomeScreen />);

      fireEvent.press(getByTestId("add-income-btn"));
      expect(mockNavigate).toHaveBeenCalledWith("AddIncome", undefined);
    });

    it("navigates to AddIncome screen with initialData when editing an income item", () => {
      mockIncomesHook.incomes = [{ id: "1", description: "Salary", amount: 15000000 }];
      const { getByTestId } = render(<IncomeScreen />);

      fireEvent.press(getByTestId("edit-income-btn-1"));
      expect(mockNavigate).toHaveBeenCalledWith("AddIncome", {
        initialData: mockIncomesHook.incomes[0],
      });
    });

    it("calls handleExport when export button is pressed", () => {
      const { getByTestId } = render(<IncomeScreen />);

      fireEvent.press(getByTestId("export-income-btn"));
      expect(mockIncomesHook.handleExport).toHaveBeenCalled();
    });

    it("calls setFilterType when filter changes", () => {
      const { getByTestId } = render(<IncomeScreen />);

      fireEvent.press(getByTestId("filter-change-btn"));
      expect(mockIncomesHook.setFilterType).toHaveBeenCalledWith("newFilter");
    });

    it("calls onDelete when delete button is pressed on an item", () => {
      mockIncomesHook.incomes = [{ id: "1", description: "Salary", amount: 15000000 }];
      const { getByTestId } = render(<IncomeScreen />);

      fireEvent.press(getByTestId("delete-income-btn-1"));
      expect(mockIncomesHook.onDelete).toHaveBeenCalledWith("1");
    });

    it("calls handleVoiceResult and navigates on voice text callback", () => {
      const { getByTestId } = render(<IncomeScreen />);

      fireEvent.press(getByTestId("voice-result-btn"));
      expect(mockIncomesHook.handleVoiceResult).toHaveBeenCalledWith("voice text", expect.any(Function));
      expect(mockNavigate).toHaveBeenCalledWith("AddIncome", {
        initialData: { description: "Voice parse result" },
      });
    });
  });
});
