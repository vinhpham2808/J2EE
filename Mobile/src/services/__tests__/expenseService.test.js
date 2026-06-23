jest.mock("../apiClient", () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }));
jest.mock("../../utils/downloadFile", () => ({ downloadAndShareFile: jest.fn() }));

import { fetchExpensesByFilter, createExpense, updateExpense, deleteExpenseById, parseExpenseVoice, exportExpenseReport } from "../expenseService";

describe("expenseService", () => {
  const apiClient = require("../apiClient");
  const { downloadAndShareFile } = require("../../utils/downloadFile");

  beforeEach(() => { jest.clearAllMocks(); });

  describe("fetchExpensesByFilter", () => {
    test("calls with all=true when filter is 'all'", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [{ id: 1, amount: 100 }] });

      const result = await fetchExpensesByFilter("all");
      expect(apiClient.get).toHaveBeenCalledWith("/expenses", { params: { all: true } });
      expect(result).toEqual([{ id: 1, amount: 100 }]);
    });

    test("calls without all param for specific filter", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [{ id: 2 }] });

      const result = await fetchExpensesByFilter("month");
      expect(apiClient.get).toHaveBeenCalledWith("/expenses", { params: {} });
      expect(result).toEqual([{ id: 2 }]);
    });

    test("returns empty array when response data is not an array", async () => {
      apiClient.get.mockResolvedValueOnce({ data: null });

      const result = await fetchExpensesByFilter("all");
      expect(result).toEqual([]);
    });
  });

  describe("createExpense", () => {
    test("posts payload", async () => {
      const payload = { amount: 200, categoryId: 1 };
      apiClient.post.mockResolvedValueOnce({ data: { id: 10 } });

      const result = await createExpense(payload);
      expect(result.data).toEqual({ id: 10 });
      expect(apiClient.post).toHaveBeenCalledWith("/expenses", payload);
    });
  });

  describe("updateExpense", () => {
    test("puts payload to expense id endpoint", async () => {
      apiClient.put.mockResolvedValueOnce({ data: { id: 5, amount: 300 } });

      const result = await updateExpense(5, { amount: 300 });
      expect(result.data).toEqual({ id: 5, amount: 300 });
      expect(apiClient.put).toHaveBeenCalledWith("/expenses/5", { amount: 300 });
    });
  });

  describe("deleteExpenseById", () => {
    test("deletes expense by id", async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteExpenseById(3);
      expect(result.data).toEqual({ success: true });
      expect(apiClient.delete).toHaveBeenCalledWith("/expenses/3");
    });
  });

  describe("parseExpenseVoice", () => {
    test("posts voice text and returns data", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { parsed: { amount: 150 } } });

      const result = await parseExpenseVoice("100k cho an trua");
      expect(result).toEqual({ parsed: { amount: 150 } });
      expect(apiClient.post).toHaveBeenCalledWith("/gemini/voice-parse", { text: "100k cho an trua" });
    });
  });

  describe("exportExpenseReport", () => {
    test("exports all months report and downloads file", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { presignedUrl: "https://example.com/report.xlsx" } });

      await exportExpenseReport("all");

      expect(apiClient.post).toHaveBeenCalledWith("/documents/report/expense", {
        all: true,
        month: expect.any(Number),
        year: expect.any(Number),
      });
      expect(downloadAndShareFile).toHaveBeenCalledWith("https://example.com/report.xlsx", "expense_report_all_months.xlsx");
    });

    test("exports current month report and downloads file", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { presignedUrl: "https://example.com/monthly.xlsx" } });

      await exportExpenseReport("month");

      expect(apiClient.post).toHaveBeenCalledWith("/documents/report/expense", {
        month: expect.any(Number),
        year: expect.any(Number),
      });
      expect(downloadAndShareFile).toHaveBeenCalledWith("https://example.com/monthly.xlsx", expect.stringMatching(/^expense_report_\d+_\d+\.xlsx$/));
    });

    test("throws when presignedUrl is missing", async () => {
      apiClient.post.mockResolvedValueOnce({ data: {} });

      await expect(exportExpenseReport("all")).rejects.toThrow("Không lấy được link tải file");
      expect(downloadAndShareFile).not.toHaveBeenCalled();
    });
  });
});
