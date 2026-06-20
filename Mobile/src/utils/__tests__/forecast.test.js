jest.mock("../../constants/colors", () => ({
  COLORS: {
    EXPENSE: "#EF4444",
    INCOME: "#22C55E",
    INFO: "#6B9BD2",
    PRIMARY: "#ef5e83",
    GOLD: "#FFB84D",
    WARNING: "#FFB84D",
    PRIMARY_DARK: "#660028",
    PRIMARY_LIGHT: "#ffb2bf",
    CARD: "#FFFFFF",
    TEXT_SECONDARY: "#8B7B80",
    CARD_BORDER: "#F0E2E6",
  },
}));

import {
  TREND_CONFIG,
  MONTHS,
  SHORT_MONTHS,
  CATEGORY_COLORS,
  barChartConfig,
  lineChartConfig,
  getRouteForecastMonth,
  buildForecastFromDraft,
  buildInsightFromDraft,
} from "../forecast";

describe("TREND_CONFIG", () => {
  test("has UP, DOWN, STABLE entries", () => {
    expect(TREND_CONFIG.UP.label).toBe("Tăng");
    expect(TREND_CONFIG.DOWN.label).toBe("Giảm");
    expect(TREND_CONFIG.STABLE.label).toBe("Ổn định");
  });
});

describe("MONTHS / SHORT_MONTHS", () => {
  test("MONTHS has 12 entries", () => {
    expect(MONTHS).toHaveLength(12);
    expect(MONTHS[0]).toBe("Tháng 1");
    expect(MONTHS[11]).toBe("Tháng 12");
  });

  test("SHORT_MONTHS has 12 entries", () => {
    expect(SHORT_MONTHS).toHaveLength(12);
    expect(SHORT_MONTHS[0]).toBe("T1");
    expect(SHORT_MONTHS[11]).toBe("T12");
  });
});

describe("CATEGORY_COLORS", () => {
  test("has 8 color entries", () => {
    expect(CATEGORY_COLORS).toHaveLength(8);
  });
});

describe("chartConfig", () => {
  test("barChartConfig has required properties", () => {
    expect(barChartConfig.decimalPlaces).toBe(0);
    expect(typeof barChartConfig.color).toBe("function");
    expect(typeof barChartConfig.labelColor).toBe("function");
  });

  test("lineChartConfig has required properties", () => {
    expect(lineChartConfig.decimalPlaces).toBe(0);
    expect(lineChartConfig.propsForDots.r).toBe("4");
  });
});

describe("getRouteForecastMonth", () => {
  test("returns {year, month} for valid params", () => {
    expect(getRouteForecastMonth({ year: "2025", month: "6" })).toEqual({ year: 2025, month: 6 });
  });

  test("returns null for invalid month", () => {
    expect(getRouteForecastMonth({ year: "2025", month: "13" })).toBeNull();
    expect(getRouteForecastMonth({ year: "2025", month: "0" })).toBeNull();
  });

  test("returns null for missing params", () => {
    expect(getRouteForecastMonth({})).toBeNull();
    expect(getRouteForecastMonth(null)).toBeNull();
  });
});

describe("buildForecastFromDraft", () => {
  test("returns forecast with year, month, categories", () => {
    const draft = { year: 2025, month: 6, categories: [{ name: "Ăn uống" }] };
    expect(buildForecastFromDraft(draft)).toEqual({ year: 2025, month: 6, categories: [{ name: "Ăn uống" }] });
  });

  test("defaults categories to empty array", () => {
    expect(buildForecastFromDraft({ year: 2025, month: 6 })).toEqual({ year: 2025, month: 6, categories: [] });
  });
});

describe("buildInsightFromDraft", () => {
  test("returns insight object when narrative exists", () => {
    const draft = { narrative: "Chi tiêu tăng 20%", generatedAt: "2025-06-15", year: 2025, month: 6 };
    const result = buildInsightFromDraft(draft);
    expect(result.narrative).toBe("Chi tiêu tăng 20%");
    expect(result.generatedAt).toBe("2025-06-15");
  });

  test("returns null when no narrative", () => {
    expect(buildInsightFromDraft({ year: 2025, month: 6 })).toBeNull();
    expect(buildInsightFromDraft(null)).toBeNull();
  });
});
