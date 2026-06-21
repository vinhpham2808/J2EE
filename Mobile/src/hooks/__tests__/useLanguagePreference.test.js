jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
}));

jest.mock("../../i18n", () => {
  const actual = jest.requireActual("../../i18n");
  const mockI18n = { language: "en", changeLanguage: jest.fn() };
  return { ...actual, __esModule: true, default: mockI18n, hydrateStoredLanguage: jest.fn() };
});

jest.mock("../../constants/languages", () => ({
  DEFAULT_LANGUAGE_CODE: "en",
  getLanguageInfo: (code) => {
    const languages = { vi: { code: "vi", flag: "🇻🇳", label: "Tiếng Việt", shortLabel: "VI" }, en: { code: "en", flag: "🇺🇸", label: "English", shortLabel: "EN" } };
    return languages[code] || languages.en;
  },
}));

import { renderHook, act, waitFor } from "@testing-library/react-native";
const mockAsyncStorage = require("@react-native-async-storage/async-storage");
const mockI18n = require("../../i18n");
import useLanguagePreference from "../useLanguagePreference";

describe("useLanguagePreference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18n.hydrateStoredLanguage.mockResolvedValue("en");
  });

  test("initial language code is set", async () => {
    const { result } = renderHook(() => useLanguagePreference());
    expect(result.current.languageCode).toBeTruthy();
    await waitFor(() => expect(result.current.loaded).toBe(true));
  });

  test("starts with loaded false", async () => {
    const { result } = renderHook(() => useLanguagePreference());
    expect(result.current.loaded).toBe(false);
    await waitFor(() => expect(result.current.loaded).toBe(true));
  });

  test("becomes loaded after hydration", async () => {
    const { result } = renderHook(() => useLanguagePreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));
  });

  test("changeLanguage updates code, storage, and i18n", async () => {
    const { result } = renderHook(() => useLanguagePreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => {
      await result.current.changeLanguage("vi");
    });

    expect(result.current.languageCode).toBe("vi");
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("selected_language", "vi");
    expect(mockI18n.default.changeLanguage).toHaveBeenCalledWith("vi");
  });

  test("returns language info object", async () => {
    const { result } = renderHook(() => useLanguagePreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.language).toHaveProperty("code");
    expect(result.current.language).toHaveProperty("flag");
    expect(result.current.language).toHaveProperty("label");
  });
});
