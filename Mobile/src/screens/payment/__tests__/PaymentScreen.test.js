import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import PaymentScreen from "../PaymentScreen";
import apiClient from "../../../services/apiClient";

// 1. Mock useNavigation
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// 1. Mock useSafeAreaInsets
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10, left: 0, right: 0 }),
}));

// 1. Mock useTranslation
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// 1. Mock LinearGradient
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children, style, ...props }) => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { style, ...props }, children);
  },
}));

// 1. Mock apiClient
jest.mock("../../../services/apiClient", () => ({
  post: jest.fn(),
}));

// 1. Mock AppIcon
jest.mock("../../../components/ui/AppIcon", () => "AppIcon");

// 2. Mock APP_LOGO image asset
jest.mock("../../../assets/logo&banner/applogo.png", () => "applogo.png");

// Mock colors
jest.mock("../../../constants/colors", () => ({
  COLORS: {
    WHITE: "#FFFFFF",
  },
  useAppColors: () => ({
    BG: "#FFFFFF",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    PRIMARY: "#EF5E83",
    WHITE: "#FFFFFF",
  }),
}));

// Mock format utils
jest.mock("../../../utils/format", () => ({
  formatMoney: (val) => `${val} VND`,
  getApiErrorMessage: (error, fallback) => error?.message || fallback,
}));

describe("PaymentScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders hero text, benefits list, payment plans, and selected plan by default", () => {
    const { getByText, getAllByText } = render(<PaymentScreen />);

    // Verify hero text
    expect(getByText("payment.title")).toBeTruthy();
    expect(getByText("payment.subtitle")).toBeTruthy();

    // Verify benefits list
    expect(getByText("payment.benefits.0")).toBeTruthy();
    expect(getByText("payment.benefits.1")).toBeTruthy();
    expect(getByText("payment.benefits.2")).toBeTruthy();
    expect(getByText("payment.benefits.3")).toBeTruthy();
    expect(getByText("payment.benefits.4")).toBeTruthy();

    // Verify payment plans names
    expect(getAllByText("payment.planPremiumName").length).toBeGreaterThan(0);
    expect(getAllByText("payment.planBasicName").length).toBeGreaterThan(0);

    // Verify default selected plan is Premium (since featured = true)
    // Premium plan is selected, shows "payment.selectedPlan"
    // Basic plan is not selected, shows "payment.tapToSelect"
    expect(getByText("payment.selectedPlan")).toBeTruthy();
    expect(getByText("payment.tapToSelect")).toBeTruthy();

    // Verify pricing amounts
    expect(getByText("299000 VND")).toBeTruthy();
    expect(getByText("2000 VND")).toBeTruthy();
  });

  test("clicking a plan card updates selectedPlanId", async () => {
    const { getByText, queryAllByText } = render(<PaymentScreen />);

    // Initially, premium is selected.
    // Premium name is rendered in the card and the bottom button pill (2 times).
    // Basic name is rendered only in the card (1 time).
    expect(queryAllByText("payment.planPremiumName")).toHaveLength(2);
    expect(queryAllByText("payment.planBasicName")).toHaveLength(1);

    // Tap the basic plan card
    const basicPlanCard = getByText("payment.planBasicName");
    await act(async () => {
      fireEvent.press(basicPlanCard);
    });

    // After tap, basic plan should be selected.
    // Premium name is rendered only in the card (1 time).
    // Basic name is rendered in the card and the bottom button pill (2 times).
    expect(queryAllByText("payment.planPremiumName")).toHaveLength(1);
    expect(queryAllByText("payment.planBasicName")).toHaveLength(2);
  });

  test("clicking checkout button calls createPaymentLink API with selected plan details", async () => {
    const { getByText } = render(<PaymentScreen />);

    // Set up mock success response
    apiClient.post.mockResolvedValueOnce({
      data: {
        checkoutUrl: "https://checkout.example.com/pay",
        orderCode: 12345,
      },
    });

    // Press checkout button
    const checkoutBtn = getByText("payment.bankTransfer");
    await act(async () => {
      fireEvent.press(checkoutBtn);
    });

    // Verify apiClient.post is called with premium details by default
    expect(apiClient.post).toHaveBeenCalledWith("/payments/payos/create", {
      planId: "premium",
      amount: 299000,
      description: "Payment payment.planPremiumName",
    });
  });

  test("navigates to PaymentCheckout with checkoutUrl if payment creation succeeds", async () => {
    const { getByText } = render(<PaymentScreen />);

    // Set up mock success response
    apiClient.post.mockResolvedValueOnce({
      data: {
        checkoutUrl: "https://checkout.example.com/pay",
        orderCode: 12345,
      },
    });

    // Press checkout button
    const checkoutBtn = getByText("payment.bankTransfer");
    await act(async () => {
      fireEvent.press(checkoutBtn);
    });

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith("PaymentCheckout", {
      checkoutUrl: "https://checkout.example.com/pay",
      orderCode: "12345",
      planName: "payment.planPremiumName",
    });
  });

  test("shows alert if payment creation succeeds but checkoutUrl is missing", async () => {
    const { getByText } = render(<PaymentScreen />);

    // Success response without checkoutUrl
    apiClient.post.mockResolvedValueOnce({
      data: {
        orderCode: 12345,
      },
    });

    // Press checkout button
    const checkoutBtn = getByText("payment.bankTransfer");
    await act(async () => {
      fireEvent.press(checkoutBtn);
    });

    // Verify Alert.alert is called
    expect(Alert.alert).toHaveBeenCalledWith("payment.createSuccess", "payment.missingLink");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows error alert if payment creation fails", async () => {
    const { getByText } = render(<PaymentScreen />);

    // Mock API failure
    const errorMsg = "Network timeout";
    apiClient.post.mockRejectedValueOnce(new Error(errorMsg));

    // Press checkout button
    const checkoutBtn = getByText("payment.bankTransfer");
    await act(async () => {
      fireEvent.press(checkoutBtn);
    });

    // Verify Alert.alert is called with the API error message
    expect(Alert.alert).toHaveBeenCalledWith("payment.createFailed", errorMsg);
  });
});
