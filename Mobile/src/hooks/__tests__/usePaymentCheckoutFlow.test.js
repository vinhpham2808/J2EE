jest.mock("../../utils/paymentUrl", () => ({
  buildPaymentResultParams: jest.fn((url) => ({ url })),
  isExternalPaymentScheme: jest.fn((url) => url.startsWith("external://")),
  isPaymentResultUrl: jest.fn((url) => url.startsWith("paymentresult://")),
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

import { renderHook, act } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";
import usePaymentCheckoutFlow from "../usePaymentCheckoutFlow";

describe("usePaymentCheckoutFlow", () => {
  const { useNavigation, useRoute } = require("@react-navigation/native");
  const { isPaymentResultUrl, isExternalPaymentScheme, buildPaymentResultParams } = require("../../utils/paymentUrl");

  beforeEach(() => { jest.clearAllMocks(); });

  test("returns initial state from route params", () => {
    const navigation = { replace: jest.fn() };
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({ params: { checkoutUrl: "https://payment.example.com/checkout", orderCode: "ORD123", planName: "Premium Monthly" } });

    const { result } = renderHook(() => usePaymentCheckoutFlow());
    expect(result.current.checkoutUrl).toBe("https://payment.example.com/checkout");
    expect(result.current.title).toBe("Premium Monthly");
    expect(result.current.isPageLoading).toBe(true);
    expect(result.current.canGoBack).toBe(false);
  });

  test("returns title only when planName is set", () => {
    const navigation = { replace: jest.fn() };
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({ params: { checkoutUrl: "https://example.com/checkout" } });

    const { result } = renderHook(() => usePaymentCheckoutFlow());
    expect(result.current.title).toBeUndefined();
  });



  test("handleShouldStartLoad blocks payment result URL", () => {
    isPaymentResultUrl.mockReturnValueOnce(true);
    const navigation = { replace: jest.fn() };
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({ params: { checkoutUrl: "https://example.com/checkout", orderCode: "ORD123" } });

    const { result } = renderHook(() => usePaymentCheckoutFlow());

    const shouldLoad = result.current.handleShouldStartLoad({ url: "paymentresult://success" });
    expect(shouldLoad).toBe(false);
    expect(navigation.replace).toHaveBeenCalled();
  });

  test("handleShouldStartLoad blocks external scheme", () => {
    isPaymentResultUrl.mockReturnValueOnce(false);
    isExternalPaymentScheme.mockReturnValueOnce(true);
    const linkingSpy = jest.spyOn(Linking, "openURL").mockResolvedValueOnce(undefined);
    const navigation = { replace: jest.fn() };
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({ params: { checkoutUrl: "https://example.com/checkout" } });

    const { result } = renderHook(() => usePaymentCheckoutFlow());

    const shouldLoad = result.current.handleShouldStartLoad({ url: "external://banking" });
    expect(shouldLoad).toBe(false);
    expect(linkingSpy).toHaveBeenCalledWith("external://banking");
  });

  test("handleShouldStartLoad allows normal URLs", () => {
    isPaymentResultUrl.mockReturnValueOnce(false);
    isExternalPaymentScheme.mockReturnValueOnce(false);
    const navigation = { replace: jest.fn() };
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({ params: { checkoutUrl: "https://example.com/checkout" } });

    const { result } = renderHook(() => usePaymentCheckoutFlow());

    const shouldLoad = result.current.handleShouldStartLoad({ url: "https://example.com/normal-page" });
    expect(shouldLoad).toBe(true);
  });

  test("handleNavigationStateChange updates canGoBack and intercepts URL", () => {
    isPaymentResultUrl.mockReturnValueOnce(false);
    const navigation = { replace: jest.fn() };
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({ params: { checkoutUrl: "https://example.com/checkout" } });

    const { result } = renderHook(() => usePaymentCheckoutFlow());

    act(() => { result.current.handleNavigationStateChange({ canGoBack: true, url: "https://example.com/page2" }); });
    expect(result.current.canGoBack).toBe(true);
  });

  test("goBackInWebView calls webViewRef.goBack", () => {
    const navigation = { replace: jest.fn() };
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({ params: { checkoutUrl: "https://example.com/checkout" } });

    const { result } = renderHook(() => usePaymentCheckoutFlow());
    const goBackMock = jest.fn();
    result.current.webViewRef.current = { goBack: goBackMock };

    act(() => { result.current.goBackInWebView(); });
    expect(goBackMock).toHaveBeenCalled();
  });

  test("goBackToPayment navigates to Payment", () => {
    const navigation = { replace: jest.fn() };
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({ params: { checkoutUrl: "https://example.com/checkout" } });

    const { result } = renderHook(() => usePaymentCheckoutFlow());

    act(() => { result.current.goBackToPayment(); });
    expect(navigation.replace).toHaveBeenCalledWith("Payment");
  });

  test("handleLoadStart and handleLoadEnd toggle loading", () => {
    const navigation = { replace: jest.fn() };
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({ params: { checkoutUrl: "https://example.com/checkout" } });

    const { result } = renderHook(() => usePaymentCheckoutFlow());

    act(() => { result.current.handleLoadStart(); });
    expect(result.current.isPageLoading).toBe(true);

    act(() => { result.current.handleLoadEnd(); });
    expect(result.current.isPageLoading).toBe(false);
  });

  test("handleWebViewError shows alert", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const navigation = { replace: jest.fn() };
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({ params: { checkoutUrl: "https://example.com/checkout" } });

    const { result } = renderHook(() => usePaymentCheckoutFlow());

    act(() => { result.current.handleWebViewError(); });
    expect(result.current.isPageLoading).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith("paymentCheckout.pageLoadFailTitle", "paymentCheckout.pageLoadFailMsg");
  });
});
