jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "finance.expense.editTitle": "Chỉnh sửa khoản chi",
      "finance.expense.addTitle": "Thêm khoản chi",
      "finance.expense.historyTitle": "Lịch sử chi tiêu",
    }[key] || key),
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFF",
    TEXT: "#000",
    PRIMARY: "#ef5e83",
    APP_BACKGROUND: "#FFF",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (s) => s,
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: () => 40,
  getSafeAreaBottom: () => 20,
  getSafeAreaContentStyle: (insets) => ({ paddingTop: insets.top, paddingBottom: insets.bottom }),
}));

// Mock AuthContext with default FREE plan
const mockContextValue = { user: { subscriptionPlan: "FREE" } };
jest.mock("../../../contexts/AuthContext", () => {
  const React = require("react");
  const AuthContext = React.createContext({
    get user() {
      return mockContextValue.user;
    },
  });
  return {
    AuthContext,
  };
});

// Navigation mocks
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRoute = { name: "ExpenseScreen", params: undefined };

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => mockRoute,
}));

// Mock hooks
const mockHandleScanReceipt = jest.fn();
const mockUseExpenseReceiptImport = jest.fn(() => ({
  handleScanReceipt: mockHandleScanReceipt,
  isScanning: false,
}));
jest.mock("../../../hooks/useExpenseReceiptImport", () => (options) => mockUseExpenseReceiptImport(options));

const mockUseExpenseForm = jest.fn((options) => ({
  onSaved: options?.onSaved,
}));
jest.mock("../../../hooks/useExpenseForm", () => (options) => mockUseExpenseForm(options));

const mockExpensesData = {
  expenses: [{ id: "e1", title: "Lunch", amount: 50000 }],
  filterType: "ALL",
  handleExport: jest.fn(),
  handleVoiceResult: jest.fn(),
  isExporting: false,
  onDelete: jest.fn(),
  onRefresh: jest.fn(),
  refreshing: false,
  setFilterType: jest.fn(),
  totalExpense: 50000,
};
jest.mock("../../../hooks/useExpenses", () => () => mockExpensesData);

// Mock subcomponents
jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return ({ title }) => (
    <View testID="screen-header">
      <Text>{title}</Text>
    </View>
  );
});

jest.mock("../../../components/Expenses/ExpenseEmptyState", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return () => (
    <View testID="expense-empty-state">
      <Text>Empty State</Text>
    </View>
  );
});

jest.mock("../../../components/Expenses/ExpenseForm", () => {
  const React = require("react");
  const { Button, Text, View } = require("react-native");
  return ({ form, onImportReceipt, title, isScanning, isPremium }) => (
    <View testID="expense-form">
      <Text>Title: {title}</Text>
      <Text>Premium: {isPremium ? "Yes" : "No"}</Text>
      <Text>Scanning: {isScanning ? "Yes" : "No"}</Text>
      <Button title="Import Receipt" onPress={onImportReceipt} testID="form-import-receipt-btn" />
      <Button title="Trigger Save" onPress={form?.onSaved} testID="form-save-btn" />
    </View>
  );
});

jest.mock("../../../components/Expenses/ExpenseItem", () => {
  const React = require("react");
  const { Button, Text, View } = require("react-native");
  return ({ item, onDelete, onEdit }) => (
    <View testID={`expense-item-${item.id}`}>
      <Text>Expense: {item.title}</Text>
      <Button title="Delete" onPress={() => onDelete(item.id)} testID={`delete-btn-${item.id}`} />
      <Button title="Edit" onPress={() => onEdit(item)} testID={`edit-btn-${item.id}`} />
    </View>
  );
});

jest.mock("../../../components/Expenses/ExpenseListHeader", () => {
  const React = require("react");
  const { Button, Text, View } = require("react-native");
  return ({
    expenses,
    filterType,
    isExporting,
    isPremium,
    isScanning,
    onAddExpense,
    onExport,
    onFilterChange,
    onScanReceipt,
    onVoiceResult,
    totalExpense,
  }) => (
    <View testID="expense-list-header">
      <Text>Total Expense: {totalExpense}</Text>
      <Text>Filter: {filterType}</Text>
      <Text>Premium: {isPremium ? "Yes" : "No"}</Text>
      <Text>Scanning: {isScanning ? "Yes" : "No"}</Text>
      <Text>Exporting: {isExporting ? "Yes" : "No"}</Text>
      <Button title="Add" onPress={onAddExpense} testID="hdr-add-btn" />
      <Button title="Export" onPress={onExport} testID="hdr-export-btn" />
      <Button title="Filter" onPress={() => onFilterChange("FOOD")} testID="hdr-filter-btn" />
      <Button title="Scan" onPress={onScanReceipt} testID="hdr-scan-btn" />
      <Button title="Voice" onPress={() => onVoiceResult("Voice Text")} testID="hdr-voice-btn" />
    </View>
  );
});

import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import ExpenseScreen from "../ExpenseScreen";

describe("ExpenseScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute = { name: "ExpenseScreen", params: undefined };
    mockContextValue.user = { subscriptionPlan: "FREE" };

    mockExpensesData.expenses = [{ id: "e1", title: "Lunch", amount: 50000 }];
    mockExpensesData.filterType = "ALL";
    mockExpensesData.isExporting = false;
    mockExpensesData.refreshing = false;
    mockExpensesData.totalExpense = 50000;

    mockUseExpenseReceiptImport.mockImplementation(() => ({
      handleScanReceipt: mockHandleScanReceipt,
      isScanning: false,
    }));
  });

  describe("ExpenseListRoute (default route name)", () => {
    it("renders ExpenseScreen successfully with list of expenses", () => {
      const { getByTestId, getByText, queryByTestId } = render(<ExpenseScreen />);

      expect(getByTestId("screen-header")).toBeTruthy();
      expect(getByText("Lịch sử chi tiêu")).toBeTruthy();
      expect(getByTestId("expense-list-header")).toBeTruthy();
      expect(getByText("Total Expense: 50000")).toBeTruthy();
      expect(getByText("Filter: ALL")).toBeTruthy();
      expect(getByTestId("expense-item-e1")).toBeTruthy();
      expect(getByText("Expense: Lunch")).toBeTruthy();
      expect(queryByTestId("expense-empty-state")).toBeNull();
    });

    it("renders empty state when expenses list is empty", () => {
      mockExpensesData.expenses = [];
      const { getByTestId, queryByTestId } = render(<ExpenseScreen />);

      expect(getByTestId("expense-empty-state")).toBeTruthy();
      expect(queryByTestId("expense-item-e1")).toBeNull();
    });

    it("triggers onDelete callback when delete button is pressed on expense item", () => {
      const { getByTestId } = render(<ExpenseScreen />);
      fireEvent.press(getByTestId("delete-btn-e1"));
      expect(mockExpensesData.onDelete).toHaveBeenCalledWith("e1");
    });

    it("triggers edit and navigates to AddExpense screen when edit button is pressed on expense item", () => {
      const { getByTestId } = render(<ExpenseScreen />);
      fireEvent.press(getByTestId("edit-btn-e1"));
      expect(mockNavigate).toHaveBeenCalledWith("AddExpense", {
        initialData: { id: "e1", title: "Lunch", amount: 50000 },
      });
    });

    it("navigates to AddExpense screen when Add button is pressed in header", () => {
      const { getByTestId } = render(<ExpenseScreen />);
      fireEvent.press(getByTestId("hdr-add-btn"));
      expect(mockNavigate).toHaveBeenCalledWith("AddExpense", undefined);
    });

    it("triggers handleExport when Export button is pressed in header", () => {
      const { getByTestId } = render(<ExpenseScreen />);
      fireEvent.press(getByTestId("hdr-export-btn"));
      expect(mockExpensesData.handleExport).toHaveBeenCalled();
    });

    it("triggers setFilterType when filter is changed in header", () => {
      const { getByTestId } = render(<ExpenseScreen />);
      fireEvent.press(getByTestId("hdr-filter-btn"));
      expect(mockExpensesData.setFilterType).toHaveBeenCalledWith("FOOD");
    });

    it("triggers handleScanReceipt when scan button is pressed in header", () => {
      const { getByTestId } = render(<ExpenseScreen />);
      fireEvent.press(getByTestId("hdr-scan-btn"));
      expect(mockHandleScanReceipt).toHaveBeenCalled();
    });

    it("triggers handleVoiceResult and navigateToAddExpense when voice input is received in header", () => {
      const { getByTestId } = render(<ExpenseScreen />);
      fireEvent.press(getByTestId("hdr-voice-btn"));

      expect(mockExpensesData.handleVoiceResult).toHaveBeenCalledWith(
        "Voice Text",
        expect.any(Function)
      );

      // Verify the passed callback behaves correctly to navigate to AddExpense screen
      const navigateCallback = mockExpensesData.handleVoiceResult.mock.calls[0][1];
      act(() => {
        navigateCallback({ title: "Voice Expense" });
      });
      expect(mockNavigate).toHaveBeenCalledWith("AddExpense", {
        initialData: { title: "Voice Expense" },
      });
    });
  });

  describe("ExpenseFormRoute (AddExpense route name)", () => {
    beforeEach(() => {
      mockRoute = { name: "AddExpense", params: undefined };
    });

    it("renders ExpenseForm with correct title for adding an expense", () => {
      const { getByTestId, getByText } = render(<ExpenseScreen />);

      expect(getByTestId("expense-form")).toBeTruthy();
      expect(getByText("Title: Thêm khoản chi")).toBeTruthy();
      expect(getByText("Premium: No")).toBeTruthy();
    });

    it("renders ExpenseForm with correct title for editing an expense", () => {
      mockRoute.params = { initialData: { id: "e1", title: "Lunch" } };
      const { getByTestId, getByText } = render(<ExpenseScreen />);

      expect(getByTestId("expense-form")).toBeTruthy();
      expect(getByText("Title: Chỉnh sửa khoản chi")).toBeTruthy();
    });

    it("renders with premium user status correctly", () => {
      mockContextValue.user = { subscriptionPlan: "PREMIUM" };
      const { getByText } = render(<ExpenseScreen />);
      expect(getByText("Premium: Yes")).toBeTruthy();
    });

    it("triggers scan receipt callback in form route", () => {
      const { getByTestId } = render(<ExpenseScreen />);
      fireEvent.press(getByTestId("form-import-receipt-btn"));
      expect(mockHandleScanReceipt).toHaveBeenCalled();
    });

    it("calls navigation.goBack when form is successfully saved", () => {
      render(<ExpenseScreen />);

      expect(mockUseExpenseForm).toHaveBeenCalled();
      const onSavedCallback = mockUseExpenseForm.mock.calls[0][0].onSaved;

      act(() => {
        onSavedCallback();
      });

      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
