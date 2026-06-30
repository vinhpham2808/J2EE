let mockStore = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key) => mockStore[key] || null),
  setItem: jest.fn(async (key, value) => { mockStore[key] = value; }),
  removeItem: jest.fn(async (key) => { delete mockStore[key]; }),
}));

import { tokenStorage } from "../tokenStorage";

beforeEach(() => {
  jest.clearAllMocks();
  mockStore = {};
});

describe("getToken", () => {
  test("returns null when no token stored", async () => {
    const token = await tokenStorage.getToken();
    expect(token).toBeNull();
  });
});

describe("setToken", () => {
  test("persists to AsyncStorage when remember=true", async () => {
    await tokenStorage.setToken("my-token", { remember: true });
    expect(require("@react-native-async-storage/async-storage").setItem)
      .toHaveBeenCalledWith("mm_token", "my-token");
    expect(require("@react-native-async-storage/async-storage").setItem)
      .toHaveBeenCalledWith("mm_remember_login", "1");
  });

  test("keeps in memory when remember=false", async () => {
    await tokenStorage.setToken("session-token", { remember: false });
    expect(require("@react-native-async-storage/async-storage").removeItem)
      .toHaveBeenCalledWith("mm_token");
    expect(require("@react-native-async-storage/async-storage").setItem)
      .toHaveBeenCalledWith("mm_remember_login", "0");
  });
});

describe("getRememberPreference", () => {
  test("returns true when remember flag is '1'", async () => {
    mockStore = { mm_remember_login: "1" };
    expect(await tokenStorage.getRememberPreference()).toBe(true);
  });

  test("returns false when remember flag is '0'", async () => {
    mockStore = { mm_remember_login: "0" };
    expect(await tokenStorage.getRememberPreference()).toBe(false);
  });

  test("returns false when no preference stored", async () => {
    expect(await tokenStorage.getRememberPreference()).toBe(false);
  });
});

describe("setRememberPreference", () => {
  test("stores remember preference as '1'", async () => {
    await tokenStorage.setRememberPreference(true);
    expect(require("@react-native-async-storage/async-storage").setItem)
      .toHaveBeenCalledWith("mm_remember_login", "1");
  });

  test("stores remember preference as '0'", async () => {
    await tokenStorage.setRememberPreference(false);
    expect(require("@react-native-async-storage/async-storage").setItem)
      .toHaveBeenCalledWith("mm_remember_login", "0");
  });
});

describe("clearToken", () => {
  test("removes token and remember preference from storage", async () => {
    await tokenStorage.setToken("my-token", { remember: true });
    await tokenStorage.clearToken();

    expect(require("@react-native-async-storage/async-storage").removeItem)
      .toHaveBeenCalledWith("mm_token");
    expect(require("@react-native-async-storage/async-storage").removeItem)
      .toHaveBeenCalledWith("mm_remember_login");
  });
});
