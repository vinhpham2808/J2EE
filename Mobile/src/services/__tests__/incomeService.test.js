jest.mock("../apiClient", () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }));
jest.mock("../../utils/downloadFile", () => ({ downloadAndShareFile: jest.fn() }));

import { fetchIncomesByFilter, createIncome, updateIncome, deleteIncomeById, parseIncomeVoice, exportIncomeReport } from "../incomeService";

describe("incomeService", () => {
  const apiClient = require("../apiClient");
  const { downloadAndShareFile } = require("../../utils/downloadFile");

  beforeEach(() => { jest.clearAllMocks(); });

  describe("fetchIncomesByFilter", () => {
    test("calls with all=true when filter is 'all'", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [{ id: 1, amount: 500 }] });

      const result = await fetchIncomesByFilter("all");
      expect(apiClient.get).toHaveBeenCalledWith("/incomes", { params: { all: true } });
      expect(result).toEqual([{ id: 1, amount: 500 }]);
    });

    test("calls without all param for specific filter", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [{ id: 2 }] });

      const result = await fetchIncomesByFilter("month");
      expect(apiClient.get).toHaveBeenCalledWith("/incomes", { params: {} });
      expect(result).toEqual([{ id: 2 }]);
    });

    test("returns empty array when response data is not an array", async () => {
      apiClient.get.mockResolvedValueOnce({ data: null });

      const result = await fetchIncomesByFilter("all");
      expect(result).toEqual([]);
    });
  });

  describe("createIncome", () => {
    test("posts payload", async () => {
      const payload = { amount: 1000, categoryId: 1 };
      apiClient.post.mockResolvedValueOnce({ data: { id: 10 } });

      const result = await createIncome(payload);
      expect(result.data).toEqual({ id: 10 });
      expect(apiClient.post).toHaveBeenCalledWith("/incomes", payload);
    });
  });

  describe("updateIncome", () => {
    test("puts payload to income id endpoint", async () => {
      apiClient.put.mockResolvedValueOnce({ data: { id: 5, amount: 2000 } });

      const result = await updateIncome(5, { amount: 2000 });
      expect(result.data).toEqual({ id: 5, amount: 2000 });
      expect(apiClient.put).toHaveBeenCalledWith("/incomes/5", { amount: 2000 });
    });
  });

  describe("deleteIncomeById", () => {
    test("deletes income by id", async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteIncomeById(3);
      expect(result.data).toEqual({ success: true });
      expect(apiClient.delete).toHaveBeenCalledWith("/incomes/3");
    });
  });

  describe("parseIncomeVoice", () => {
    test("posts voice text and returns data", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { parsed: { amount: 200 } } });

      const result = await parseIncomeVoice("5tr luong");
      expect(result).toEqual({ parsed: { amount: 200 } });
      expect(apiClient.post).toHaveBeenCalledWith("/gemini/voice-parse", { text: "5tr luong" });
    });
  });

  describe("exportIncomeReport", () => {
    test("exports all months report and downloads file", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { presignedUrl: "https://example.com/income.xlsx" } });

      await exportIncomeReport("all");

      expect(apiClient.post).toHaveBeenCalledWith("/documents/report/income", {
        all: true,
        month: expect.any(Number),
        year: expect.any(Number),
      });
      expect(downloadAndShareFile).toHaveBeenCalledWith("https://example.com/income.xlsx", "income_report_all_months.xlsx");
    });

    test("exports current month report and downloads file", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { presignedUrl: "https://example.com/monthly.xlsx" } });

      await exportIncomeReport("month");

      expect(apiClient.post).toHaveBeenCalledWith("/documents/report/income", {
        month: expect.any(Number),
        year: expect.any(Number),
      });
      expect(downloadAndShareFile).toHaveBeenCalledWith("https://example.com/monthly.xlsx", expect.stringMatching(/^income_report_\d+_\d+\.xlsx$/));
    });

    test("throws when presignedUrl is missing", async () => {
      apiClient.post.mockResolvedValueOnce({ data: {} });

      await expect(exportIncomeReport("all")).rejects.toThrow("Không lấy được link tải file");
      expect(downloadAndShareFile).not.toHaveBeenCalled();
    });
  });
});
