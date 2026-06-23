jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("../../constants/colors", () => ({
  useAppColors: () => ({
    SURFACE: "#FFF",
    BORDER: "#EEE",
    TAB_ACTIVE_FG: "#7C4DFF",
    TAB_INACTIVE: "#666",
    ACTION_VOICE: "#A855F7",
    BG: "#FFF",
    TEXT: "#000",
    SHADOW_COLOR: "#000",
  }),
}));

jest.mock("@react-navigation/bottom-tabs", () => {
  const React = require("react");
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children, screenOptions }) =>
        React.createElement("TabNavigator", { screenOptions }, children),
      Screen: ({ name, component, options, listeners }) => {
        const button = typeof options?.tabBarButton === "function"
          ? options.tabBarButton({
              accessibilityState: { selected: name === "HomeTab" },
              onPress: jest.fn(),
              children: null,
            })
          : null;
        return React.createElement("TabScreen", { name }, button);
      },
    }),
  };
});

jest.mock("@react-navigation/native-stack", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => React.createElement("StackNavigator", null, children),
      Screen: ({ name }) => React.createElement("StackScreen", { name }),
    }),
  };
});

// Mock FloatingQuickMenu
jest.mock("../FloatingQuickMenu", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ visible, onClose, onSelectRoute }) => {
      if (!visible) return null;
      return React.createElement(
        TouchableOpacity,
        { testID: "floating-quick-menu", onPress: onClose },
        React.createElement(TouchableOpacity, {
          testID: "select-income",
          onPress: () => onSelectRoute("Income"),
        }),
        React.createElement(Text, null, "FloatingMenu")
      );
    },
    FloatingTabButton: ({ onPress, isOpen }) =>
      React.createElement(
        TouchableOpacity,
        { testID: "floating-tab-button", onPress },
        React.createElement(Text, null, isOpen ? "Open" : "Closed")
      ),
  };
});

// Mock screens
jest.mock("../../screens/dashboard/DashboardScreen", () => () => null);
jest.mock("../../screens/finance/ExpenseScreen", () => () => null);
jest.mock("../../screens/finance/TransactionHistoryScreen", () => () => null);
jest.mock("../../screens/profile/MoreScreen", () => () => null);
jest.mock("../../screens/finance/IncomeScreen", () => () => null);
jest.mock("../../screens/finance/BudgetScreen", () => () => null);
jest.mock("../../screens/finance/GoalScreen", () => () => null);
jest.mock("../../screens/finance/CategoryScreen", () => () => null);
jest.mock("../../screens/insights/ForecastScreen", () => () => null);
jest.mock("../../screens/insights/ChatScreen", () => () => null);
jest.mock("../../screens/insights/ReportsScreen", () => () => null);
jest.mock("../../screens/finance/JarScreen", () => () => null);
jest.mock("../../screens/finance/ReceiptPreviewScreen", () => () => null);
jest.mock("../../screens/profile/ProfileScreen", () => () => null);
jest.mock("../../screens/profile/EditProfileScreen", () => () => null);
jest.mock("../../screens/profile/HelpScreen", () => () => null);
jest.mock("../../screens/payment/PaymentScreen", () => () => null);
jest.mock("../../screens/payment/PaymentCheckoutScreen", () => () => null);
jest.mock("../../screens/payment/PaymentHistoryScreen", () => () => null);
jest.mock("../../screens/payment/PaymentResultScreen", () => () => null);

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import MainTabs, {
  HomeStack,
  CategoryStack,
  ExpenseStack,
  SettingStack,
} from "../MainTabs";
import { appNavigationRef } from "../navigationRef";

describe("MainTabs Stack Navigators", () => {
  it("renders HomeStack without crashing", () => {
    const { toJSON } = render(<HomeStack />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders CategoryStack without crashing", () => {
    const { toJSON } = render(<CategoryStack />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ExpenseStack without crashing", () => {
    const { toJSON } = render(<ExpenseStack />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders SettingStack without crashing", () => {
    const { toJSON } = render(<SettingStack />);
    expect(toJSON()).toBeTruthy();
  });
});

describe("MainTabs Navigator Integration", () => {
  beforeEach(() => {
    appNavigationRef.current = {
      navigate: jest.fn(),
    };
  });

  afterEach(() => {
    appNavigationRef.current = null;
  });

  it("renders the tabs navigator and floating quick menu trigger button", () => {
    const { getByTestId, queryByTestId } = render(<MainTabs />);
    expect(getByTestId("floating-tab-button")).toBeTruthy();
    // Menu is closed initially
    expect(queryByTestId("floating-quick-menu")).toBeNull();
  });

  it("toggles the FloatingQuickMenu when FloatingTabButton is clicked", () => {
    const { getByTestId, queryByTestId } = render(<MainTabs />);

    // Press FAB button to open
    fireEvent.press(getByTestId("floating-tab-button"));
    expect(getByTestId("floating-quick-menu")).toBeTruthy();

    // Press again (which acts as backdrop close/press) to close
    fireEvent.press(getByTestId("floating-quick-menu"));
    expect(queryByTestId("floating-quick-menu")).toBeNull();
  });

  it("navigates to the selected route when an option in the Quick Menu is chosen", () => {
    const { getByTestId } = render(<MainTabs />);

    // Open menu
    fireEvent.press(getByTestId("floating-tab-button"));

    // Select 'Income' route inside FloatingQuickMenu mock
    fireEvent.press(getByTestId("select-income"));

    expect(appNavigationRef.current.navigate).toHaveBeenCalledWith("HomeTab", {
      screen: "Income",
    });
  });
});
