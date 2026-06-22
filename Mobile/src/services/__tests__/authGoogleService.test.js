jest.mock("../../services/apiClient", () => ({ post: jest.fn() }));
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    getTokens: jest.fn(),
    signOut: jest.fn(),
  },
  isCancelledResponse: jest.fn(() => false),
  isErrorWithCode: jest.fn(() => false),
  isSuccessResponse: jest.fn(() => true),
  statusCodes: { SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED", IN_PROGRESS: "IN_PROGRESS", PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE" },
}));

function setupEnv() {
  delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
}

describe("authGoogleService", () => {
  let apiClient;
  let GoogleSignin, isCancelledResponse, isErrorWithCode, isSuccessResponse;
  let authGoogleService;

  beforeAll(() => {
    setupEnv();
    jest.resetModules();
    authGoogleService = require("../authGoogleService");
    apiClient = require("../../services/apiClient");
    const gs = require("@react-native-google-signin/google-signin");
    GoogleSignin = gs.GoogleSignin;
    isCancelledResponse = gs.isCancelledResponse;
    isErrorWithCode = gs.isErrorWithCode;
    isSuccessResponse = gs.isSuccessResponse;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("configureGoogleSignin", () => {
    test("configures GoogleSignin with webClientId", () => {
      authGoogleService.configureGoogleSignin();
      expect(GoogleSignin.configure).toHaveBeenCalledWith(expect.objectContaining({
        webClientId: "test-client-id.apps.googleusercontent.com",
        scopes: ["email", "profile"],
        offlineAccess: false,
      }));
    });
  });

  describe("signInWithGoogleNative", () => {
    test("returns null when sign-in is cancelled", async () => {
      isCancelledResponse.mockReturnValueOnce(true);
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockResolvedValueOnce({ data: null });

      const result = await authGoogleService.signInWithGoogleNative();
      expect(result).toBeNull();
    });

    test("returns null when response is not success", async () => {
      isCancelledResponse.mockReturnValueOnce(false);
      isSuccessResponse.mockReturnValueOnce(false);
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockResolvedValueOnce({ data: null });

      const result = await authGoogleService.signInWithGoogleNative();
      expect(result).toBeNull();
    });

    test("returns user with idToken on successful sign-in", async () => {
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockResolvedValueOnce({
        data: { user: { email: "test@gmail.com" }, idToken: "token-123" },
      });

      const result = await authGoogleService.signInWithGoogleNative();
      expect(result).toMatchObject({
        user: { email: "test@gmail.com" },
        idToken: "token-123",
      });
    });

    test("obtains idToken via getTokens when not on user data", async () => {
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockResolvedValueOnce({
        data: { user: { email: "test@gmail.com" } },
      });
      GoogleSignin.getTokens.mockResolvedValueOnce({ idToken: "token-from-get-tokens" });

      const result = await authGoogleService.signInWithGoogleNative();
      expect(result.idToken).toBe("token-from-get-tokens");
      expect(GoogleSignin.getTokens).toHaveBeenCalled();
    });

    test("throws when idToken is missing", async () => {
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockResolvedValueOnce({
        data: { user: { email: "test@gmail.com" } },
      });
      GoogleSignin.getTokens.mockResolvedValueOnce({});

      await expect(authGoogleService.signInWithGoogleNative()).rejects.toThrow("Không nhận được idToken");
    });

    test("returns null when SIGN_IN_CANCELLED error", async () => {
      isErrorWithCode.mockReturnValueOnce(true);
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockRejectedValueOnce({ code: "SIGN_IN_CANCELLED" });

      const result = await authGoogleService.signInWithGoogleNative();
      expect(result).toBeNull();
    });

    test("throws on IN_PROGRESS error", async () => {
      isErrorWithCode.mockReturnValueOnce(true);
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockRejectedValueOnce({ code: "IN_PROGRESS" });

      await expect(authGoogleService.signInWithGoogleNative()).rejects.toThrow("Google đăng nhập đang được xử lý");
    });

    test("throws on PLAY_SERVICES_NOT_AVAILABLE error", async () => {
      isErrorWithCode.mockReturnValueOnce(true);
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockRejectedValueOnce({ code: "PLAY_SERVICES_NOT_AVAILABLE" });

      await expect(authGoogleService.signInWithGoogleNative()).rejects.toThrow("Google Play Services không khả dụng");
    });

    test("re-throws error for unknown error code", async () => {
      isErrorWithCode.mockReturnValueOnce(true);
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockRejectedValueOnce(new Error("Unknown"));

      await expect(authGoogleService.signInWithGoogleNative()).rejects.toThrow("Unknown");
    });

    test("throws without error code", async () => {
      isErrorWithCode.mockReturnValueOnce(false);
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockRejectedValueOnce(new Error("Generic error"));

      await expect(authGoogleService.signInWithGoogleNative()).rejects.toThrow("Generic error");
    });
  });

  describe("exchangeGoogleToken", () => {
    test("posts idToken and returns data", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { token: "jwt-token" } });

      const result = await authGoogleService.exchangeGoogleToken("google-id-token");
      expect(result).toEqual({ token: "jwt-token" });
      expect(apiClient.post).toHaveBeenCalledWith("/auth/google", { idToken: "google-id-token" });
    });

    test("throws when idToken is empty", async () => {
      await expect(authGoogleService.exchangeGoogleToken("")).rejects.toThrow("Không thể đăng nhập bằng Google vì thiếu idToken");
    });

    test("throws when idToken is null", async () => {
      await expect(authGoogleService.exchangeGoogleToken(null)).rejects.toThrow("Không thể đăng nhập bằng Google vì thiếu idToken");
    });

    test("returns empty object when response data is falsy", async () => {
      apiClient.post.mockResolvedValueOnce({ data: null });

      const result = await authGoogleService.exchangeGoogleToken("valid-token");
      expect(result).toEqual({});
    });
  });

  describe("signOutGoogle", () => {
    test("calls GoogleSignin.signOut", async () => {
      GoogleSignin.signOut.mockResolvedValueOnce(undefined);

      await authGoogleService.signOutGoogle();
      expect(GoogleSignin.signOut).toHaveBeenCalled();
    });

    test("does not throw on signOut failure", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      GoogleSignin.signOut.mockRejectedValueOnce(new Error("Sign out failed"));

      await expect(authGoogleService.signOutGoogle()).resolves.toBeUndefined();
      consoleWarnSpy.mockRestore();
    });
  });
});
