export const APP_RESULT_PREFIX = "moneymanager://payment/";
export const WEB_SUCCESS_PATH = "/payment/success";
export const WEB_CANCEL_PATH = "/payment/cancel";

export function parsePaymentCheckoutUrl(rawUrl) {
  const [baseUrl, queryString = ""] = rawUrl.split("?");
  const path = baseUrl.includes("://")
    ? `/${baseUrl.split("://")[1].split("/").slice(1).join("/")}`
    : baseUrl;

  const searchParams = new Map();
  queryString.split("&").filter(Boolean).forEach((item) => {
    const [key, value = ""] = item.split("=");
    searchParams.set(decodeURIComponent(key), decodeURIComponent(value));
  });

  return {
    pathname: path,
    getParam: (key) => searchParams.get(key) || ""
  };
}

export function derivePaymentResultFromUrl(parsedUrl, rawUrl) {
  if (rawUrl.includes(WEB_CANCEL_PATH) || parsedUrl.pathname.endsWith("/cancel")) {
    return "cancel";
  }
  if (rawUrl.includes(WEB_SUCCESS_PATH) || parsedUrl.pathname.endsWith("/success")) {
    return "success";
  }
  if (rawUrl.startsWith(APP_RESULT_PREFIX)) {
    return rawUrl.slice(APP_RESULT_PREFIX.length).split("?")[0] || "success";
  }
  return "success";
}

export function isPaymentResultUrl(url) {
  return url.startsWith(APP_RESULT_PREFIX)
    || url.includes(WEB_SUCCESS_PATH)
    || url.includes(WEB_CANCEL_PATH);
}

export function isExternalPaymentScheme(url) {
  const lowerUrl = url.toLowerCase();
  return !lowerUrl.startsWith("http://")
    && !lowerUrl.startsWith("https://")
    && !lowerUrl.startsWith("about:blank");
}

export function buildPaymentResultParams(resultUrl, fallbackOrderCode = "") {
  const parsedUrl = parsePaymentCheckoutUrl(resultUrl);

  return {
    result: derivePaymentResultFromUrl(parsedUrl, resultUrl),
    orderCode: parsedUrl.getParam("orderCode") || fallbackOrderCode || "",
    status: parsedUrl.getParam("status") || "",
    id: parsedUrl.getParam("id") || ""
  };
}
