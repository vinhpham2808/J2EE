import React from "react";
import { render, act } from "@testing-library/react-native";
import PaymentCheckoutScreen from "../PaymentCheckoutScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { WebView } from "react-native-webview";
import PaymentCheckoutFallback from "../../../components/Payment/PaymentCheckoutFallback";
import PaymentCheckoutHeader from "../../../components/Payment/PaymentCheckoutHeader";
import usePaymentCheckoutFlow from "../../../hooks/usePaymentCheckoutFlow";

// Mock the react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(),
}));

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock react-native-webview
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    WebView: jest.fn((props) => <View {...props} />),
  };
});

// Mock component dependencies with the requested relative paths
jest.mock("../../../components/Payment/PaymentCheckoutFallback", () => {
  const React = require("react");
  const { View } = require("react-native");
  return jest.fn((props) => <View {...props} />);
});

jest.mock("../../../components/Payment/PaymentCheckoutHeader", () => {
  const React = require("react");
  const { View } = require("react-native");
  return jest.fn((props) => <View {...props} />);
});

// Mock hook with the requested relative path
jest.mock("../../../hooks/usePaymentCheckoutFlow", () => jest.fn());

// Mock layout scales, colors and safeArea to avoid styling or color issues
jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    PRIMARY: "#EF5E83",
    TEXT: "#1A0F14",
  }),
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: jest.fn((insets) => (insets?.top || 0) + 16),
  getSafeAreaBottom: jest.fn((insets, gap) => (insets?.bottom || 0) + gap),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: jest.fn((val) => val),
}));

describe("PaymentCheckoutScreen", () => {
  const mockGoBackToPayment = jest.fn();
  const mockHandleLoadStart = jest.fn();
  const mockHandleLoadEnd = jest.fn();
  const mockHandleNavigationStateChange = jest.fn();
  const mockHandleShouldStartLoad = jest.fn();
  const mockHandleWebViewError = jest.fn();
  const mockWebViewRef = { current: null };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default safe area insets mock values
    useSafeAreaInsets.mockReturnValue({ top: 10, bottom: 20 });
  });

  describe("When checkoutUrl is null/undefined", () => {
    test("renders PaymentCheckoutFallback when checkoutUrl is null", () => {
      usePaymentCheckoutFlow.mockReturnValue({
        checkoutUrl: null,
        isPageLoading: false,
        title: "Test Title",
        webViewRef: mockWebViewRef,
        goBackToPayment: mockGoBackToPayment,
        handleLoadStart: mockHandleLoadStart,
        handleLoadEnd: mockHandleLoadEnd,
        handleNavigationStateChange: mockHandleNavigationStateChange,
        handleShouldStartLoad: mockHandleShouldStartLoad,
        handleWebViewError: mockHandleWebViewError,
      });

      const { UNSAFE_getByType } = render(<PaymentCheckoutScreen />);

      // Verify PaymentCheckoutFallback is rendered
      const fallback = UNSAFE_getByType(PaymentCheckoutFallback);
      expect(fallback).toBeTruthy();
      expect(fallback.props.onBackToPayment).toBe(mockGoBackToPayment);
    });

    test("renders PaymentCheckoutFallback when checkoutUrl is undefined", () => {
      usePaymentCheckoutFlow.mockReturnValue({
        checkoutUrl: undefined,
        isPageLoading: false,
        title: "Test Title",
        webViewRef: mockWebViewRef,
        goBackToPayment: mockGoBackToPayment,
        handleLoadStart: mockHandleLoadStart,
        handleLoadEnd: mockHandleLoadEnd,
        handleNavigationStateChange: mockHandleNavigationStateChange,
        handleShouldStartLoad: mockHandleShouldStartLoad,
        handleWebViewError: mockHandleWebViewError,
      });

      const { UNSAFE_getByType } = render(<PaymentCheckoutScreen />);

      // Verify PaymentCheckoutFallback is rendered
      const fallback = UNSAFE_getByType(PaymentCheckoutFallback);
      expect(fallback).toBeTruthy();
      expect(fallback.props.onBackToPayment).toBe(mockGoBackToPayment);
    });
  });

  describe("When checkoutUrl is present", () => {
    const testCheckoutUrl = "https://checkout.example.com/payment-gateway";

    test("renders PaymentCheckoutHeader, loading overlay, and WebView when isPageLoading is true", () => {
      usePaymentCheckoutFlow.mockReturnValue({
        checkoutUrl: testCheckoutUrl,
        isPageLoading: true,
        title: "Premium Monthly",
        webViewRef: mockWebViewRef,
        goBackToPayment: mockGoBackToPayment,
        handleLoadStart: mockHandleLoadStart,
        handleLoadEnd: mockHandleLoadEnd,
        handleNavigationStateChange: mockHandleNavigationStateChange,
        handleShouldStartLoad: mockHandleShouldStartLoad,
        handleWebViewError: mockHandleWebViewError,
      });

      const { UNSAFE_getByType, getByText } = render(<PaymentCheckoutScreen />);

      // Verify PaymentCheckoutHeader is rendered with correct title
      const header = UNSAFE_getByType(PaymentCheckoutHeader);
      expect(header).toBeTruthy();
      expect(header.props.title).toBe("Premium Monthly");

      // Verify loading overlay and text is displayed
      expect(getByText("paymentCheckout.loading")).toBeTruthy();

      // Verify WebView is rendered with correct checkoutUrl source
      const webView = UNSAFE_getByType(WebView);
      expect(webView).toBeTruthy();
      expect(webView.props.source).toEqual({ uri: testCheckoutUrl });
    });

    test("renders PaymentCheckoutHeader and WebView without loading overlay when isPageLoading is false", () => {
      usePaymentCheckoutFlow.mockReturnValue({
        checkoutUrl: testCheckoutUrl,
        isPageLoading: false,
        title: "Premium Monthly",
        webViewRef: mockWebViewRef,
        goBackToPayment: mockGoBackToPayment,
        handleLoadStart: mockHandleLoadStart,
        handleLoadEnd: mockHandleLoadEnd,
        handleNavigationStateChange: mockHandleNavigationStateChange,
        handleShouldStartLoad: mockHandleShouldStartLoad,
        handleWebViewError: mockHandleWebViewError,
      });

      const { UNSAFE_getByType, queryByText } = render(<PaymentCheckoutScreen />);

      // Verify PaymentCheckoutHeader is rendered with correct title
      const header = UNSAFE_getByType(PaymentCheckoutHeader);
      expect(header).toBeTruthy();
      expect(header.props.title).toBe("Premium Monthly");

      // Verify loading overlay and text is NOT displayed
      expect(queryByText("paymentCheckout.loading")).toBeNull();

      // Verify WebView is rendered with correct checkoutUrl source
      const webView = UNSAFE_getByType(WebView);
      expect(webView).toBeTruthy();
      expect(webView.props.source).toEqual({ uri: testCheckoutUrl });
    });

    test("triggers webview event handlers wrapped in act()", () => {
      usePaymentCheckoutFlow.mockReturnValue({
        checkoutUrl: testCheckoutUrl,
        isPageLoading: false,
        title: "Premium Monthly",
        webViewRef: mockWebViewRef,
        goBackToPayment: mockGoBackToPayment,
        handleLoadStart: mockHandleLoadStart,
        handleLoadEnd: mockHandleLoadEnd,
        handleNavigationStateChange: mockHandleNavigationStateChange,
        handleShouldStartLoad: mockHandleShouldStartLoad,
        handleWebViewError: mockHandleWebViewError,
      });

      const { UNSAFE_getByType } = render(<PaymentCheckoutScreen />);
      const webView = UNSAFE_getByType(WebView);

      // Trigger onLoadStart
      act(() => {
        webView.props.onLoadStart();
      });
      expect(mockHandleLoadStart).toHaveBeenCalledTimes(1);

      // Trigger onLoadEnd
      act(() => {
        webView.props.onLoadEnd();
      });
      expect(mockHandleLoadEnd).toHaveBeenCalledTimes(1);

      // Trigger onNavigationStateChange
      const mockNavState = { url: "https://checkout.example.com/done", canGoBack: false };
      act(() => {
        webView.props.onNavigationStateChange(mockNavState);
      });
      expect(mockHandleNavigationStateChange).toHaveBeenCalledWith(mockNavState);

      // Trigger onShouldStartLoadWithRequest
      const mockRequest = { url: "https://checkout.example.com/start" };
      act(() => {
        webView.props.onShouldStartLoadWithRequest(mockRequest);
      });
      expect(mockHandleShouldStartLoad).toHaveBeenCalledWith(mockRequest);

      // Trigger onError
      act(() => {
        webView.props.onError();
      });
      expect(mockHandleWebViewError).toHaveBeenCalledTimes(1);
    });
  });
});
