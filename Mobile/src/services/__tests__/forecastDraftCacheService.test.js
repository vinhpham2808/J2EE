import { saveAiForecastDraft, getAiForecastDraft, clearAiForecastDraft } from "../forecastDraftCacheService";

describe("forecastDraftCacheService", () => {
  beforeEach(() => { clearAiForecastDraft(2026, 1); });

  describe("saveAiForecastDraft", () => {
    test("saves and returns normalized draft", () => {
      const result = saveAiForecastDraft({ year: 2026, month: 1, insight: "Good" }, 2026, 1);
      expect(result).toMatchObject({
        year: 2026,
        month: 1,
        insight: "Good",
        categories: [],
        anomalies: [],
      });
      expect(result.generatedAt).toBeDefined();
      expect(result.savedAt).toBeDefined();
    });

    test("uses fallback year/month when result values missing", () => {
      const result = saveAiForecastDraft({ insight: "OK" }, 2025, 12);
      expect(result.year).toBe(2025);
      expect(result.month).toBe(12);
    });

    test("returns null if result is null or undefined", () => {
      expect(saveAiForecastDraft(null, 2026, 1)).toBeNull();
      expect(saveAiForecastDraft(undefined, 2026, 1)).toBeNull();
    });

    test("returns null for invalid month", () => {
      expect(saveAiForecastDraft({}, 2026, 13)).toBeNull();
      expect(saveAiForecastDraft({}, 2026, 0)).toBeNull();
    });
  });

  describe("getAiForecastDraft", () => {
    test("returns saved draft", () => {
      saveAiForecastDraft({ year: 2026, month: 6, insight: "Better" }, 2026, 6);
      const draft = getAiForecastDraft(2026, 6);
      expect(draft).not.toBeNull();
      expect(draft.insight).toBe("Better");
    });

    test("returns null for non-existent key", () => {
      expect(getAiForecastDraft(2020, 1)).toBeNull();
    });

    test("returns null for invalid key", () => {
      expect(getAiForecastDraft(2026, 13)).toBeNull();
    });
  });

  describe("clearAiForecastDraft", () => {
    test("removes draft from cache", () => {
      saveAiForecastDraft({ year: 2026, month: 3, insight: "Clear me" }, 2026, 3);
      clearAiForecastDraft(2026, 3);
      expect(getAiForecastDraft(2026, 3)).toBeNull();
    });

    test("does nothing for non-existent key", () => {
      expect(() => clearAiForecastDraft(2025, 6)).not.toThrow();
    });
  });
});
