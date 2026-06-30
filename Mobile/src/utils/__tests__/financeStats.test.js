jest.mock("i18next", () => ({
  t: (key) => {
    const dict = {
      "reportComponents.month1": "Tháng 1",
      "reportComponents.month6": "Tháng 6",
      "reportComponents.month12": "Tháng 12",
      "reportComponents.dayPrefix": `Ngày ${new Date().getDate()}`,
      "reportComponents.weekPrefix": "Tuần 1",
      "reportComponents.chartMonthTitle": "Chi tiêu theo tuần",
      "reportComponents.chartWeekTitle": "Chi tiêu theo ngày",
      "reportComponents.chartSixMonthTitle": "Chi tiêu 6 tháng",
      "reportComponents.chartMonthSubtitle": "Tháng này",
      "reportComponents.chartWeekSubtitle": "Tuần này",
      "reportComponents.chartSixMonthSubtitle": "6 tháng gần đây",
      "reportComponents.chartMonthTotal": "Tổng tháng",
      "reportComponents.chartWeekTotal": "Tổng tuần",
      "reportComponents.chartSixMonthTotal": "Tổng 6 tháng",
    };
    return dict[key] || key;
  },
}));

import {
  toMonthKey,
  buildRecentMonthKeys,
  formatMonthKeyLabel,
  formatMonthShortLabel,
  buildMonthlyFinanceSeries,
  buildReportWeekBuckets,
  buildReportMonthBuckets,
  buildReportSixMonthBuckets,
  buildReportChartSeries,
} from "../financeStats";

describe("toMonthKey", () => {
  test("converts date string to YYYY-MM", () => {
    expect(toMonthKey("2025-06-15")).toBe("2025-06");
  });

  test("returns empty string for invalid date", () => {
    expect(toMonthKey("invalid")).toBe("");
  });
});

describe("buildRecentMonthKeys", () => {
  test("returns 6 recent month keys", () => {
    const keys = buildRecentMonthKeys(6, new Date(2025, 5, 15));
    expect(keys).toHaveLength(6);
    expect(keys[0]).toBe("2025-01");
    expect(keys[5]).toBe("2025-06");
  });

  test("returns 3 keys when count is 3", () => {
    const keys = buildRecentMonthKeys(3, new Date(2025, 5, 15));
    expect(keys).toHaveLength(3);
    expect(keys[0]).toBe("2025-04");
    expect(keys[2]).toBe("2025-06");
  });
});

describe("formatMonthKeyLabel", () => {
  test("formats month key with i18n label", () => {
    const label = formatMonthKeyLabel("2025-06");
    expect(label).toMatch(/Tháng 6/);
    expect(label).toContain("2025");
  });

  test("returns '-' for invalid key", () => {
    expect(formatMonthKeyLabel("")).toBe("-");
    expect(formatMonthKeyLabel("abc")).toBe("-");
  });
});

describe("formatMonthShortLabel", () => {
  test("formats month key as MM/YY", () => {
    expect(formatMonthShortLabel("2025-06")).toBe("06/25");
  });

  test("returns '-' for invalid key", () => {
    expect(formatMonthShortLabel("")).toBe("-");
  });
});

describe("buildMonthlyFinanceSeries", () => {
  const RealDate = global.Date;

  afterAll(() => {
    global.Date = RealDate;
  });

  function mockDate(fixedDate) {
    global.Date = class extends RealDate {
      constructor(...args) {
        return args.length > 0 ? new RealDate(...args) : new RealDate(fixedDate);
      }
      static now() { return new RealDate(fixedDate).getTime(); }
    };
  }

  const incomes = [
    { date: "2025-06-01", amount: 1000000 },
    { date: "2025-06-15", amount: 500000 },
  ];
  const expenses = [
    { date: "2025-06-10", amount: 200000 },
    { date: "2025-06-20", amount: 300000 },
  ];

  test("builds chart series with income, expense, balance", () => {
    mockDate("2025-06-15T12:00:00");
    const series = buildMonthlyFinanceSeries({
      incomes,
      expenses,
      monthsBack: 6,
    });
    expect(series).toHaveLength(6);
    const june = series.find((s) => s.monthKey === "2025-06");
    expect(june.income).toBe(1500000);
    expect(june.expense).toBe(500000);
    expect(june.balance).toBe(1000000);
  });

  test("handles empty arrays", () => {
    mockDate("2025-06-15T12:00:00");
    const series = buildMonthlyFinanceSeries({ monthsBack: 3 });
    expect(series).toHaveLength(3);
    series.forEach((s) => {
      expect(s.income).toBe(0);
      expect(s.expense).toBe(0);
    });
  });
});

describe("buildReportWeekBuckets", () => {
  test("returns 7 day buckets", () => {
    const buckets = buildReportWeekBuckets(6, 2025, new Date(2025, 5, 15));
    expect(buckets).toHaveLength(7);
    buckets.forEach((b) => {
      expect(b).toHaveProperty("key");
      expect(b).toHaveProperty("label");
    });
  });
});

describe("buildReportMonthBuckets", () => {
  test("returns 5 week buckets", () => {
    const buckets = buildReportMonthBuckets(6, 2025);
    expect(buckets).toHaveLength(5);
    buckets.forEach((b) => {
      expect(b).toHaveProperty("key");
      expect(b).toHaveProperty("value");
    });
  });
});

describe("buildReportSixMonthBuckets", () => {
  test("returns 6 month buckets", () => {
    const buckets = buildReportSixMonthBuckets(6, 2025);
    expect(buckets).toHaveLength(6);
    expect(buckets[0]).toHaveProperty("key");
  });
});

describe("buildReportChartSeries", () => {
  const monthExpenses = [
    { date: "2025-06-05", amount: 100000 },
    { date: "2025-06-15", amount: 200000 },
    { date: "2025-06-25", amount: 300000 },
  ];
  const monthIncomes = [
    { date: "2025-06-10", amount: 500000 },
  ];

  test("builds month-range chart series", () => {
    const result = buildReportChartSeries({
      expenses: monthExpenses,
      incomes: monthIncomes,
      selectedMonth: 6,
      selectedYear: 2025,
      range: "month",
    });
    expect(result.labels).toHaveLength(5);
    expect(result.expenseTotal).toBe(600000);
    expect(result.incomeTotal).toBe(500000);
  });

  test("builds week-range chart series", () => {
    const result = buildReportChartSeries({
      expenses: monthExpenses,
      incomes: monthIncomes,
      selectedMonth: 6,
      selectedYear: 2025,
      range: "week",
      now: new Date(2025, 5, 18),
    });
    expect(result.labels).toHaveLength(7);
    expect(result).toHaveProperty("title");
  });

  test("builds six-month chart series", () => {
    const result = buildReportChartSeries({
      expenses: monthExpenses,
      incomes: monthIncomes,
      selectedMonth: 6,
      selectedYear: 2025,
      range: "sixMonths",
    });
    expect(result.labels).toHaveLength(6);
  });
});
