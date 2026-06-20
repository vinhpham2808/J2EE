jest.mock("../../services/forecastService", () => ({
  fetchMonthlyForecast: jest.fn(),
  fetchAnomalies: jest.fn(),
  fetchCategoryTrend: jest.fn(),
  fetchInsights: jest.fn(),
}));
jest.mock("../../services/forecastDraftCacheService", () => ({ getAiForecastDraft: jest.fn() }));
jest.mock("../../utils/forecast", () => ({ getRouteForecastMonth: jest.fn(), buildForecastFromDraft: jest.fn(), buildInsightFromDraft: jest.fn() }));
jest.mock("../../utils/forecastDataUtils", () => ({
  buildForecastBarChartData: jest.fn((cats) => ({ categories: cats })),
  buildMonthOptions: jest.fn(() => [{ label: "Jun 2026", month: 6, year: 2026 }]),
  buildTrendLineChartData: jest.fn((t) => t || null),
  getForecastRequestKey: jest.fn((y, m) => `${y}-${m}`),
  getMonthPickerState: jest.fn(() => ({ isNextMonthSelected: false, monthPickerLabel: "Jun 2026", monthPickerHint: "" })),
  getTopGrowthCategory: jest.fn((cats) => (cats?.length > 0 ? cats[0] : null)),
}));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

import { renderHook, act, waitFor } from "@testing-library/react-native";
import useForecastData from "../useForecastData";

describe("useForecastData", () => {
  const { fetchMonthlyForecast, fetchAnomalies, fetchCategoryTrend, fetchInsights } = require("../../services/forecastService");
  const { getAiForecastDraft } = require("../../services/forecastDraftCacheService");
  const { getRouteForecastMonth, buildForecastFromDraft, buildInsightFromDraft } = require("../../utils/forecast");

  beforeEach(() => { jest.clearAllMocks(); getAiForecastDraft.mockReturnValue(null); });

  const defaultProps = { route: { params: {} }, isPremium: true, currentMonth: 6, currentYear: 2026 };

  test("returns initial state", () => {
    getAiForecastDraft.mockReturnValueOnce(null);
    fetchMonthlyForecast.mockResolvedValueOnce(null);
    fetchAnomalies.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useForecastData(defaultProps));

    expect(result.current.selectedMonth).toBe(6);
    expect(result.current.selectedYear).toBe(2026);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.monthlyForecast).toBeNull();
    expect(result.current.anomalies).toEqual([]);
    expect(result.current.categories).toEqual([]);
    expect(result.current.totalPredicted).toBe(0);
    expect(result.current.isMonthPickerVisible).toBe(false);
  });

  test("loads forecast from API on mount", async () => {
    getAiForecastDraft.mockReturnValueOnce(null);
    const mockForecast = { year: 2026, month: 6, categories: [{ categoryId: 1, name: "Food", predictedAmount: 500000 }] };
    fetchMonthlyForecast.mockResolvedValueOnce(mockForecast);
    fetchAnomalies.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useForecastData(defaultProps));
    await act(async () => {});

    expect(fetchMonthlyForecast).toHaveBeenCalledWith(2026, 6);
    expect(result.current.monthlyForecast).toEqual(mockForecast);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.selectedCategoryId).toBe(1);
    expect(result.current.categories).toEqual(mockForecast.categories);
    expect(result.current.totalPredicted).toBe(500000);
  });

  test("uses draft data when available", async () => {
    const draft = { categories: [{ categoryId: 1, name: "Food", predictedAmount: 300000 }], anomalies: [] };
    getAiForecastDraft.mockReturnValue(draft);
    buildForecastFromDraft.mockReturnValueOnce({ year: 2026, month: 6, categories: draft.categories });
    buildInsightFromDraft.mockReturnValueOnce({ summary: "Draft insight" });

    const { result } = renderHook(() => useForecastData(defaultProps));
    await act(async () => {});

    expect(buildForecastFromDraft).toHaveBeenCalledWith(draft);
    expect(result.current.monthlyForecast).toEqual({ year: 2026, month: 6, categories: draft.categories });
    expect(fetchMonthlyForecast).not.toHaveBeenCalled();
    expect(fetchAnomalies).not.toHaveBeenCalled();
  });

  test("loads anomalies from API on mount", async () => {
    getAiForecastDraft.mockReturnValueOnce(null);
    fetchMonthlyForecast.mockResolvedValueOnce(null);
    const anomalies = [{ id: 1, description: "Spike" }];
    fetchAnomalies.mockResolvedValueOnce(anomalies);

    const { result } = renderHook(() => useForecastData(defaultProps));
    await act(async () => {});

    expect(fetchAnomalies).toHaveBeenCalledWith(2026, 6);
    expect(result.current.anomalies).toEqual(anomalies);
  });

  test("loads category trend when selectedCategoryId changes", async () => {
    getAiForecastDraft.mockReturnValueOnce(null);
    const mockForecast = { year: 2026, month: 6, categories: [{ categoryId: 1, name: "Food", predictedAmount: 500000 }, { categoryId: 2, name: "Transport", predictedAmount: 200000 }] };
    fetchMonthlyForecast.mockResolvedValueOnce(mockForecast);
    fetchAnomalies.mockResolvedValueOnce([]);
    const trendData = { categoryId: 2, trend: "up" };
    fetchCategoryTrend.mockResolvedValueOnce(trendData);

    const { result } = renderHook(() => useForecastData(defaultProps));
    await act(async () => {});

    act(() => { result.current.setSelectedCategoryId(2); });
    await waitFor(() => expect(result.current.categoryTrend).toEqual(trendData));

    expect(fetchCategoryTrend).toHaveBeenCalledWith(2, 6);
  });

  test("selectMonth updates selection and hides picker", () => {
    getAiForecastDraft.mockReturnValue(null);
    fetchMonthlyForecast.mockResolvedValue(null);
    fetchAnomalies.mockResolvedValue([]);

    const { result } = renderHook(() => useForecastData(defaultProps));

    act(() => { result.current.selectMonth(7, 2026); });
    expect(result.current.selectedMonth).toBe(7);
    expect(result.current.selectedYear).toBe(2026);
    expect(result.current.isMonthPickerVisible).toBe(false);
  });

  test("isMonthPickerVisible toggles", () => {
    getAiForecastDraft.mockReturnValue(null);
    fetchMonthlyForecast.mockResolvedValue(null);
    fetchAnomalies.mockResolvedValue([]);

    const { result } = renderHook(() => useForecastData(defaultProps));

    act(() => { result.current.setIsMonthPickerVisible(true); });
    expect(result.current.isMonthPickerVisible).toBe(true);
  });

  test("isCurrentMonthSelected is true when month/year match", () => {
    getAiForecastDraft.mockReturnValue(null);
    fetchMonthlyForecast.mockResolvedValue(null);
    fetchAnomalies.mockResolvedValue([]);

    const { result } = renderHook(() => useForecastData(defaultProps));
    expect(result.current.isCurrentMonthSelected).toBe(true);
  });

  test("handles forecast API error", async () => {
    getAiForecastDraft.mockReturnValueOnce(null);
    fetchMonthlyForecast.mockRejectedValueOnce(new Error("API error"));
    fetchAnomalies.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useForecastData(defaultProps));
    await act(async () => {});

    expect(result.current.monthlyForecast).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  test("non-premium skips API calls", () => {
    getAiForecastDraft.mockReturnValueOnce(null);

    const { result } = renderHook(() => useForecastData({ ...defaultProps, isPremium: false }));
    expect(result.current.isLoading).toBe(false);
    expect(fetchMonthlyForecast).not.toHaveBeenCalled();
    expect(fetchAnomalies).not.toHaveBeenCalled();
  });

  test("syncs from route params", () => {
    getRouteForecastMonth.mockReturnValueOnce({ month: 8, year: 2025 });
    getAiForecastDraft.mockReturnValue(null);
    fetchMonthlyForecast.mockResolvedValue(null);
    fetchAnomalies.mockResolvedValue([]);

    const { result } = renderHook(() => useForecastData({
      ...defaultProps,
      route: { params: { month: 8, year: 2025 } },
    }));

    expect(result.current.selectedMonth).toBe(8);
    expect(result.current.selectedYear).toBe(2025);
  });

  test("monthOptions are built", () => {
    getAiForecastDraft.mockReturnValue(null);
    fetchMonthlyForecast.mockResolvedValue(null);
    fetchAnomalies.mockResolvedValue([]);

    const { result } = renderHook(() => useForecastData(defaultProps));
    expect(result.current.monthOptions).toHaveLength(1);
    expect(result.current.monthOptions[0].month).toBe(6);
  });
});
