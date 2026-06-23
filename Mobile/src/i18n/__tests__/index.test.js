jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
}));

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(),
}));

const mockAsyncStorage = require("@react-native-async-storage/async-storage");
const mockLocalization = require("expo-localization");

import {
  normalizeLanguageCode,
  getDeviceLanguageCode,
  hydrateStoredLanguage,
  SUPPORTED_LANGUAGE_CODES,
  FALLBACK_LANGUAGE_CODE,
  LANGUAGE_STORAGE_KEY,
} from "../index";

import i18n from "../index";

describe("i18n", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("exports constants", () => {
    expect(SUPPORTED_LANGUAGE_CODES).toEqual(["en", "vi"]);
    expect(FALLBACK_LANGUAGE_CODE).toBe("en");
    expect(LANGUAGE_STORAGE_KEY).toBe("selected_language");
  });

  describe("normalizeLanguageCode", () => {
    test("returns code for supported language", () => {
      expect(normalizeLanguageCode("en")).toBe("en");
      expect(normalizeLanguageCode("vi")).toBe("vi");
    });

    test("extracts base code from language tag", () => {
      expect(normalizeLanguageCode("en-US")).toBe("en");
      expect(normalizeLanguageCode("vi-VN")).toBe("vi");
    });

    test("returns null for unsupported language", () => {
      expect(normalizeLanguageCode("fr")).toBeNull();
      expect(normalizeLanguageCode("zh-CN")).toBeNull();
    });

    test("handles null/undefined", () => {
      expect(normalizeLanguageCode(null)).toBeNull();
      expect(normalizeLanguageCode(undefined)).toBeNull();
    });
  });

  describe("getDeviceLanguageCode", () => {
    test("returns normalized language from device locale", () => {
      mockLocalization.getLocales.mockReturnValue([{ languageCode: "vi", languageTag: "vi-VN" }]);
      expect(getDeviceLanguageCode()).toBe("vi");
    });

    test("falls back to default when device language unsupported", () => {
      mockLocalization.getLocales.mockReturnValue([{ languageCode: "fr", languageTag: "fr-FR" }]);
      expect(getDeviceLanguageCode()).toBe(FALLBACK_LANGUAGE_CODE);
    });

    test("falls back when no locales available", () => {
      mockLocalization.getLocales.mockReturnValue([]);
      expect(getDeviceLanguageCode()).toBe(FALLBACK_LANGUAGE_CODE);
    });
  });

  describe("hydrateStoredLanguage", () => {
    test("uses stored language when valid", async () => {
      mockAsyncStorage.getItem.mockResolvedValue("vi");
      const changeLanguageSpy = jest.spyOn(i18n, "changeLanguage").mockResolvedValue();

      const result = await hydrateStoredLanguage();

      expect(result).toBe("vi");
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY);
    });

    test("falls back to device language when stored language is invalid", async () => {
      mockAsyncStorage.getItem.mockResolvedValue("fr");
      mockLocalization.getLocales.mockReturnValue([{ languageCode: "vi", languageTag: "vi-VN" }]);
      const changeLanguageSpy = jest.spyOn(i18n, "changeLanguage").mockResolvedValue();

      const result = await hydrateStoredLanguage();

      expect(result).toBe("vi");
    });

    test("returns and does not change language when already matching", async () => {
      mockAsyncStorage.getItem.mockResolvedValue("en");
      const changeLanguageSpy = jest.spyOn(i18n, "changeLanguage").mockResolvedValue();
      Object.defineProperty(i18n, "language", { value: "en", writable: true });

      const result = await hydrateStoredLanguage();

      expect(changeLanguageSpy).not.toHaveBeenCalled();
      expect(result).toBe("en");
    });
  });
});
