jest.mock("../../services/categoryService", () => ({ fetchCategoriesByType: jest.fn() }));
jest.mock("../../services/expenseService", () => ({ createExpense: jest.fn(), updateExpense: jest.fn() }));
jest.mock("../../services/jarService", () => ({ fetchJars: jest.fn() }));
jest.mock("../../utils/format", () => ({ formatCurrencyInput: jest.fn((v) => v), parseCurrencyInput: jest.fn((v) => Number(v) || 0), todayIso: () => "2026-06-19", getApiErrorMessage: (e, f) => e?.message || f }));
jest.mock("../../utils/noteParser", () => ({ parseNote: jest.fn(), suggestCategory: jest.fn() }));
jest.mock("../../utils/jar", () => ({ PARENT_WALLET_NAME: "parent" }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useExpenseForm from "../useExpenseForm";

describe("useExpenseForm", () => {
  const { fetchCategoriesByType } = require("../../services/categoryService");
  const { createExpense, updateExpense } = require("../../services/expenseService");
  const { fetchJars } = require("../../services/jarService");
  const { parseNote, suggestCategory } = require("../../utils/noteParser");

  beforeEach(() => { jest.clearAllMocks(); });

  test("returns initial state", () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useExpenseForm({}));

    expect(result.current.name).toBe("");
    expect(result.current.amount).toBe("");
    expect(result.current.date).toBe("2026-06-19");
    expect(result.current.categoryId).toBe("");
    expect(result.current.note).toBe("");
    expect(result.current.submitting).toBe(false);
    expect(result.current.categories).toEqual([]);
    expect(result.current.jars).toEqual([]);
  });

  test("loads categories on mount", async () => {
    const cats = [{ id: 1, name: "Food" }, { id: 2, name: "Transport" }];
    fetchCategoriesByType.mockResolvedValueOnce(cats);
    fetchJars.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useExpenseForm({}));
    await act(async () => {});

    expect(fetchCategoriesByType).toHaveBeenCalledWith("expense");
    expect(result.current.categories).toEqual(cats);
    expect(result.current.categoryId).toBe("1");
  });

  test("loads jars on mount", async () => {
    const jars = [{ id: 10, name: "parent" }, { id: 11, name: "savings" }];
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce(jars);

    const { result } = renderHook(() => useExpenseForm({}));
    await act(async () => {});

    expect(fetchJars).toHaveBeenCalled();
    expect(result.current.jars).toEqual(jars);
    expect(result.current.jarId).toBe("10");
  });

  test("loads jars and selects default jarId from prop", async () => {
    const jars = [{ id: 10, name: "parent" }, { id: 11, name: "savings" }];
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce(jars);

    const { result } = renderHook(() => useExpenseForm({ defaultJarId: 11 }));
    await act(async () => {});

    expect(result.current.jarId).toBe("11");
  });

  test("sets initialData into form", async () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);

    const initialData = { id: 5, name: "Lunch", amount: 150000, date: "2026-06-15", note: "At restaurant", categoryId: 3, jarId: 2 };
    const { result } = renderHook(() => useExpenseForm({ initialData }));
    await act(async () => {});

    expect(result.current.name).toBe("Lunch");
    expect(result.current.amount).toBe("150000");
    expect(result.current.date).toBe("2026-06-15");
    expect(result.current.note).toBe("At restaurant");
    expect(result.current.categoryId).toBe("3");
    expect(result.current.jarId).toBe("2");
  });

  test("setAmount formats input", () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);
    const { formatCurrencyInput } = require("../../utils/format");
    formatCurrencyInput.mockReturnValueOnce("150,000");

    const { result } = renderHook(() => useExpenseForm({}));
    act(() => { result.current.setAmount("150000"); });

    expect(formatCurrencyInput).toHaveBeenCalledWith("150000");
    expect(result.current.amount).toBe("150,000");
  });

  test("handles voice result", () => {
    const cats = [{ id: 1, name: "Food" }];
    fetchCategoriesByType.mockResolvedValueOnce(cats);
    fetchJars.mockResolvedValueOnce([]);

    parseNote.mockReturnValueOnce({ amount: 50000, note: "Pho bo", splitInfo: null });
    suggestCategory.mockReturnValueOnce(cats[0]);

    const { result } = renderHook(() => useExpenseForm({}));
    act(() => { result.current.handleVoiceResult("pho bo 50k"); });

    expect(parseNote).toHaveBeenCalledWith("pho bo 50k");
    expect(result.current.amount).toBe("50000");
    expect(result.current.name).toBe("Pho bo");
    expect(result.current.categoryId).toBe("1");
  });

  test("validates missing name on save", () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);
    const alertSpy = jest.spyOn(Alert, "alert");

    const { result } = renderHook(() => useExpenseForm({}));
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("expenseForm.missingInfoTitle", "expenseForm.missingName");
  });

  test("validates missing amount on save", () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);
    const alertSpy = jest.spyOn(Alert, "alert");

    const { result } = renderHook(() => useExpenseForm({}));
    act(() => { result.current.setName("Lunch"); });
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("expenseForm.missingInfoTitle", "expenseForm.missingAmount");
  });

  test("validates invalid amount on save", () => {
    fetchCategoriesByType.mockResolvedValueOnce([{ id: 1, name: "Food" }]);
    fetchJars.mockResolvedValueOnce([]);
    const alertSpy = jest.spyOn(Alert, "alert");

    const { result } = renderHook(() => useExpenseForm({}));
    act(() => {
      result.current.setName("Lunch");
      result.current.setAmount("-100");
    });
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("expenseForm.invalidAmountTitle", "expenseForm.invalidAmountMsg");
  });

  test("validates empty category on save", () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);
    const alertSpy = jest.spyOn(Alert, "alert");

    const { result } = renderHook(() => useExpenseForm({}));
    act(() => {
      result.current.setName("Lunch");
      result.current.setAmount("100");
    });
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("expenseForm.missingCategoryTitle", "expenseForm.missingCategoryMsg");
  });

  test("onSave creates expense successfully", async () => {
    const cats = [{ id: 1, name: "Food", icon: "food" }];
    const jars = [{ id: 10, name: "parent" }];
    fetchCategoriesByType.mockResolvedValueOnce(cats);
    fetchJars.mockResolvedValueOnce(jars);
    createExpense.mockResolvedValueOnce({ id: 100 });

    const onSaved = jest.fn();
    const { result } = renderHook(() => useExpenseForm({ onSaved }));

    await act(async () => {});
    act(() => {
      result.current.setName("Lunch");
      result.current.setAmount("50000");
    });

    await act(async () => { await result.current.onSave(); });

    expect(createExpense).toHaveBeenCalledWith(expect.objectContaining({ name: "Lunch", amount: 50000, categoryId: 1 }));
  });

  test("onSave updates expense when editing", async () => {
    const cats = [{ id: 1, name: "Food", icon: "food" }];
    const jars = [{ id: 10, name: "parent" }];
    fetchCategoriesByType.mockResolvedValueOnce(cats);
    fetchJars.mockResolvedValueOnce(jars);
    updateExpense.mockResolvedValueOnce({});

    const initialData = { id: 5, name: "Lunch", amount: 50000, categoryId: 1 };
    const onSaved = jest.fn();
    const { result } = renderHook(() => useExpenseForm({ initialData, onSaved }));

    await act(async () => {});
    act(() => {
      result.current.setName("Lunch updated");
    });

    await act(async () => { await result.current.onSave(); });

    expect(updateExpense).toHaveBeenCalledWith(5, expect.objectContaining({ name: "Lunch updated" }));
  });

  test("onSave handles error", async () => {
    const cats = [{ id: 1, name: "Food", icon: "food" }];
    fetchCategoriesByType.mockResolvedValueOnce(cats);
    fetchJars.mockResolvedValueOnce([]);
    createExpense.mockRejectedValueOnce(new Error("Server error"));

    const { result } = renderHook(() => useExpenseForm({}));
    const alertSpy = jest.spyOn(Alert, "alert");

    await act(async () => {});
    act(() => {
      result.current.setName("Lunch");
      result.current.setAmount("50000");
    });

    await act(async () => { await result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("expenseForm.saveFailTitle", "Server error");
  });

  test("categoryLoading error shows alert", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    fetchCategoriesByType.mockRejectedValueOnce(new Error("Load error"));
    fetchJars.mockResolvedValueOnce([]);

    renderHook(() => useExpenseForm({}));
    await act(async () => {});

    expect(alertSpy).toHaveBeenCalledWith("common.error", "Load error");
  });
});
