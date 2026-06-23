const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: { BG: "#FFF" },
  useAppColors: () => ({ BG: "#FFF" }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (s) => s,
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaBottom: () => 20,
}));

// Mock hooks
const mockDashboard = {
  recentTransactions: [{ id: "1", title: "Coffee", amount: -50000 }],
  refreshing: false,
  onRefresh: jest.fn(),
  unreadCount: 2,
  dashboard: {
    totalIncome: 12000000,
    totalExpense: 4000000,
    totalBalance: 8000000,
  },
  monthlySeries: [],
  goals: [{ id: "g1", title: "Travel" }],
  setUnreadCount: jest.fn(),
};

const mockAiInsight = {
  isPremium: true,
  openSheet: jest.fn(),
  closeSheet: jest.fn(),
  confirmAnalysis: jest.fn(() => ({ year: 2026, month: 6, savedAt: "2026-06-21" })),
  visible: false,
  selectedMonth: 6,
  selectedYear: 2026,
  availableMonths: [],
  goToPrevMonth: jest.fn(),
  goToNextMonth: jest.fn(),
  goToMonth: jest.fn(),
  canGoPrev: false,
  canGoNext: false,
  result: null,
  loading: false,
  error: null,
  isIdle: true,
  analyze: jest.fn(),
  retry: jest.fn(),
};
jest.mock("../../../hooks/useDashboard", () => ({
  __esModule: true,
  default: () => mockDashboard,
}));
jest.mock("../../../hooks/useAiInsight", () => ({
  useAiInsight: () => mockAiInsight,
}));

jest.mock("../../../components/common/ShowMoreButton", () => ({
  useVisibleItems: (items) => ({
    visibleItems: items,
    canToggle: true,
    expanded: false,
    toggle: jest.fn(),
  }),
}));

// Mock subcomponents
jest.mock("../../../components/Dashboard/HomeTopHeader", () => {
  const React = require("react");
  const { TouchableOpacity, Text, View } = require("react-native");
  return ({ onMenuPress, onBellPress, balance, isBalanceVisible, onToggleBalance }) =>
    React.createElement(
      View,
      { testID: "home-top-header" },
      React.createElement(TouchableOpacity, { testID: "menu-btn", onPress: onMenuPress }),
      React.createElement(TouchableOpacity, { testID: "bell-btn", onPress: onBellPress }),
      React.createElement(TouchableOpacity, { testID: "toggle-balance-btn", onPress: onToggleBalance }),
      React.createElement(Text, null, `Balance: ${balance}, Visible: ${isBalanceVisible}`)
    );
});

jest.mock("../../../components/Dashboard/HomeBanner", () => () => null);
jest.mock("../../../components/Dashboard/DailySummaryCards", () => () => null);
jest.mock("../../../components/Dashboard/RecentTransactionsSection", () => () => null);

jest.mock("../../../components/Dashboard/FinanceOverviewSection", () => {
  const React = require("react");
  const { TouchableOpacity, View } = require("react-native");
  return ({ onAiPress }) =>
    React.createElement(
      View,
      { testID: "finance-overview" },
      React.createElement(TouchableOpacity, { testID: "ai-btn", onPress: onAiPress })
    );
});

jest.mock("../../../components/Dashboard/GoalsPreview", () => {
  const React = require("react");
  const { TouchableOpacity, View } = require("react-native");
  return ({ onCreate, onGoalPress, onMore }) =>
    React.createElement(
      View,
      { testID: "goals-preview" },
      React.createElement(TouchableOpacity, { testID: "goals-create", onPress: onCreate }),
      React.createElement(TouchableOpacity, { testID: "goals-press", onPress: onGoalPress }),
      React.createElement(TouchableOpacity, { testID: "goals-more", onPress: onMore })
    );
});

jest.mock("../../../components/Dashboard/NotificationModal", () => {
  const React = require("react");
  const { TouchableOpacity, View } = require("react-native");
  return ({ visible, onClose }) => {
    if (!visible) return null;
    return React.createElement(
      View,
      { testID: "notification-modal" },
      React.createElement(TouchableOpacity, { testID: "close-notification-btn", onPress: onClose })
    );
  };
});

jest.mock("../../../components/Ai_Insight/AiInsightSheet", () => {
  const React = require("react");
  const { TouchableOpacity, View } = require("react-native");
  return ({ visible, onConfirm, onClose }) => {
    if (!visible) return null;
    return React.createElement(
      View,
      { testID: "ai-insight-sheet" },
      React.createElement(TouchableOpacity, { testID: "ai-confirm-btn", onPress: onConfirm }),
      React.createElement(TouchableOpacity, { testID: "ai-close-btn", onPress: onClose })
    );
  };
});

jest.mock("../../../components/Ai_Insight/AiInsightLockedModal", () => {
  const React = require("react");
  const { TouchableOpacity, View } = require("react-native");
  return ({ visible, onClose }) => {
    if (!visible) return null;
    return React.createElement(
      View,
      { testID: "ai-locked-modal" },
      React.createElement(TouchableOpacity, { testID: "close-locked-btn", onPress: onClose })
    );
  };
});

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import DashboardScreen from "../DashboardScreen";

describe("DashboardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAiInsight.isPremium = true;
    mockAiInsight.visible = false;
  });

  it("renders DashboardScreen with sections and modals successfully", () => {
    const { getByTestId, queryByTestId } = render(<DashboardScreen />);
    expect(getByTestId("home-top-header")).toBeTruthy();
    expect(getByTestId("finance-overview")).toBeTruthy();
    expect(getByTestId("goals-preview")).toBeTruthy();
    // Modal is initially closed
    expect(queryByTestId("notification-modal")).toBeNull();
    expect(queryByTestId("ai-insight-sheet")).toBeNull();
    expect(queryByTestId("ai-locked-modal")).toBeNull();
  });

  it("opens and closes the notification modal", () => {
    const { getByTestId, queryByTestId } = render(<DashboardScreen />);

    // Open notification modal
    fireEvent.press(getByTestId("bell-btn"));
    expect(getByTestId("notification-modal")).toBeTruthy();

    // Close notification modal
    fireEvent.press(getByTestId("close-notification-btn"));
    expect(queryByTestId("notification-modal")).toBeNull();
  });

  it("toggles balance visibility state", () => {
    const { getByTestId, getByText } = render(<DashboardScreen />);
    expect(getByText("Balance: 8000000, Visible: true")).toBeTruthy();

    fireEvent.press(getByTestId("toggle-balance-btn"));
    expect(getByText("Balance: 8000000, Visible: false")).toBeTruthy();
  });

  it("navigates to Profile screen inside SettingsTab", () => {
    const { getByTestId } = render(<DashboardScreen />);
    fireEvent.press(getByTestId("menu-btn"));
    expect(mockNavigate).toHaveBeenCalledWith("SettingTab", { screen: "Profile" });
  });

  it("opens AI sheet if user has premium on AI button click", () => {
    mockAiInsight.isPremium = true;
    const { getByTestId } = render(<DashboardScreen />);

    fireEvent.press(getByTestId("ai-btn"));
    expect(mockAiInsight.openSheet).toHaveBeenCalled();
  });

  it("opens locked modal if user does not have premium on AI button click", () => {
    mockAiInsight.isPremium = false;
    const { getByTestId, queryByTestId } = render(<DashboardScreen />);

    expect(queryByTestId("ai-locked-modal")).toBeNull();

    fireEvent.press(getByTestId("ai-btn"));
    expect(mockAiInsight.openSheet).not.toHaveBeenCalled();
    expect(getByTestId("ai-locked-modal")).toBeTruthy();

    // Close locked modal
    fireEvent.press(getByTestId("close-locked-btn"));
    expect(queryByTestId("ai-locked-modal")).toBeNull();
  });

  it("confirms AI analysis and navigates to Forecast screen", () => {
    mockAiInsight.visible = true;
    const { getByTestId } = render(<DashboardScreen />);

    fireEvent.press(getByTestId("ai-confirm-btn"));
    expect(mockAiInsight.confirmAnalysis).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("Forecast", {
      year: 2026,
      month: 6,
      source: "ai-insight",
      draftSavedAt: "2026-06-21",
    });
  });

  it("navigates to Goal screen from Goals section callbacks", () => {
    const { getByTestId } = render(<DashboardScreen />);

    fireEvent.press(getByTestId("goals-create"));
    expect(mockNavigate).toHaveBeenLastCalledWith("Goal");

    fireEvent.press(getByTestId("goals-press"));
    expect(mockNavigate).toHaveBeenLastCalledWith("Goal");

    fireEvent.press(getByTestId("goals-more"));
    expect(mockNavigate).toHaveBeenLastCalledWith("Goal");
  });
});
