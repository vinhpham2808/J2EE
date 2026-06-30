jest.mock("../apiClient", () => ({ get: jest.fn() }));

import { fetchAiInsight, fetchDetailedAiInsight, fetchAiForecast } from "../aiInsightService";

describe("aiInsightService", () => {
  const apiClient = require("../apiClient");

  beforeEach(() => { jest.clearAllMocks(); });

  describe("fetchAiInsight", () => {
    test("returns insight data on success", async () => {
      const mockData = { insight: "You spent 20% more this month", status: "OK" };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchAiInsight();
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/dashboard/ai-insight");
    });
  });

  describe("fetchDetailedAiInsight", () => {
    test("returns detailed insight data", async () => {
      const mockData = { insight: "Detailed analysis", risk: "low" };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchDetailedAiInsight();
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/dashboard/ai-insight/detailed");
    });
  });

  describe("fetchAiForecast", () => {
    test("returns forecast data for given year and month", async () => {
      const mockData = { totalPredictedExpense: 5000, categories: [] };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchAiForecast(2026, 6);
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/dashboard/ai-insight/forecast?year=2026&month=6");
    });
  });
});
