jest.mock("../../services/categoryService", () => ({ fetchCategoriesByType: jest.fn() }));
jest.mock("../../services/jarService", () => ({ fetchJars: jest.fn() }));
jest.mock("../../services/receiptImportService", () => ({ confirmReceiptImport: jest.fn() }));
jest.mock("../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.message || f, todayIso: () => "2026-06-19" }));
jest.mock("../../utils/jar", () => ({ PARENT_WALLET_NAME: "parent" }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useReceiptPreview from "../useReceiptPreview";

describe("useReceiptPreview", () => {
  const { fetchCategoriesByType } = require("../../services/categoryService");
  const { fetchJars } = require("../../services/jarService");
  const { confirmReceiptImport } = require("../../services/receiptImportService");

  beforeEach(() => { jest.clearAllMocks(); });

  const mockAnalyzeResult = {
    items: [
      { name: "Coffee", amount: 50000, categoryId: 1, icon: "coffee" },
      { name: "Sandwich", amount: 75000, categoryId: 2, icon: "food" },
    ],
    merchant: "Coffee Shop",
    location: "Downtown",
    receiptDate: "2026-06-18",
  };

  test("returns initial state with items", async () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useReceiptPreview({ analyzeResult: mockAnalyzeResult }));
    await act(async () => {});

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].name).toBe("Coffee");
    expect(result.current.items[1].name).toBe("Sandwich");
    expect(result.current.totalAmount).toBe(125000);
    expect(result.current.submitting).toBe(false);
    expect(result.current.hasInitialItems).toBe(true);
  });

  test("loads categories and jars on mount", async () => {
    const cats = [{ id: 1, name: "Food" }];
    const jars = [{ id: 10, name: "parent" }];
    fetchCategoriesByType.mockResolvedValueOnce(cats);
    fetchJars.mockResolvedValueOnce(jars);

    const { result } = renderHook(() => useReceiptPreview({ analyzeResult: mockAnalyzeResult }));
    await act(async () => {});

    expect(fetchCategoriesByType).toHaveBeenCalledWith("expense");
    expect(result.current.categories).toEqual(cats);
    expect(fetchJars).toHaveBeenCalled();
    expect(result.current.jars).toEqual(jars);
    expect(result.current.jarId).toBe("10");
  });

  test("updateItem changes item at index", async () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useReceiptPreview({ analyzeResult: mockAnalyzeResult }));
    await act(async () => {});

    act(() => { result.current.updateItem(0, { name: "Latte", amount: 60000, categoryId: 1 }); });

    expect(result.current.items[0].name).toBe("Latte");
    expect(result.current.items[0].amount).toBe(60000);
  });

  test("deleteItem shows confirmation", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useReceiptPreview({ analyzeResult: mockAnalyzeResult }));
    await act(async () => {});

    act(() => { result.current.deleteItem(0); });
    expect(alertSpy).toHaveBeenCalledWith("receiptValidation.deleteItemTitle", "receiptValidation.deleteItemMsg", expect.any(Array));
  });

  test("confirmImport validates items and calls API", async () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);
    confirmReceiptImport.mockResolvedValueOnce({ importedCount: 2 });

    const onImportSuccess = jest.fn();
    const { result } = renderHook(() => useReceiptPreview({ analyzeResult: mockAnalyzeResult, onImportSuccess }));
    await act(async () => {});

    await act(async () => { await result.current.confirmImport(); });

    expect(confirmReceiptImport).toHaveBeenCalledWith(expect.objectContaining({
      merchant: "Coffee Shop",
      items: expect.arrayContaining([expect.objectContaining({ name: "Coffee" })]),
    }));
  });

  test("confirmImport fails validation for empty name", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);

    const badResult = { items: [{ name: "", amount: 50000, categoryId: 1 }], receiptDate: "2026-06-18" };
    const { result } = renderHook(() => useReceiptPreview({ analyzeResult: badResult }));
    await act(async () => {});

    await act(async () => { await result.current.confirmImport(); });

    expect(alertSpy).toHaveBeenCalledWith("receiptValidation.missingNameTitle", expect.stringContaining("receiptValidation.missingNameMsg"));
    expect(confirmReceiptImport).not.toHaveBeenCalled();
  });

  test("confirmImport handles API error", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);
    confirmReceiptImport.mockRejectedValueOnce(new Error("Import failed"));

    const { result } = renderHook(() => useReceiptPreview({ analyzeResult: mockAnalyzeResult }));
    await act(async () => {});

    await act(async () => { await result.current.confirmImport(); });

    expect(alertSpy).toHaveBeenCalledWith("receiptValidation.confirmFailTitle", "Import failed");
  });

  test("categoriesLoading sets categories on error", async () => {
    fetchCategoriesByType.mockRejectedValueOnce(new Error("Load error"));
    fetchJars.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useReceiptPreview({ analyzeResult: mockAnalyzeResult }));
    await act(async () => {});

    expect(result.current.categories).toEqual([]);
  });

  test("jarsLoading sets jarId from parent wallet", async () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([{ id: 10, name: "parent" }, { id: 11, name: "savings" }]);

    const { result } = renderHook(() => useReceiptPreview({ analyzeResult: mockAnalyzeResult }));
    await act(async () => {});

    expect(result.current.jarId).toBe("10");
  });

  test("setJarId updates jar selection", async () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([{ id: 10, name: "parent" }]);

    const { result } = renderHook(() => useReceiptPreview({ analyzeResult: mockAnalyzeResult }));
    await act(async () => {});

    act(() => { result.current.setJarId("11"); });
    expect(result.current.jarId).toBe("11");
  });
});
