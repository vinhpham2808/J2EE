jest.mock("../../services/categoryService", () => ({ fetchCategoriesByType: jest.fn() }));
jest.mock("../../services/apiClient", () => ({ get: jest.fn(), post: jest.fn(), delete: jest.fn() }));
jest.mock("../../constants/api", () => ({ API_ENDPOINTS: { GET_BUDGETS: "/budgets", SET_BUDGET: "/budgets", DELETE_BUDGET: (id) => `/budgets/${id}` } }));
jest.mock("../../utils/format", () => ({ formatCurrencyInput: (v) => v.replace(/[^0-9]/g, ""), parseCurrencyInput: (v) => Number(v.replace(/[^0-9]/g, "")) || 0, getApiErrorMessage: (e, f) => e?.message || f }));
jest.mock("../../utils/budget", () => ({ summarizeBudgets: (b) => ({ total: b.length, count: b.length }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return { useFocusEffect: jest.fn((cb) => React.useEffect(() => { cb(); }, [])) };
});

import { renderHook, act } from "@testing-library/react-native";
import useBudget from "../useBudget";

describe("useBudget", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("returns initial state", async () => {
    const { result } = renderHook(() => useBudget());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(result.current.budgets).toEqual([]);
    expect(result.current.amountLimit).toBe("");
    expect(result.current.submitting).toBe(false);
  });

  test("setAmountLimit formats currency input", () => {
    const { result } = renderHook(() => useBudget());
    act(() => { result.current.setAmountLimit("100000"); });
    expect(result.current.amountLimit).toBe("100000");
  });

  test("initial month/year are set", async () => {
    const now = new Date();
    const { result } = renderHook(() => useBudget());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(result.current.month).toBe(String(now.getMonth() + 1));
    expect(result.current.year).toBe(String(now.getFullYear()));
  });
});
