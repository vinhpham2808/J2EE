import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import PaymentResultScreen from "../PaymentResultScreen";
import apiClient from "../../../services/apiClient";
import { AuthContext } from "../../../contexts/AuthContext";

const mockNavigate = jest.fn();
let mockRouteParams = {};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 10, right: 10 }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, name);
  },
}));

const mockRefreshUser = jest.fn();
const mockContextValue = {
  refreshUser: mockRefreshUser,
};
jest.mock("../../../contexts/AuthContext", () => {
  const React = require("react");
  const AuthContext = React.createContext({
    refreshUser: () => Promise.resolve(),
  });
  return {
    AuthContext,
  };
});

jest.mock("../../../services/apiClient", () => ({
  get: jest.fn(),
}));

jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return ({ title }) => (
    <View testID="screen-header">
      <Text>{title}</Text>
    </View>
  );
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => {
      const translations = {
        "paymentResult.title": "Kết quả thanh toán",
        "paymentHistory.loadFailed": "Đồng bộ trạng thái thất bại",
        "paymentResult.transactionStatus": "Trạng thái giao dịch",
        "paymentResult.orderCode": "Mã đơn hàng",
        "paymentResult.amount": "Số tiền",
        "paymentResult.servicePlan": "Gói dịch vụ",
        "paymentResult.home": "Trang chủ",
        "paymentResult.statuses.PAID": "Đã thanh toán",
        "paymentResult.statuses.CANCELLED": "Đã hủy",
        "paymentResult.statuses.PENDING": "Đang chờ xử lý",
        "paymentResult.statuses.FAILED": "Thất bại",
      };
      return translations[key] || defaultValue || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    WHITE: "#FFFFFF",
  },
  useAppColors: () => ({
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#CCCCCC",
    INCOME: "#00FF00",
    EXPENSE: "#FF0000",
    PRIMARY: "#0000FF",
    TEXT: "#000000",
    TEXT_SECONDARY: "#555555",
    EXPENSE_LIGHT: "#FFEAEA",
  }),
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaContentStyle: (insets) => ({
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatMoney: (amount) => `$${amount}`,
  getApiErrorMessage: (error, fallback) => error?.response?.data?.message || error?.message || fallback,
}));

describe("PaymentResultScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRefreshUser.mockClear();
    apiClient.get.mockReset();
    mockRouteParams = {};
  });

  test("status sync API returns status 'PAID': calls refreshUser and displays PAID status, checkmark icon, details", async () => {
    mockRouteParams = {
      orderCode: "ORD-123456",
      status: "PENDING",
      result: "success",
    };

    const mockResponse = {
      data: {
        status: "PAID",
        amount: 50000,
        planName: "Premium Plan",
      },
    };

    let resolveApi;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    apiClient.get.mockImplementation(() => apiPromise);

    const renderResult = render(
      <AuthContext.Provider value={mockContextValue}>
        <PaymentResultScreen />
      </AuthContext.Provider>
    );

    const { getByText } = renderResult;

    // Verify initial state shows pending, close-circle
    expect(getByText("close-circle")).toBeTruthy();
    expect(getByText("Đang chờ xử lý")).toBeTruthy();

    // Resolve the sync API call
    await act(async () => {
      resolveApi(mockResponse);
      await apiPromise;
    });

    // Check that refreshUser is called since status updated to PAID
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);

    // Verify displays PAID status and checkmark-circle icon
    expect(getByText("checkmark-circle")).toBeTruthy();
    expect(getByText("Đã thanh toán")).toBeTruthy();

    // Verify displays correct payment details
    expect(getByText("ORD-123456")).toBeTruthy();
    expect(getByText("$50000")).toBeTruthy();
    expect(getByText("Premium Plan")).toBeTruthy();
  });

  test("route params specify cancellation: displays CANCELLED status, close icon", async () => {
    mockRouteParams = {
      result: "cancel",
      orderCode: "",
    };

    const renderResult = render(
      <AuthContext.Provider value={mockContextValue}>
        <PaymentResultScreen />
      </AuthContext.Provider>
    );

    const { getByText } = renderResult;

    // Check display status and icon
    expect(getByText("close-circle")).toBeTruthy();
    expect(getByText("Đã hủy")).toBeTruthy();
  });

  test("route params specify pending/other status", async () => {
    mockRouteParams = {
      status: "PENDING",
      orderCode: "",
    };

    const renderResult = render(
      <AuthContext.Provider value={mockContextValue}>
        <PaymentResultScreen />
      </AuthContext.Provider>
    );

    const { getByText } = renderResult;

    expect(getByText("close-circle")).toBeTruthy();
    expect(getByText("Đang chờ xử lý")).toBeTruthy();
  });

  test("displays FAILED status when API returns FAILED status", async () => {
    mockRouteParams = {
      orderCode: "ORD-FAILED",
      status: "PENDING",
    };

    let resolveApi;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    apiClient.get.mockImplementation(() => apiPromise);

    const renderResult = render(
      <AuthContext.Provider value={mockContextValue}>
        <PaymentResultScreen />
      </AuthContext.Provider>
    );

    const { getByText } = renderResult;

    await act(async () => {
      resolveApi({
        data: {
          status: "FAILED",
          amount: 20000,
          planName: "Basic Plan",
        },
      });
      await apiPromise;
    });

    expect(getByText("close-circle")).toBeTruthy();
    expect(getByText("Thất bại")).toBeTruthy();
    expect(getByText("ORD-FAILED")).toBeTruthy();
    expect(getByText("$20000")).toBeTruthy();
    expect(getByText("Basic Plan")).toBeTruthy();
  });

  test("API error while syncing: displays error fallback box", async () => {
    mockRouteParams = {
      orderCode: "ORD-ERR",
      status: "PENDING",
    };

    const mockError = new Error("API Connection Failed");
    let rejectApi;
    const apiPromise = new Promise((_, reject) => {
      rejectApi = reject;
    });
    apiClient.get.mockImplementation(() => apiPromise);

    const renderResult = render(
      <AuthContext.Provider value={mockContextValue}>
        <PaymentResultScreen />
      </AuthContext.Provider>
    );

    const { getByText, queryByText } = renderResult;

    expect(queryByText("API Connection Failed")).toBeNull();

    await act(async () => {
      rejectApi(mockError);
      try {
        await apiPromise;
      } catch (e) {
        // ignore promise rejection
      }
    });

    // Check that error fallback box displays the error message
    expect(getByText("API Connection Failed")).toBeTruthy();
  });

  test("clicking home button triggers navigate to 'HomeTab'", async () => {
    mockRouteParams = {
      orderCode: "",
      status: "PENDING",
    };

    const renderResult = render(
      <AuthContext.Provider value={mockContextValue}>
        <PaymentResultScreen />
      </AuthContext.Provider>
    );

    const { getByText } = renderResult;

    const homeButton = getByText("Trang chủ");

    await act(async () => {
      fireEvent.press(homeButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith("HomeTab");
  });
});
