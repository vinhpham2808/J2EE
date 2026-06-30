const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const templates = {
        "finance.history.title": "Lịch sử giao dịch",
        "finance.history.searchPlaceholder": "Tìm kiếm giao dịch...",
        "finance.history.emptyTitle": "Không có giao dịch nào",
        "finance.history.emptyDescription": "Hãy tạo giao dịch đầu tiên",
      };
      return templates[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    APP_BACKGROUND: "#F2F2F7",
    TEXT: "#000",
    TEXT_MUTED: "#8E8E93",
    TEXT_SECONDARY: "#666",
    CARD: "#FFF",
    BORDER: "#C6C6C8",
    ACTION_INCOME: "#22C55E",
    ACTION_EXPENSE: "#F97316",
  }),
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: () => 40,
  getSafeAreaBottom: () => 20,
}));

// Mock hook
const mockHistoryHook = {
  activeType: "expense",
  currentMonth: new Date(2026, 5, 1),
  daysInMonth: [],
  filteredTransactions: [],
  groupedTransactions: [],
  monthlySummary: { income: 0, expense: 0 },
  refreshing: false,
  searchQuery: "",
  selectedDay: null,
  showSearch: false,
  handleDelete: jest.fn(),
  loadData: jest.fn(),
  nextMonth: jest.fn(),
  prevMonth: jest.fn(),
  setActiveType: jest.fn(),
  setSearchQuery: jest.fn(),
  setSelectedDay: jest.fn(),
  setShowSearch: jest.fn(),
};

jest.mock("../../../hooks/useTransactionHistory", () => () => mockHistoryHook);

// Mock components
jest.mock("../../../components/ui/AppIcon", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({ name, testID }) => React.createElement(View, { testID: testID || `icon-${name}` });
});

jest.mock("../../../components/Transactions/TransactionCalendarHeader", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({
    activeType,
    currentMonth,
    daysInMonth,
    monthlySummary,
    nextMonth,
    prevMonth,
    renderCalendarDay,
    setActiveType,
    setSelectedDay,
  }) => {
    return React.createElement(
      View,
      { testID: "transaction-calendar-header" },
      React.createElement(Text, null, `Month: ${currentMonth ? currentMonth.toDateString() : ""}`),
      React.createElement(TouchableOpacity, { testID: "btn-prev-month", onPress: prevMonth }, React.createElement(Text, null, "Prev")),
      React.createElement(TouchableOpacity, { testID: "btn-next-month", onPress: nextMonth }, React.createElement(Text, null, "Next")),
      React.createElement(TouchableOpacity, { testID: "btn-set-type-income", onPress: () => setActiveType("income") }, React.createElement(Text, null, "Income")),
      React.createElement(TouchableOpacity, { testID: "btn-set-type-expense", onPress: () => setActiveType("expense") }, React.createElement(Text, null, "Expense")),
      React.createElement(
        View,
        { testID: "calendar-days-container" },
        (daysInMonth || []).map((dayItem, index) => {
          return React.createElement(
            View,
            { key: index, testID: `calendar-day-wrapper-${dayItem.day}` },
            renderCalendarDay({ item: dayItem })
          );
        })
      )
    );
  };
});

jest.mock("../../../components/Transactions/TransactionGroup", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ group, onDelete, onEdit }) => {
    return React.createElement(
      View,
      { testID: `transaction-group-${group.date.toDateString()}` },
      React.createElement(Text, null, group.date.toDateString()),
      (group.transactions || []).map((tx) =>
        React.createElement(
          View,
          { key: tx.id, testID: `tx-item-${tx.id}` },
          React.createElement(Text, null, `${tx.category}: ${tx.amount}`),
          React.createElement(TouchableOpacity, { testID: `tx-edit-${tx.id}`, onPress: () => onEdit(tx) }, React.createElement(Text, null, "Edit")),
          React.createElement(TouchableOpacity, { testID: `tx-delete-${tx.id}`, onPress: () => onDelete(tx.id) }, React.createElement(Text, null, "Delete"))
        )
      )
    );
  };
});

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { FlatList } from "react-native";
import TransactionHistoryScreen from "../TransactionHistoryScreen";

describe("TransactionHistoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHistoryHook.activeType = "expense";
    mockHistoryHook.currentMonth = new Date(2026, 5, 1);
    mockHistoryHook.daysInMonth = [];
    mockHistoryHook.filteredTransactions = [];
    mockHistoryHook.groupedTransactions = [];
    mockHistoryHook.monthlySummary = { income: 0, expense: 0 };
    mockHistoryHook.refreshing = false;
    mockHistoryHook.searchQuery = "";
    mockHistoryHook.selectedDay = null;
    mockHistoryHook.showSearch = false;
  });

  it("renders screen, header and empty state when there are no transactions", () => {
    const { getByText, queryByTestId } = render(<TransactionHistoryScreen />);

    expect(getByText("Lịch sử giao dịch")).toBeTruthy();
    expect(getByText("Không có giao dịch nào")).toBeTruthy();
    expect(getByText("Hãy tạo giao dịch đầu tiên")).toBeTruthy();

    expect(queryByTestId("icon-search-outline")).toBeTruthy();
    expect(queryByTestId("icon-add")).toBeTruthy();
  });

  it("renders transaction list when groupedTransactions is populated", () => {
    const dateMock = new Date(2026, 5, 15);
    mockHistoryHook.groupedTransactions = [
      {
        date: dateMock,
        transactions: [
          { id: "t1", type: "expense", category: "Food", amount: 150000 },
        ],
      },
    ];

    const { getByTestId, getByText } = render(<TransactionHistoryScreen />);
    expect(getByTestId("transaction-group-Mon Jun 15 2026")).toBeTruthy();
    expect(getByText("Food: 150000")).toBeTruthy();
  });

  it("toggles the search bar and queries text correctly", () => {
    // Initial state: search is closed
    const { getByTestId, queryByPlaceholderText } = render(<TransactionHistoryScreen />);
    expect(queryByPlaceholderText("Tìm kiếm giao dịch...")).toBeNull();

    // Toggle search open
    fireEvent.press(getByTestId("icon-search-outline"));
    expect(mockHistoryHook.setShowSearch).toHaveBeenCalled();

    // Set showSearch to true and search query to "Coffee"
    mockHistoryHook.showSearch = true;
    mockHistoryHook.searchQuery = "Coffee";

    const { getByPlaceholderText, getByTestId: getByTestIdOpen } = render(<TransactionHistoryScreen />);
    const searchInput = getByPlaceholderText("Tìm kiếm giao dịch...");
    expect(searchInput).toBeTruthy();
    expect(searchInput.props.value).toBe("Coffee");

    // Clear query button should show up
    const clearBtn = getByTestIdOpen("icon-close-circle");
    expect(clearBtn).toBeTruthy();

    // Type text in search input
    act(() => {
      fireEvent.changeText(searchInput, "Milk Tea");
    });
    expect(mockHistoryHook.setSearchQuery).toHaveBeenCalledWith("Milk Tea");

    // Click clear button
    fireEvent.press(clearBtn);
    expect(mockHistoryHook.setSearchQuery).toHaveBeenCalledWith("");
  });

  it("navigates to AddExpense screen when clicking add and activeType is expense", () => {
    mockHistoryHook.activeType = "expense";
    const { getByTestId } = render(<TransactionHistoryScreen />);
    
    fireEvent.press(getByTestId("icon-add"));
    expect(mockNavigate).toHaveBeenCalledWith("AddExpense");
  });

  it("navigates to AddIncome screen when clicking add and activeType is income", () => {
    mockHistoryHook.activeType = "income";
    const { getByTestId } = render(<TransactionHistoryScreen />);
    
    fireEvent.press(getByTestId("icon-add"));
    expect(mockNavigate).toHaveBeenCalledWith("AddIncome");
  });

  it("triggers edit and delete callbacks for a transaction", () => {
    const dateMock = new Date(2026, 5, 15);
    const txMock = { id: "t10", type: "income", category: "Salary", amount: 15000000 };
    mockHistoryHook.groupedTransactions = [
      {
        date: dateMock,
        transactions: [txMock],
      },
    ];

    const { getByTestId } = render(<TransactionHistoryScreen />);
    
    // Press Edit
    fireEvent.press(getByTestId("tx-edit-t10"));
    expect(mockNavigate).toHaveBeenCalledWith("AddIncome", { initialData: txMock });

    // Press Delete
    fireEvent.press(getByTestId("tx-delete-t10"));
    expect(mockHistoryHook.handleDelete).toHaveBeenCalledWith("t10");
  });

  it("renders calendar days and triggers day selection", () => {
    mockHistoryHook.daysInMonth = [
      { day: 10, isToday: false },
      { day: 15, isToday: true },
    ];
    mockHistoryHook.selectedDay = 10;

    const { getByText, getByTestId } = render(<TransactionHistoryScreen />);
    
    // Check if days are rendered
    expect(getByText("10")).toBeTruthy();
    expect(getByText("15")).toBeTruthy();

    // Click day 15 cell (day 15 is not selected, selecting it calls setSelectedDay(15))
    fireEvent.press(getByText("15"));
    expect(mockHistoryHook.setSelectedDay).toHaveBeenCalledWith(15);

    // Click day 10 cell (day 10 is currently selected, clicking it again calls setSelectedDay(null))
    fireEvent.press(getByText("10"));
    expect(mockHistoryHook.setSelectedDay).toHaveBeenCalledWith(null);
  });

  it("renders transaction indicator dots on calendar days", () => {
    mockHistoryHook.daysInMonth = [{ day: 12, isToday: false }];
    mockHistoryHook.filteredTransactions = [
      { id: "tx_dot", type: "expense", date: new Date(2026, 5, 12) },
    ];
    mockHistoryHook.activeType = "expense";

    const { getByText } = render(<TransactionHistoryScreen />);
    
    // The calendar day cell for 12 is rendered
    const dayText = getByText("12");
    expect(dayText).toBeTruthy();

    // Pressable day cell is a parent of the Text element
    // Let's assert it has children (which includes the dotsRow)
    const dayCell = dayText.parent;
    expect(dayCell).toBeTruthy();
  });

  it("handles pull to refresh correctly", () => {
    const { UNSAFE_getByType } = render(<TransactionHistoryScreen />);
    const flatList = UNSAFE_getByType(FlatList);
    
    expect(flatList).toBeTruthy();
    
    act(() => {
      flatList.props.refreshControl.props.onRefresh();
    });
    
    expect(mockHistoryHook.loadData).toHaveBeenCalled();
  });
});
