jest.mock("../apiClient", () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }));

import { fetchCategoriesByType, fetchCategories, createCategory, updateCategory, deleteCategory } from "../categoryService";

describe("categoryService", () => {
  const apiClient = require("../apiClient");

  beforeEach(() => { jest.clearAllMocks(); });

  describe("fetchCategoriesByType", () => {
    test("returns data array on success", async () => {
      const mockData = [{ id: 1, name: "Food" }];
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchCategoriesByType("expense");
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/categories/type/expense");
    });

    test("normalizes income type correctly", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      await fetchCategoriesByType("INCOME");
      expect(apiClient.get).toHaveBeenCalledWith("/categories/type/income");
    });

    test("returns empty array when response data is not an array", async () => {
      apiClient.get.mockResolvedValueOnce({ data: null });

      const result = await fetchCategoriesByType("expense");
      expect(result).toEqual([]);
    });
  });

  describe("fetchCategories", () => {
    test("returns data array on success", async () => {
      const mockData = [{ id: 1, name: "Food" }, { id: 2, name: "Transport" }];
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchCategories();
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/categories");
    });

    test("returns empty array when response data is not an array", async () => {
      apiClient.get.mockResolvedValueOnce({ data: {} });

      const result = await fetchCategories();
      expect(result).toEqual([]);
    });
  });

  describe("createCategory", () => {
    test("posts payload and returns data", async () => {
      const payload = { name: "New Cat", type: "expense" };
      apiClient.post.mockResolvedValueOnce({ data: { id: 10, ...payload } });

      const result = await createCategory(payload);
      expect(result).toEqual({ id: 10, ...payload });
      expect(apiClient.post).toHaveBeenCalledWith("/categories", payload);
    });
  });

  describe("updateCategory", () => {
    test("puts payload to category id endpoint", async () => {
      const payload = { name: "Updated" };
      apiClient.put.mockResolvedValueOnce({ data: { id: 5, ...payload } });

      const result = await updateCategory(5, payload);
      expect(result).toEqual({ id: 5, ...payload });
      expect(apiClient.put).toHaveBeenCalledWith("/categories/5", payload);
    });
  });

  describe("deleteCategory", () => {
    test("deletes category by id", async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteCategory(3);
      expect(result).toEqual({ success: true });
      expect(apiClient.delete).toHaveBeenCalledWith("/categories/3");
    });
  });
});
