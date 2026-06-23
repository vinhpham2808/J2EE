jest.mock("i18next", () => ({
  t: (key) => {
    const dict = {
      "forecastComponents.month1": "Tháng 1",
      "forecastComponents.month6": "Tháng 6",
      "forecastComponents.month7": "Tháng 7",
      "forecastComponents.shortMonth1": "T1",
      "forecastComponents.shortMonth6": "T6",
      "forecastComponents.forecastNextMonth": "Dự báo tháng sau",
      "forecastComponents.forecastForMonth": "Dự báo cho tháng {month} {year}",
    };
    return dict[key] || key;
  },
}));

import {
  getForecastRequestKey,
  buildMonthOptions,
  getMonthPickerState,
  getTopGrowthCategory,
  buildForecastBarChartData,
  buildTrendLineChartData,
} from "../forecastDataUtils";

describe("getForecastRequestKey", () => {
  test("returns year-month key", () => {
    expect(getForecastRequestKey(2025, 6)).toBe("2025-6");
  });

  test("includes extra parameter when provided", () => {
    expect(getForecastRequestKey(2025, 6, "v2")).toBe("2025-6-v2");
  });
});

describe("buildMonthOptions", () => {
  test("returns 7 month options starting from current month", () => {
    const options = buildMonthOptions(2025, 6);
    expect(options).toHaveLength(7);
    expect(options[0].month).toBe(6);
    expect(options[0].year).toBe(2025);
    expect(options[6].month).toBe(12);
    expect(options[6].year).toBe(2025);
  });

  test("each option has month, year, and label", () => {
    const options = buildMonthOptions(2025, 1);
    options.forEach((opt) => {
      expect(opt).toHaveProperty("month");
      expect(opt).toHaveProperty("year");
      expect(opt).toHaveProperty("label");
    });
  });
});

describe("getMonthPickerState", () => {
  test("detects when next month is selected", () => {
    const state = getMonthPickerState({
      currentMonth: 6,
      currentYear: 2025,
      selectedMonth: 7,
      selectedYear: 2025,
    });
    expect(state.isNextMonthSelected).toBe(true);
  });

  test("detects when current month is selected (not next)", () => {
    const state = getMonthPickerState({
      currentMonth: 6,
      currentYear: 2025,
      selectedMonth: 6,
      selectedYear: 2025,
    });
    expect(state.isNextMonthSelected).toBe(false);
  });

  test("returns monthPickerLabel", () => {
    const state = getMonthPickerState({
      currentMonth: 6,
      currentYear: 2025,
      selectedMonth: 6,
      selectedYear: 2025,
    });
    expect(state.monthPickerLabel).toContain("2025");
  });

  test("handles year boundary across January", () => {
    const state = getMonthPickerState({
      currentMonth: 12,
      currentYear: 2025,
      selectedMonth: 1,
      selectedYear: 2026,
    });
    expect(state.isNextMonthSelected).toBe(true);
  });
});

describe("getTopGrowthCategory", () => {
  test("returns the category with highest predicted UP trend", () => {
    const categories = [
      { categoryName: "Ăn uống", trend: "UP", predictedAmount: 500000 },
      { categoryName: "Di chuyển", trend: "UP", predictedAmount: 800000 },
      { categoryName: "Mua sắm", trend: "DOWN", predictedAmount: 300000 },
    ];
    const top = getTopGrowthCategory(categories);
    expect(top.categoryName).toBe("Di chuyển");
  });

  test("returns null for empty array", () => {
    expect(getTopGrowthCategory([])).toBeNull();
  });

  test("returns null when no UP trend", () => {
    const categories = [
      { trend: "DOWN", predictedAmount: 500000 },
      { trend: "STABLE", predictedAmount: 200000 },
    ];
    expect(getTopGrowthCategory(categories)).toBeNull();
  });
});

describe("buildForecastBarChartData", () => {
  test("returns chart data with labels and datasets", () => {
    const data = buildForecastBarChartData([
      { categoryName: "Ăn uống", predictedAmount: 500000, historicalAverage: 400000 },
      { categoryName: "Di chuyển", predictedAmount: 300000, historicalAverage: 250000 },
    ]);
    expect(data.labels).toHaveLength(2);
    expect(data.datasets).toHaveLength(2);
    expect(data.datasets[0].data).toEqual([500000, 300000]);
    expect(data.datasets[1].data).toEqual([400000, 250000]);
  });

  test("truncates labels longer than 6 chars", () => {
    const data = buildForecastBarChartData([
      { categoryName: "Ăn uống hằng ngày", predictedAmount: 100000, historicalAverage: 80000 },
    ]);
    expect(data.labels[0].length).toBeLessThanOrEqual(7);
  });

  test("limits to 8 categories", () => {
    const categories = Array.from({ length: 12 }, (_, i) => ({
      categoryName: `Cat ${i + 1}`,
      predictedAmount: 100000,
      historicalAverage: 80000,
    }));
    const data = buildForecastBarChartData(categories);
    expect(data.labels).toHaveLength(8);
  });

  test("returns null for empty categories", () => {
    expect(buildForecastBarChartData([])).toBeNull();
  });
});

describe("buildTrendLineChartData", () => {
  test("returns line chart data from category trend", () => {
    const data = buildTrendLineChartData({
      dataPoints: [
        { yearMonth: "2025-01", actual: 100000 },
        { yearMonth: "2025-02", actual: 120000 },
      ],
    });
    expect(data.labels).toHaveLength(2);
    expect(data.datasets[0].data).toEqual([100000, 120000]);
  });

  test("returns null for empty dataPoints", () => {
    expect(buildTrendLineChartData({ dataPoints: [] })).toBeNull();
    expect(buildTrendLineChartData({})).toBeNull();
  });

  test("returns empty label for invalid month", () => {
    const data = buildTrendLineChartData({
      dataPoints: [
        { yearMonth: "invalid", actual: 50000 },
      ],
    });
    expect(data.labels[0]).toBe("");
  });
});
