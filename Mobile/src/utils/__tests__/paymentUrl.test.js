import {
  APP_RESULT_PREFIX,
  WEB_SUCCESS_PATH,
  WEB_CANCEL_PATH,
  parsePaymentCheckoutUrl,
  hasPaymentResultParams,
  derivePaymentResultFromUrl,
  isPaymentResultUrl,
  isExternalPaymentScheme,
  buildPaymentResultParams,
} from "../paymentUrl";

describe("parsePaymentCheckoutUrl", () => {
  test("parses app scheme URL with query params", () => {
    const result = parsePaymentCheckoutUrl("moneymanager://payment/success?orderCode=123&status=PAID");
    expect(result.pathname).toBe("/success");
    expect(result.getParam("orderCode")).toBe("123");
    expect(result.getParam("status")).toBe("PAID");
  });

  test("parses web URL with /payment/success path", () => {
    const result = parsePaymentCheckoutUrl("https://example.com/payment/success?orderCode=456");
    expect(result.pathname).toBe("/payment/success");
    expect(result.getParam("orderCode")).toBe("456");
  });

  test("parses web URL with /payment/cancel path", () => {
    const result = parsePaymentCheckoutUrl("https://example.com/payment/cancel");
    expect(result.pathname).toBe("/payment/cancel");
  });

  test("returns empty string for missing param", () => {
    const result = parsePaymentCheckoutUrl("moneymanager://payment/success");
    expect(result.getParam("orderCode")).toBe("");
  });
});

describe("hasPaymentResultParams", () => {
  test("returns true when orderCode and valid status present", () => {
    const parsed = parsePaymentCheckoutUrl("?orderCode=123&status=PAID");
    expect(hasPaymentResultParams(parsed)).toBe(true);
  });

  test("returns false when orderCode missing", () => {
    const parsed = parsePaymentCheckoutUrl("?status=PAID");
    expect(hasPaymentResultParams(parsed)).toBe(false);
  });

  test("returns true when id present with valid status", () => {
    const parsed = parsePaymentCheckoutUrl("?id=456&status=CANCELLED");
    expect(hasPaymentResultParams(parsed)).toBe(true);
  });
});

describe("derivePaymentResultFromUrl", () => {
  test("returns 'cancel' for web cancel path", () => {
    const parsed = parsePaymentCheckoutUrl("https://example.com/payment/cancel");
    expect(derivePaymentResultFromUrl(parsed, "https://example.com/payment/cancel")).toBe("cancel");
  });

  test("returns 'success' for web success path", () => {
    const parsed = parsePaymentCheckoutUrl("https://example.com/payment/success");
    expect(derivePaymentResultFromUrl(parsed, "https://example.com/payment/success")).toBe("success");
  });

  test("returns 'success' for app scheme result", () => {
    const parsed = parsePaymentCheckoutUrl("moneymanager://payment/success");
    expect(derivePaymentResultFromUrl(parsed, "moneymanager://payment/success")).toBe("success");
  });

  test("returns the status path segment for app scheme", () => {
    const parsed = parsePaymentCheckoutUrl("moneymanager://payment/CANCELLED");
    expect(derivePaymentResultFromUrl(parsed, "moneymanager://payment/CANCELLED")).toBe("CANCELLED");
  });

  test("defaults to 'success' when no cancel indicator", () => {
    const parsed = parsePaymentCheckoutUrl("");
    expect(derivePaymentResultFromUrl(parsed, "")).toBe("success");
  });
});

describe("isPaymentResultUrl", () => {
  test("detects app scheme payment URLs", () => {
    expect(isPaymentResultUrl("moneymanager://payment/success")).toBe(true);
    expect(isPaymentResultUrl("moneymanager://payment/CANCELLED")).toBe(true);
  });

  test("detects web success/cancel paths", () => {
    expect(isPaymentResultUrl("https://example.com/payment/success")).toBe(true);
    expect(isPaymentResultUrl("https://example.com/payment/cancel")).toBe(true);
  });

  test("detects URLs with payment result params", () => {
    expect(isPaymentResultUrl("https://example.com/redirect?orderCode=123&status=PAID")).toBe(true);
  });

  test("returns false for non-payment URLs", () => {
    expect(isPaymentResultUrl("https://example.com/home")).toBe(false);
    expect(isPaymentResultUrl("")).toBe(false);
  });
});

describe("isExternalPaymentScheme", () => {
  test("returns false for http and https URLs", () => {
    expect(isExternalPaymentScheme("http://example.com")).toBe(false);
    expect(isExternalPaymentScheme("https://example.com")).toBe(false);
  });

  test("returns false for about:blank", () => {
    expect(isExternalPaymentScheme("about:blank")).toBe(false);
  });

  test("returns true for custom scheme URLs", () => {
    expect(isExternalPaymentScheme("moneymanager://payment/success")).toBe(true);
    expect(isExternalPaymentScheme("vnp://return?code=123")).toBe(true);
  });

  test("handles empty input", () => {
    expect(isExternalPaymentScheme("")).toBe(true);
  });
});

describe("buildPaymentResultParams", () => {
  test("extracts result, orderCode, status, id from URL", () => {
    const result = buildPaymentResultParams("moneymanager://payment/success?orderCode=789&status=PAID&id=abc");
    expect(result.result).toBe("success");
    expect(result.orderCode).toBe("789");
    expect(result.status).toBe("PAID");
    expect(result.id).toBe("abc");
  });

  test("uses fallbackOrderCode when orderCode missing", () => {
    const result = buildPaymentResultParams("moneymanager://payment/success", "fallback123");
    expect(result.orderCode).toBe("fallback123");
  });
});
