jest.mock("../../services/categoryService", () => ({ fetchCategoriesByType: jest.fn() }));
jest.mock("../../services/incomeService", () => ({ createIncome: jest.fn(), updateIncome: jest.fn() }));
jest.mock("../../services/jarService", () => ({ fetchJars: jest.fn() }));
jest.mock("../../utils/format", () => ({ formatCurrencyInput: jest.fn((v) => v), parseCurrencyInput: jest.fn((v) => Number(v) || 0), todayIso: () => "2026-06-19", getApiErrorMessage: (e, f) => e?.message || f }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

function buildAllocations(jars, total) {
  if (!jars.length || total <= 0) return [];
  let remaining = total;
  return jars.map((jar, index) => {
    const percentage = jar.targetPercentage ?? 0;
    const amount = index === jars.length - 1 ? remaining : Math.round((total * percentage) / 100);
    if (index !== jars.length - 1) remaining -= amount;
    return { jarId: jar.id, jarName: jar.name, jarIcon: jar.icon, jarColor: jar.color, amount, percentage };
  });
}

function buildExistingAllocations(jars, existingAllocations = []) {
  if (!jars.length || !existingAllocations.length) return [];
  return jars.map((jar) => {
    const existing = existingAllocations.find((a) => Number(a.jarId) === Number(jar.id));
    return { jarId: jar.id, jarName: jar.name, jarIcon: jar.icon, jarColor: jar.color, amount: Number(existing?.amount || 0), percentage: jar.targetPercentage ?? 0 };
  });
}

import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useIncomeForm from "../useIncomeForm";

describe("useIncomeForm helpers", () => {
  describe("buildAllocations", () => {
    test("returns empty for empty jars", () => {
      expect(buildAllocations([], 1000)).toEqual([]);
    });

    test("returns empty for zero total", () => {
      const jars = [{ id: 1, name: "Main", targetPercentage: 100 }];
      expect(buildAllocations(jars, 0)).toEqual([]);
    });

    test("allocates based on percentages", () => {
      const jars = [
        { id: 1, name: "Main", icon: "i1", color: "red", targetPercentage: 60 },
        { id: 2, name: "Save", icon: "i2", color: "blue", targetPercentage: 40 },
      ];
      const result = buildAllocations(jars, 1000);
      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(600);
      expect(result[0].jarId).toBe(1);
      expect(result[1].amount).toBe(400);
      expect(result[1].jarId).toBe(2);
    });

    test("last jar gets remaining", () => {
      const jars = [
        { id: 1, name: "A", targetPercentage: 33 },
        { id: 2, name: "B", targetPercentage: 33 },
        { id: 3, name: "C", targetPercentage: 34 },
      ];
      const result = buildAllocations(jars, 100);
      const total = result.reduce((s, a) => s + a.amount, 0);
      expect(total).toBe(100);
    });
  });

  describe("buildExistingAllocations", () => {
    const jars = [{ id: 1, name: "Main", targetPercentage: 60 }, { id: 2, name: "Save", targetPercentage: 40 }];

    test("returns empty for empty existing", () => {
      expect(buildExistingAllocations(jars, [])).toEqual([]);
    });

    test("maps existing allocations to jars", () => {
      const existing = [{ jarId: 1, amount: 300 }];
      const result = buildExistingAllocations(jars, existing);
      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(300);
      expect(result[1].amount).toBe(0);
    });
  });
});

describe("useIncomeForm", () => {
  const { fetchCategoriesByType } = require("../../services/categoryService");
  const { createIncome, updateIncome } = require("../../services/incomeService");
  const { fetchJars } = require("../../services/jarService");

  beforeEach(() => { jest.clearAllMocks(); });

  test("returns initial state", () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useIncomeForm({}));

    expect(result.current.name).toBe("");
    expect(result.current.amount).toBe("");
    expect(result.current.date).toBe("2026-06-19");
    expect(result.current.categoryId).toBe("");
    expect(result.current.submitting).toBe(false);
    expect(result.current.jars).toEqual([]);
    expect(result.current.allocations).toEqual([]);
  });

  test("loads categories on mount", async () => {
    const cats = [{ id: 1, name: "Salary" }, { id: 2, name: "Bonus" }];
    fetchCategoriesByType.mockResolvedValueOnce(cats);
    fetchJars.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useIncomeForm({}));
    await act(async () => {});

    expect(fetchCategoriesByType).toHaveBeenCalledWith("income");
    expect(result.current.categories).toEqual(cats);
    expect(result.current.categoryId).toBe("1");
  });

  test("loads jars and builds allocations", async () => {
    const jars = [{ id: 10, name: "Main", icon: "i", color: "c", targetPercentage: 100 }];
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce(jars);

    const { result } = renderHook(() => useIncomeForm({}));
    await act(async () => {});

    expect(fetchJars).toHaveBeenCalled();
    expect(result.current.jars).toEqual(jars);
  });

  test("populates initialData", async () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);

    const initialData = { id: 5, name: "Salary", amount: 1000000, date: "2026-06-15", categoryId: 3 };
    const { result } = renderHook(() => useIncomeForm({ initialData }));
    await act(async () => {});

    expect(result.current.name).toBe("Salary");
    expect(result.current.amount).toBe("1000000");
    expect(result.current.date).toBe("2026-06-15");
    expect(result.current.categoryId).toBe("3");
  });

  test("validates missing name on save", () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);
    const alertSpy = jest.spyOn(Alert, "alert");

    const { result } = renderHook(() => useIncomeForm({}));
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("incomeForm.missingInfoTitle", "incomeForm.missingName");
  });

  test("validates missing amount on save", () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);
    const alertSpy = jest.spyOn(Alert, "alert");

    const { result } = renderHook(() => useIncomeForm({}));
    act(() => { result.current.setName("Salary"); });
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("incomeForm.missingInfoTitle", "incomeForm.missingAmount");
  });

  test("validates invalid amount on save", () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);
    const alertSpy = jest.spyOn(Alert, "alert");

    const { result } = renderHook(() => useIncomeForm({}));
    act(() => {
      result.current.setName("Salary");
      result.current.setAmount("0");
    });
    act(() => { result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("incomeForm.invalidAmountTitle", "incomeForm.invalidAmountMsg");
  });

  test("onSave creates income successfully", async () => {
    const cats = [{ id: 1, name: "Salary", icon: "money" }];
    const jars = [{ id: 10, name: "Main", targetPercentage: 100 }];
    fetchCategoriesByType.mockResolvedValueOnce(cats);
    fetchJars.mockResolvedValueOnce(jars);
    createIncome.mockResolvedValueOnce({ id: 100 });

    const onSaved = jest.fn();
    const { result } = renderHook(() => useIncomeForm({ onSaved }));

    await act(async () => {});
    act(() => {
      result.current.setName("Salary");
      result.current.setAmount("1000000");
    });

    await act(async () => { await result.current.onSave(); });

    expect(createIncome).toHaveBeenCalledWith(expect.objectContaining({ name: "Salary", amount: 1000000, categoryId: 1 }));
  });

  test("onSave updates income when editing", async () => {
    const cats = [{ id: 1, name: "Salary", icon: "money" }];
    fetchCategoriesByType.mockResolvedValueOnce(cats);
    fetchJars.mockResolvedValueOnce([]);
    updateIncome.mockResolvedValueOnce({});

    const initialData = { id: 5, name: "Salary", amount: 1000000, categoryId: 1 };
    const onSaved = jest.fn();
    const { result } = renderHook(() => useIncomeForm({ initialData, onSaved }));

    await act(async () => {});
    act(() => { result.current.setName("Salary adjusted"); });

    await act(async () => { await result.current.onSave(); });

    expect(updateIncome).toHaveBeenCalledWith(5, expect.objectContaining({ name: "Salary adjusted" }));
  });

  test("onSave handles error", async () => {
    const cats = [{ id: 1, name: "Salary", icon: "money" }];
    fetchCategoriesByType.mockResolvedValueOnce(cats);
    fetchJars.mockResolvedValueOnce([]);
    createIncome.mockRejectedValueOnce(new Error("Server error"));

    const { result } = renderHook(() => useIncomeForm({}));
    const alertSpy = jest.spyOn(Alert, "alert");

    await act(async () => {});
    act(() => {
      result.current.setName("Salary");
      result.current.setAmount("1000000");
    });

    await act(async () => { await result.current.onSave(); });

    expect(alertSpy).toHaveBeenCalledWith("incomeForm.saveFailTitle", "Server error");
  });

  test("setAmount touches amount and formats", () => {
    fetchCategoriesByType.mockResolvedValueOnce([]);
    fetchJars.mockResolvedValueOnce([]);
    const { formatCurrencyInput } = require("../../utils/format");
    formatCurrencyInput.mockReturnValueOnce("1,000,000");

    const { result } = renderHook(() => useIncomeForm({}));
    act(() => { result.current.setAmount("1000000"); });

    expect(formatCurrencyInput).toHaveBeenCalledWith("1000000");
    expect(result.current.amount).toBe("1,000,000");
  });
});
