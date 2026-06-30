import {
  PARENT_WALLET_NAME,
  JAR_CATEGORY_COLORS,
  JAR_COLORS,
  JAR_EMOJI_CATEGORIES,
  formatJarMoney,
  getJarBalanceAmount,
  polarToCartesian,
  describeDonutArc,
  getJarActualPercent,
  getJarProgressWidth,
} from "../jar";

describe("constants", () => {
  test("PARENT_WALLET_NAME is defined", () => {
    expect(PARENT_WALLET_NAME).toBe("Ví tổng");
  });

  test("JAR_CATEGORY_COLORS has 8 colors", () => {
    expect(JAR_CATEGORY_COLORS).toHaveLength(8);
    JAR_CATEGORY_COLORS.forEach((c) => expect(c).toMatch(/^#/));
  });

  test("JAR_COLORS has 10 entries with value and label", () => {
    expect(JAR_COLORS).toHaveLength(10);
    JAR_COLORS.forEach((c) => {
      expect(c).toHaveProperty("value");
      expect(c).toHaveProperty("label");
    });
  });

  test("JAR_EMOJI_CATEGORIES has 4 categories with emoji arrays", () => {
    expect(JAR_EMOJI_CATEGORIES).toHaveLength(4);
    JAR_EMOJI_CATEGORIES.forEach((cat) => {
      expect(cat).toHaveProperty("localeKey");
      expect(cat).toHaveProperty("emojis");
      expect(cat.emojis.length).toBeGreaterThan(0);
    });
  });
});

describe("formatJarMoney", () => {
  test("formats number with VND symbol", () => {
    const result = formatJarMoney(500000);
    expect(result).toMatch(/₫/);
    expect(result).toMatch(/500/);
  });

  test("handles undefined by defaulting to 0", () => {
    const result = formatJarMoney(undefined);
    expect(result).toMatch(/0/);
  });
});

describe("getJarBalanceAmount", () => {
  test("extracts currentBalance first", () => {
    expect(getJarBalanceAmount({ currentBalance: 100, balance: 200 })).toBe(100);
  });

  test("falls back to balance", () => {
    expect(getJarBalanceAmount({ balance: 200 })).toBe(200);
  });

  test("returns 0 for missing or invalid values", () => {
    expect(getJarBalanceAmount({})).toBe(0);
    expect(getJarBalanceAmount(null)).toBe(0);
  });
});

describe("polarToCartesian", () => {
  test("returns x and y coordinates", () => {
    const result = polarToCartesian(100, 100, 50, 0);
    expect(result).toHaveProperty("x");
    expect(result).toHaveProperty("y");
    expect(typeof result.x).toBe("number");
    expect(typeof result.y).toBe("number");
  });

  test("returns correct values at 0 degrees", () => {
    const result = polarToCartesian(0, 0, 100, 0);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(-100);
  });

  test("returns correct values at 90 degrees", () => {
    const result = polarToCartesian(0, 0, 100, 90);
    expect(result.x).toBeCloseTo(100);
    expect(result.y).toBeCloseTo(0);
  });
});

describe("describeDonutArc", () => {
  test("returns an SVG path string", () => {
    const path = describeDonutArc(100, 100, 80, 40, 0, 180);
    expect(typeof path).toBe("string");
    expect(path).toContain("M");
    expect(path).toContain("A");
    expect(path).toContain("L");
    expect(path).toContain("Z");
  });
});

describe("getJarActualPercent", () => {
  test("returns 50% for half balance", () => {
    expect(getJarActualPercent(50000, 100000)).toBe("50.0");
  });

  test("returns 0.0 when total is 0", () => {
    expect(getJarActualPercent(0, 0)).toBe("0.0");
  });
});

describe("getJarProgressWidth", () => {
  test("returns 50 for half balance", () => {
    expect(getJarProgressWidth(50, 100)).toBe(50);
  });

  test("caps at 100", () => {
    expect(getJarProgressWidth(200, 100)).toBe(100);
  });

  test("handles zero total", () => {
    expect(getJarProgressWidth(100, 0)).toBe(100);
  });
});
