import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import apiClient from "../../../services/apiClient";
import PaymentHistoryScreen from "../PaymentHistoryScreen";

// 1. Mock useSafeAreaInsets
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
}));

// 2. Mock useFocusEffect
let focusEffectCallback;
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((cb) => {
    focusEffectCallback = cb;
  }),
}));

// 3. Mock useTranslation
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock colors and safeArea utils
jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFFFFF",
  }),
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaContentStyle: () => ({ paddingTop: 10, paddingBottom: 20 }),
}));

jest.mock("../../../utils/format", () => ({
  getApiErrorMessage: (error, fallback) => error?.message || fallback,
}));

// 4. Mock ScreenBackHeader
jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ title }) => React.createElement(Text, { testID: "mock-header" }, title);
});

// 5. Mock PaymentHistorySection
jest.mock("../../../components/Payment/PaymentHistorySection", () => {
  const React = require("react");
  const { View, Button, Text } = require("react-native");
  return ({ payments, loading, refreshing, onDelete, onRefresh, deletingCode }) => {
    return React.createElement(
      View,
      { testID: "mock-payment-history-section" },
      React.createElement(Text, { testID: "loading-text" }, loading ? "loading" : "idle"),
      React.createElement(Text, { testID: "refreshing-text" }, refreshing ? "refreshing" : "idle"),
      React.createElement(Text, { testID: "deleting-code-text" }, deletingCode || ""),
      payments.map((p) =>
        React.createElement(
          View,
          { key: p.orderCode, testID: `payment-item-${p.orderCode}` },
          React.createElement(Text, null, p.orderCode),
          React.createElement(Button, {
            testID: `delete-btn-${p.orderCode}`,
            title: "Delete",
            onPress: () => onDelete(p.orderCode),
          })
        )
      ),
      React.createElement(Button, {
        testID: "refresh-btn",
        title: "Refresh",
        onPress: onRefresh,
      })
    );
  };
});

// 6. Mock Alert using spy inside tests, no global mock to avoid React Native DevMenu TurboModule Registry issue

// 7. Mock apiClient
jest.mock("../../../services/apiClient", () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));

describe("PaymentHistoryScreen", () => {
  let alertSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    focusEffectCallback = null;
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("renders ScreenBackHeader and PaymentHistorySection", () => {
    const { getByTestId, getByText } = render(<PaymentHistoryScreen />);
    expect(getByTestId("mock-header")).toBeTruthy();
    expect(getByText("paymentHistory.title")).toBeTruthy();
    expect(getByTestId("mock-payment-history-section")).toBeTruthy();
  });

  it("useFocusEffect triggers loading payment history on focus", async () => {
    apiClient.get.mockResolvedValueOnce({ data: [] });
    render(<PaymentHistoryScreen />);

    expect(apiClient.get).not.toHaveBeenCalled();

    act(() => {
      focusEffectCallback();
    });

    expect(apiClient.get).toHaveBeenCalledWith("/payments");
  });

  it("successful loading of history updates payments list", async () => {
    const mockPayments = [
      { orderCode: "CODE1", amount: 1000 },
      { orderCode: "CODE2", amount: 2000 },
    ];
    apiClient.get.mockResolvedValueOnce({ data: mockPayments });

    const { getByTestId, queryByTestId } = render(<PaymentHistoryScreen />);

    // Before loading, state should be idle and no payments
    expect(getByTestId("loading-text").props.children).toBe("idle");
    expect(queryByTestId("payment-item-CODE1")).toBeNull();

    // Trigger focus callback in act
    act(() => {
      focusEffectCallback();
    });

    // Wait for the async flow to finish and list to update
    await waitFor(() => {
      expect(getByTestId("payment-item-CODE1")).toBeTruthy();
      expect(getByTestId("payment-item-CODE2")).toBeTruthy();
      expect(getByTestId("loading-text").props.children).toBe("idle");
    });
  });

  it("API error on loading displays error alert", async () => {
    const apiError = new Error("Load failed error");
    apiClient.get.mockRejectedValueOnce(apiError);

    const { getByTestId } = render(<PaymentHistoryScreen />);

    // Trigger focus callback in act
    act(() => {
      focusEffectCallback();
    });

    // Wait for the alert and verify
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "auth.common.error",
        "Load failed error"
      );
      expect(getByTestId("loading-text").props.children).toBe("idle");
    });
  });

  it("pull-to-refresh triggers reloading with refreshing=true", async () => {
    // Initial load empty list
    apiClient.get.mockResolvedValueOnce({ data: [] });
    const { getByTestId } = render(<PaymentHistoryScreen />);
    
    act(() => {
      focusEffectCallback();
    });
    
    await waitFor(() => {
      expect(getByTestId("refreshing-text").props.children).toBe("idle");
    });

    // Prepare custom response that takes some time to resolve so we can capture refreshing=true
    let resolveRefresh;
    const refreshPromise = new Promise((resolve) => {
      resolveRefresh = resolve;
    });
    apiClient.get.mockImplementationOnce(() => refreshPromise);

    // Trigger pull-to-refresh
    act(() => {
      fireEvent.press(getByTestId("refresh-btn"));
    });

    // refreshing state should be refreshing
    expect(getByTestId("refreshing-text").props.children).toBe("refreshing");

    // Resolve API response
    await act(async () => {
      resolveRefresh({ data: [{ orderCode: "NEW1" }] });
    });

    // Should return to idle and display the new payment
    await waitFor(() => {
      expect(getByTestId("refreshing-text").props.children).toBe("idle");
      expect(getByTestId("payment-item-NEW1")).toBeTruthy();
    });
  });

  it("handleDeletePayment calls Alert.alert confirmation", async () => {
    // Initial load list with one item
    apiClient.get.mockResolvedValueOnce({ data: [{ orderCode: "123" }] });
    const { getByTestId } = render(<PaymentHistoryScreen />);
    
    act(() => {
      focusEffectCallback();
    });
    
    await waitFor(() => {
      expect(getByTestId("payment-item-123")).toBeTruthy();
    });

    // Press delete button
    fireEvent.press(getByTestId("delete-btn-123"));

    // Verify confirmation alert is called
    expect(Alert.alert).toHaveBeenCalledWith(
      "paymentHistory.deleteTitle",
      "paymentHistory.deleteMessage",
      expect.any(Array)
    );

    const alertButtons = Alert.alert.mock.calls[0][2];
    expect(alertButtons).toHaveLength(2);
    expect(alertButtons[0].text).toBe("paymentHistory.cancel");
    expect(alertButtons[0].style).toBe("cancel");
    expect(alertButtons[1].text).toBe("paymentHistory.delete");
    expect(alertButtons[1].style).toBe("destructive");
  });

  it("confirming delete triggers deletePayment API call, filters out the deleted payment from state, and handles API errors", async () => {
    // Success delete flow
    apiClient.get.mockResolvedValueOnce({ data: [{ orderCode: "123" }, { orderCode: "456" }] });
    const { getByTestId, queryByTestId } = render(<PaymentHistoryScreen />);
    
    act(() => {
      focusEffectCallback();
    });
    
    await waitFor(() => {
      expect(getByTestId("payment-item-123")).toBeTruthy();
      expect(getByTestId("payment-item-456")).toBeTruthy();
    });

    // Trigger delete confirmation alert
    fireEvent.press(getByTestId("delete-btn-123"));

    const alertButtons = Alert.alert.mock.calls[0][2];
    const deleteOnPress = alertButtons[1].onPress;

    // Mock API client delete success
    apiClient.delete.mockResolvedValueOnce({ data: { success: true } });

    // Confirm deleting
    await act(async () => {
      await deleteOnPress();
    });

    // Verify API request was made
    expect(apiClient.delete).toHaveBeenCalledWith("/payments/123");

    // Verify payment 123 is removed but 456 remains
    await waitFor(() => {
      expect(queryByTestId("payment-item-123")).toBeNull();
      expect(getByTestId("payment-item-456")).toBeTruthy();
    });

    // Error delete flow
    // Trigger delete for 456
    fireEvent.press(getByTestId("delete-btn-456"));

    const alertButtonsErr = Alert.alert.mock.calls[1][2];
    const deleteOnPressErr = alertButtonsErr[1].onPress;

    // Mock API client delete failure
    const deleteError = new Error("Delete failed error");
    apiClient.delete.mockRejectedValueOnce(deleteError);

    // Confirm deleting
    await act(async () => {
      await deleteOnPressErr();
    });

    // Verify error alert shown
    expect(Alert.alert).toHaveBeenCalledWith(
      "paymentHistory.deleteFailed",
      "Delete failed error"
    );

    // Verify payment 456 still remains in state
    expect(getByTestId("payment-item-456")).toBeTruthy();
  });
});
