jest.mock("../format", () => ({
  getApiErrorMessage: jest.fn((error, fallback) => {
    if (error?.response?.data?.message) return error.response.data.message;
    return fallback || "";
  }),
}));

import { getRetryAfterSeconds } from "../authOtp";

describe("getRetryAfterSeconds", () => {
  test("returns retryAfterSeconds from response data", () => {
    const error = { response: { data: { retryAfterSeconds: 30 } } };
    expect(getRetryAfterSeconds(error)).toBe(30);
  });

  test("ceil decimal retryAfterSeconds", () => {
    const error = { response: { data: { retryAfterSeconds: 30.5 } } };
    expect(getRetryAfterSeconds(error)).toBe(31);
  });

  test("returns 0 for invalid retryAfterSeconds", () => {
    expect(getRetryAfterSeconds({ response: { data: { retryAfterSeconds: -5 } } })).toBe(0);
    expect(getRetryAfterSeconds({ response: { data: {} } })).toBe(0);
  });

  test("parses seconds from error message", () => {
    const getApiErrorMessage = require("../format").getApiErrorMessage;
    getApiErrorMessage.mockReturnValueOnce("Vui lòng thử lại sau 60 giây");
    const error = { message: "Vui lòng thử lại sau 60 giây" };
    expect(getRetryAfterSeconds(error)).toBe(60);
  });

  test("returns 0 when no retry info found", () => {
    const getApiErrorMessage = require("../format").getApiErrorMessage;
    getApiErrorMessage.mockReturnValueOnce("");
    expect(getRetryAfterSeconds({})).toBe(0);
  });
});
