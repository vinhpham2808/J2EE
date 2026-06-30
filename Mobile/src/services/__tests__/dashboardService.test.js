jest.mock("../apiClient", () => ({ get: jest.fn() }));
jest.mock("../../utils/financeStats", () => ({ buildMonthlyFinanceSeries: jest.fn() }));

import { fetchDashboardData, fetchUnreadNotificationCount, fetchDashboardGoals, fetchDashboardMonthlySeries } from "../dashboardService";

describe("dashboardService", () => {
  const apiClient = require("../apiClient");
  const { buildMonthlyFinanceSeries } = require("../../utils/financeStats");

  beforeEach(() => { jest.clearAllMocks(); });

  describe("fetchDashboardData", () => {
    test("returns data on success", async () => {
      const mockData = { totalExpense: 1000, totalIncome: 2000 };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchDashboardData();
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/dashboard");
    });

    test("returns null when response data is falsy", async () => {
      apiClient.get.mockResolvedValueOnce({ data: null });

      const result = await fetchDashboardData();
      expect(result).toBeNull();
    });
  });

  describe("fetchUnreadNotificationCount", () => {
    test("returns unreadCount as number", async () => {
      apiClient.get.mockResolvedValueOnce({ data: { unreadCount: "5" } });

      const result = await fetchUnreadNotificationCount();
      expect(result).toBe(5);
      expect(apiClient.get).toHaveBeenCalledWith("/notifications/unread-count");
    });

    test("returns 0 when data is missing", async () => {
      apiClient.get.mockResolvedValueOnce({ data: {} });

      const result = await fetchUnreadNotificationCount();
      expect(result).toBe(0);
    });

    test("returns 0 on error", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchUnreadNotificationCount();
      expect(result).toBe(0);
    });
  });

  describe("fetchDashboardGoals", () => {
    const makeGoal = (status) => ({ id: 1, name: "Goal", status });

    test("returns active goals, limited to 3", async () => {
      const goals = [makeGoal("ACTIVE"), makeGoal("ACTIVE"), makeGoal("ACTIVE"), makeGoal("ACTIVE")];
      apiClient.get.mockResolvedValueOnce({ data: goals });

      const result = await fetchDashboardGoals();
      expect(result).toHaveLength(3);
      expect(apiClient.get).toHaveBeenCalledWith("/saving-goals");
    });

    test("filters out non-active goals", async () => {
      const goals = [makeGoal("ACTIVE"), makeGoal("COMPLETED")];
      apiClient.get.mockResolvedValueOnce({ data: goals });

      const result = await fetchDashboardGoals();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("ACTIVE");
    });

    test("includes goals with missing status (defaults to ACTIVE)", async () => {
      const goals = [{ id: 1, name: "Goal" }];
      apiClient.get.mockResolvedValueOnce({ data: goals });

      const result = await fetchDashboardGoals();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Goal");
    });

    test("returns empty array when response data is not an array", async () => {
      apiClient.get.mockResolvedValueOnce({ data: null });

      const result = await fetchDashboardGoals();
      expect(result).toEqual([]);
    });

    test("returns empty array on error", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchDashboardGoals();
      expect(result).toEqual([]);
    });
  });

  describe("fetchDashboardMonthlySeries", () => {
    test("fetches incomes and expenses then builds series", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [{ id: 1, amount: 1000, date: "2026-01-15" }] });
      apiClient.get.mockResolvedValueOnce({ data: [{ id: 2, amount: 500, date: "2026-01-20" }] });
      buildMonthlyFinanceSeries.mockReturnValueOnce([{ month: "2026-01", income: 1000, expense: 500 }]);

      const result = await fetchDashboardMonthlySeries();

      expect(apiClient.get).toHaveBeenNthCalledWith(1, "/incomes", { params: { all: true } });
      expect(apiClient.get).toHaveBeenNthCalledWith(2, "/expenses");
      expect(buildMonthlyFinanceSeries).toHaveBeenCalledWith({
        incomes: [{ id: 1, amount: 1000, date: "2026-01-15" }],
        expenses: [{ id: 2, amount: 500, date: "2026-01-20" }],
        monthsBack: 6,
      });
      expect(result).toEqual([{ month: "2026-01", income: 1000, expense: 500 }]);
    });

    test("handles non-array income/expense data gracefully", async () => {
      apiClient.get.mockResolvedValueOnce({ data: null });
      apiClient.get.mockResolvedValueOnce({ data: undefined });
      buildMonthlyFinanceSeries.mockReturnValueOnce([]);

      const result = await fetchDashboardMonthlySeries();

      expect(result).toEqual([]);
      expect(buildMonthlyFinanceSeries).toHaveBeenCalledWith({
        incomes: [],
        expenses: [],
        monthsBack: 6,
      });
    });
  });
});
