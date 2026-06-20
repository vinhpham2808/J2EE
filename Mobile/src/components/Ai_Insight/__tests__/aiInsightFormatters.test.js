jest.mock("../../../constants/colors", () => ({
  COLORS: { EXPENSE: "#E76F51", INCOME: "#2A9D8F", INFO: "#6B9BD2" },
}));

jest.mock("i18next", () => {
  const i18n = { language: "vi-VN", t: (key) => ({ "aiInsight.trendUp": "Tăng", "aiInsight.trendDown": "Giảm", "aiInsight.trendStable": "Ổn định" }[key] || key) };
  return i18n;
});

import { formatInsightMoney, getTrendText, getTrendColor } from "../aiInsightFormatters";

describe("aiInsightFormatters", () => {
  describe("formatInsightMoney", () => {
    test("formats positive number in VND", () => {
      const result = formatInsightMoney(1000000);
      expect(result).toContain("1.000.000");
    });

    test("formats zero", () => {
      const result = formatInsightMoney(0);
      expect(result).toContain("0");
    });

    test("handles string numbers", () => {
      const result = formatInsightMoney("500000");
      expect(result).toContain("500.000");
    });

    test("handles null/undefined", () => {
      expect(formatInsightMoney(null)).toContain("0");
      expect(formatInsightMoney(undefined)).toContain("0");
    });

    test("handles very large numbers", () => {
      const result = formatInsightMoney(999999999999);
      expect(result).toContain("999.999.999.999");
    });
  });

  describe("getTrendText", () => {
    test("UP returns Tăng", () => {
      expect(getTrendText("UP")).toBe("Tăng");
    });

    test("DOWN returns Giảm", () => {
      expect(getTrendText("DOWN")).toBe("Giảm");
    });

    test("other values return Ổn định", () => {
      expect(getTrendText("STABLE")).toBe("Ổn định");
      expect(getTrendText(null)).toBe("Ổn định");
      expect(getTrendText("")).toBe("Ổn định");
    });
  });

  describe("getTrendColor", () => {
    test("UP returns EXPENSE color (red)", () => {
      expect(getTrendColor("UP")).toBe("#E76F51");
    });

    test("DOWN returns INCOME color (green)", () => {
      expect(getTrendColor("DOWN")).toBe("#2A9D8F");
    });

    test("other values return INFO color (blue)", () => {
      expect(getTrendColor("STABLE")).toBe("#6B9BD2");
      expect(getTrendColor(null)).toBe("#6B9BD2");
    });
  });
});
