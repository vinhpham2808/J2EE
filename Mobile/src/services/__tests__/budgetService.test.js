jest.mock("../apiClient", () => ({ get: jest.fn(), post: jest.fn(), delete: jest.fn() }));

import { fetchBudgets, saveBudget, deleteBudgetById } from "../budgetService";

describe("budgetService", () => {
  const apiClient = require("../apiClient");

  beforeEach(() => { jest.clearAllMocks(); });

  describe("fetchBudgets", () => {
    test("returns data array on success", async () => {
      const mockData = [{ id: 1, category: "Food", limit: 500 }];
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchBudgets();
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/budgets");
    });

    test("returns empty array when response data is not an array", async () => {
      apiClient.get.mockResolvedValueOnce({ data: undefined });

      const result = await fetchBudgets();
      expect(result).toEqual([]);
    });
  });

  describe("saveBudget", () => {
    test("posts payload and returns response", async () => {
      const payload = { categoryId: 1, limit: 300 };
      apiClient.post.mockResolvedValueOnce({ data: { id: 5, ...payload } });

      const result = await saveBudget(payload);
      expect(result.data).toEqual({ id: 5, ...payload });
      expect(apiClient.post).toHaveBeenCalledWith("/budgets", payload);
    });
  });

  describe("deleteBudgetById", () => {
    test("deletes budget by id", async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteBudgetById(2);
      expect(result.data).toEqual({ success: true });
      expect(apiClient.delete).toHaveBeenCalledWith("/budgets/2");
    });
  });
});
