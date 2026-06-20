jest.mock("../../services/apiClient", () => ({ post: jest.fn() }));
jest.mock("../../constants/api", () => ({ API_ENDPOINTS: { RESEND_OTP: "/otp/resend" } }));
jest.mock("../format", () => ({ getApiErrorMessage: (e, f) => e?.response?.data?.message || f }));
jest.mock("../authOtp", () => ({ getRetryAfterSeconds: (e) => e?.response?.data?.retryAfterSeconds || 0 }));

import { isActivationRequiredError, getActivationEmail, openActivationOtp } from "../authActivation";

describe("authActivation", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("isActivationRequiredError", () => {
    test("returns true when response.data.needsActivation is true", () => {
      expect(isActivationRequiredError({ response: { data: { needsActivation: true } } })).toBe(true);
    });

    test("returns false when needsActivation is false", () => {
      expect(isActivationRequiredError({ response: { data: { needsActivation: false } } })).toBe(false);
    });

    test("returns true when error message contains Vietnamese activation keywords", () => {
      expect(isActivationRequiredError({ response: { data: { message: "Tài khoản chưa được kích hoạt" } } })).toBe(true);
      expect(isActivationRequiredError({ response: { data: { message: "Vui lòng xác thực otp" } } })).toBe(true);
    });

    test("returns false for unrelated error messages", () => {
      expect(isActivationRequiredError({ response: { data: { message: "Sai mật khẩu" } } })).toBe(false);
    });

    test("returns false for null/undefined error", () => {
      expect(isActivationRequiredError(null)).toBe(false);
      expect(isActivationRequiredError(undefined)).toBe(false);
      expect(isActivationRequiredError({})).toBe(false);
    });
  });

  describe("getActivationEmail", () => {
    test("returns email from error response", () => {
      expect(getActivationEmail({ response: { data: { email: "user@test.com" } } })).toBe("user@test.com");
    });

    test("returns fallback when no email in error", () => {
      expect(getActivationEmail({}, "fallback@test.com")).toBe("fallback@test.com");
    });

    test("returns empty string fallback by default", () => {
      expect(getActivationEmail({})).toBe("");
    });
  });

  describe("openActivationOtp", () => {
    const mockNavigate = jest.fn();
    const apiClient = require("../../services/apiClient");

    test("calls resend OTP and navigates on success", async () => {
      apiClient.post.mockResolvedValueOnce({});

      await openActivationOtp({ navigate: mockNavigate }, "test@example.com");

      expect(apiClient.post).toHaveBeenCalledWith("/otp/resend", { email: "test@example.com" });
      expect(mockNavigate).toHaveBeenCalledWith("VerifyOtp", { email: "test@example.com" });
    });

    test("includes countdown when retryAfterSeconds > 0", async () => {
      apiClient.post.mockRejectedValueOnce({ response: { data: { retryAfterSeconds: 30 } } });

      await openActivationOtp({ navigate: mockNavigate }, "test@example.com");

      expect(mockNavigate).toHaveBeenCalledWith("VerifyOtp", { email: "test@example.com", initialCountdown: 30 });
    });

    test("throws when retryAfterSeconds is 0 or missing", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Network error"));

      await expect(openActivationOtp({ navigate: mockNavigate }, "test@example.com")).rejects.toThrow("Network error");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
