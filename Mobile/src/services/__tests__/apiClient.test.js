jest.mock("axios", () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: {},
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  const mockAxiosCreate = jest.fn(() => mockAxiosInstance);
  mockAxiosCreate.create = jest.fn(() => mockAxiosInstance);
  return mockAxiosCreate;
});

jest.mock("../../constants/api", () => ({ BASE_URL: "https://test-api.com/api/v1.0" }));
jest.mock("../../storage/tokenStorage", () => ({
  tokenStorage: { getToken: jest.fn(), getRememberPreference: jest.fn() },
}));

describe("apiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test("creates axios instance with correct config", () => {
    const axios = require("axios");
    require("../apiClient");

    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: "https://test-api.com/api/v1.0",
      timeout: 120000,
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        "X-Client-Platform": "mobile",
      }),
    }));
  });

  test("registers a request interceptor", () => {
    const axios = require("axios");
    const mockInstance = axios.create();
    require("../apiClient");

    expect(mockInstance.interceptors.request.use).toHaveBeenCalledWith(expect.any(Function));
  });

  describe("request interceptor", () => {
    test("skips token for public endpoints", async () => {
      const axios = require("axios");
      const { tokenStorage } = require("../../storage/tokenStorage");

      const mockInstance = axios.create();
      require("../apiClient");

      const interceptorFn = mockInstance.interceptors.request.use.mock.calls[0][0];
      const config = { url: "/login", headers: {} };

      const result = await interceptorFn(config);
      expect(result).toBe(config);
      expect(tokenStorage.getToken).not.toHaveBeenCalled();
    });

    test("adds Authorization header for protected endpoints", async () => {
      const axios = require("axios");
      const { tokenStorage } = require("../../storage/tokenStorage");
      tokenStorage.getToken.mockResolvedValueOnce("test-jwt-token");

      const mockInstance = axios.create();
      require("../apiClient");

      const interceptorFn = mockInstance.interceptors.request.use.mock.calls[0][0];
      const config = { url: "/dashboard", headers: {} };

      const result = await interceptorFn(config);
      expect(result.headers.Authorization).toBe("Bearer test-jwt-token");
      expect(tokenStorage.getToken).toHaveBeenCalled();
    });

    test("does not add Authorization when no token available", async () => {
      const axios = require("axios");
      const { tokenStorage } = require("../../storage/tokenStorage");
      tokenStorage.getToken.mockResolvedValueOnce(null);

      const mockInstance = axios.create();
      require("../apiClient");

      const interceptorFn = mockInstance.interceptors.request.use.mock.calls[0][0];
      const config = { url: "/expenses", headers: {} };

      const result = await interceptorFn(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });
});
