import { LANGUAGES, DEFAULT_LANGUAGE_CODE, getLanguageInfo } from "../languages";

describe("languages constants", () => {
  test("has correct number of languages", () => {
    expect(LANGUAGES).toHaveLength(2);
  });

  test("default language code is en", () => {
    expect(DEFAULT_LANGUAGE_CODE).toBe("en");
  });

  test("Vietnamese has correct structure", () => {
    const vi = LANGUAGES.find((l) => l.code === "vi");
    expect(vi).toBeDefined();
    expect(vi.shortLabel).toBe("VI");
    expect(vi.label).toBe("Tiếng Việt");
    expect(vi.flag).toBe("🇻🇳");
  });

  test("English has correct structure", () => {
    const en = LANGUAGES.find((l) => l.code === "en");
    expect(en).toBeDefined();
    expect(en.shortLabel).toBe("EN");
    expect(en.label).toBe("English");
    expect(en.flag).toBe("🇺🇸");
  });

  test("getLanguageInfo returns matching language", () => {
    expect(getLanguageInfo("vi")).toEqual(LANGUAGES[0]);
    expect(getLanguageInfo("en")).toEqual(LANGUAGES[1]);
  });

  test("getLanguageInfo returns default for unknown code", () => {
    const result = getLanguageInfo("fr");
    const english = LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE_CODE);
    expect(result.code).toBe(english.code);
  });

  test("getLanguageInfo returns first language when nothing matches", () => {
    const result = getLanguageInfo(null);
    expect(result).toBeDefined();
  });

  test("every language has all required fields", () => {
    LANGUAGES.forEach((lang) => {
      expect(lang).toHaveProperty("code");
      expect(lang).toHaveProperty("shortLabel");
      expect(lang).toHaveProperty("label");
      expect(lang).toHaveProperty("flag");
      expect(lang).toHaveProperty("settingsLabel");
      expect(lang).toHaveProperty("changedMessageKey");
    });
  });
});
