jest.mock("../../services/apiClient", () => ({ get: jest.fn() }));
jest.mock("../../constants/api", () => ({ API_ENDPOINTS: { MONTHLY_REPORT_BY_MONTH: (y, m) => `/reports/monthly/${y}/${m}` } }));
jest.mock("../../utils/forecastDataUtils", () => ({ getMonthLabel: (m) => `Month ${m + 1}` }));

import { renderHook, act } from "@testing-library/react-native";
import useMonthlyReport from "../useMonthlyReport";

describe("useMonthlyReport", () => {
  const apiClient = require("../../services/apiClient");

  const RealDate = global.Date;

  beforeAll(() => {
    const mockDate = new RealDate("2026-06-15T12:00:00Z");
    global.Date = jest.fn((...args) => {
      if (args.length === 0) return mockDate;
      return new RealDate(...args);
    });
    global.Date.now = () => mockDate.getTime();
    global.Date.parse = RealDate.parse;
    global.Date.UTC = RealDate.UTC;
  });

  afterAll(() => {
    global.Date = RealDate;
  });

  beforeEach(() => { jest.clearAllMocks(); });

  test("fetches report on mount", async () => {
    apiClient.get.mockResolvedValueOnce({ data: { success: true, data: { totalExpense: 500 } } });

    const { result } = renderHook(() => useMonthlyReport(null));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(apiClient.get).toHaveBeenCalledWith("/reports/monthly/2026/6");
    expect(result.current.loading).toBe(false);
    expect(result.current.report).toEqual({ totalExpense: 500 });
  });

  test("sets error when response.success is false", async () => {
    apiClient.get.mockResolvedValueOnce({ data: { success: false, message: "No data" } });

    const { result } = renderHook(() => useMonthlyReport(null));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(result.current.error).toBe("No data");
    expect(result.current.report).toBeNull();
  });

  test("sets error on fetch failure", async () => {
    apiClient.get.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useMonthlyReport(null));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(result.current.error).toBeTruthy();
    expect(result.current.report).toBeNull();
  });

  test("selectMonth updates selected month/year", () => {
    const { result } = renderHook(() => useMonthlyReport(null));

    act(() => { result.current.selectMonth(3, 2025); });

    expect(result.current.selectedMonth).toBe(3);
    expect(result.current.selectedYear).toBe(2025);
  });

  test("monthOptions are built from accountCreatedAt", () => {
    const { result } = renderHook(() => useMonthlyReport(new Date("2026-01-15")));
    expect(result.current.monthOptions.length).toBeGreaterThanOrEqual(1);
    expect(result.current.monthOptions[0]).toHaveProperty("label");
    expect(result.current.monthOptions[0]).toHaveProperty("month");
    expect(result.current.monthOptions[0]).toHaveProperty("year");
  });

  test("monthPickerLabel shows correct format", () => {
    const { result } = renderHook(() => useMonthlyReport(null));
    expect(result.current.monthPickerLabel).toMatch(/^Month \d+ \d{4}$/);
  });
});
