jest.mock("../apiClient", () => ({ get: jest.fn(), post: jest.fn() }));

import { fetchMonthlyForecast, fetchAnomalies, fetchCategoryTrend, fetchInsights } from "../forecastService";

describe("forecastService", () => {
  const apiClient = require("../apiClient");

  beforeEach(() => { jest.clearAllMocks(); });

  describe("fetchMonthlyForecast", () => {
    test("returns forecast data", async () => {
      const mockData = { year: 2026, month: 6, categories: [] };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchMonthlyForecast(2026, 6);
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/forecast/monthly?year=2026&month=6");
    });
  });

  describe("fetchAnomalies", () => {
    test("returns anomalies array on success", async () => {
      const mockData = [{ transactionId: 1, amount: 500 }];
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchAnomalies(2026, 6);
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/forecast/anomalies?year=2026&month=6");
    });

    test("returns empty array when response data is not an array", async () => {
      apiClient.get.mockResolvedValueOnce({ data: null });

      const result = await fetchAnomalies(2026, 6);
      expect(result).toEqual([]);
    });
  });

  describe("fetchCategoryTrend", () => {
    test("returns category trend data", async () => {
      const mockData = { categoryName: "Food", dataPoints: [] };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchCategoryTrend(1, 6);
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/forecast/category-trend/1?months=6");
    });

    test("defaults to 6 months", async () => {
      apiClient.get.mockResolvedValueOnce({ data: {} });

      await fetchCategoryTrend(1);
      expect(apiClient.get).toHaveBeenCalledWith("/forecast/category-trend/1?months=6");
    });
  });

  describe("fetchInsights", () => {
    test("posts forecast data and returns insight", async () => {
      const forecastData = { year: 2026, month: 6, categories: [] };
      apiClient.post.mockResolvedValueOnce({ data: { narrative: "Good", generatedAt: "2026-06-01" } });

      const result = await fetchInsights(forecastData);
      expect(result).toEqual({ narrative: "Good", generatedAt: "2026-06-01" });
      expect(apiClient.post).toHaveBeenCalledWith("/forecast/insights", forecastData);
    });
  });
});
