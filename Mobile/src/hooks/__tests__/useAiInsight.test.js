import React from "react";
import { renderHook, act } from "@testing-library/react-native";

jest.mock("../../services/aiInsightService", () => ({ fetchAiForecast: jest.fn() }));
jest.mock("../../services/forecastDraftCacheService", () => ({ saveAiForecastDraft: jest.fn() }));
jest.mock("i18next", () => ({ t: (key) => key }));
jest.mock("../../contexts/AuthContext", () => {
  const ReactMock = require("react");
  const MockContext = ReactMock.createContext({ user: null });
  return {
    AuthContext: MockContext,
    __esModule: true,
  };
});

import { AuthContext } from "../../contexts/AuthContext";
import { useAiInsight } from "../useAiInsight";

function createWrapper(mockUser) {
  return ({ children }) => (
    <AuthContext.Provider value={{ user: mockUser }}>
      {children}
    </AuthContext.Provider>
  );
}

describe("useAiInsight", () => {
  const { fetchAiForecast } = require("../../services/aiInsightService");
  const { saveAiForecastDraft } = require("../../services/forecastDraftCacheService");

  beforeEach(() => { jest.clearAllMocks(); });

  test("returns initial state with PREMIUM user", () => {
    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });
    expect(result.current.visible).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.isPremium).toBe(true);
  });

  test("openSheet resets state and sets visible", () => {
    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });

    act(() => { result.current.openSheet(); });

    expect(result.current.visible).toBe(true);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test("closeSheet hides and resets", () => {
    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });

    act(() => { result.current.openSheet(); });
    act(() => { result.current.closeSheet(); });

    expect(result.current.visible).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test("goToPrevMonth navigates backwards", () => {
    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });

    act(() => { result.current.openSheet(); });
    const initialMonth = result.current.selectedMonth;
    const initialYear = result.current.selectedYear;

    act(() => { result.current.goToNextMonth(); });
    expect(result.current.selectedMonth).not.toBe(initialMonth);
    expect(result.current.canGoPrev).toBe(true);

    act(() => { result.current.goToPrevMonth(); });
    expect(result.current.selectedMonth).toBe(initialMonth);
    expect(result.current.selectedYear).toBe(initialYear);
  });

  test("goToMonth sets valid month", () => {
    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });

    act(() => { result.current.openSheet(); });
    const month = result.current.availableMonths[0];

    act(() => { result.current.goToMonth(month.month, month.year); });
    expect(result.current.selectedMonth).toBe(month.month);
    expect(result.current.selectedYear).toBe(month.year);
  });

  test("analyze calls API and sets result on success", async () => {
    const mockData = { categories: [], narrative: "Good" };
    fetchAiForecast.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });
    act(() => { result.current.openSheet(); });

    await act(async () => { await result.current.analyze(); });

    expect(fetchAiForecast).toHaveBeenCalled();
    expect(result.current.result).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });

  test("analyze sets error when API returns error message", async () => {
    fetchAiForecast.mockResolvedValueOnce({ error: "API limit reached" });

    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });
    act(() => { result.current.openSheet(); });

    await act(async () => { await result.current.analyze(); });

    expect(result.current.error).toBeTruthy();
    expect(result.current.result).toBeNull();
  });

  test("analyze sets error on API failure", async () => {
    fetchAiForecast.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });
    act(() => { result.current.openSheet(); });

    await act(async () => { await result.current.analyze(); });

    expect(result.current.error).toBeTruthy();
    expect(result.current.result).toBeNull();
  });

  test("retry calls analyze again", async () => {
    fetchAiForecast.mockResolvedValueOnce({ categories: [] });

    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });
    act(() => { result.current.openSheet(); });

    await act(async () => { await result.current.retry(); });
    expect(fetchAiForecast).toHaveBeenCalledTimes(1);
  });

  test("confirmAnalysis saves draft and closes", () => {
    saveAiForecastDraft.mockReturnValueOnce({ draft: true });

    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });
    act(() => { result.current.openSheet(); });

    act(() => { result.current.confirmAnalysis(); });
    expect(saveAiForecastDraft).toHaveBeenCalled();
    expect(result.current.visible).toBe(false);
  });

  test("isPremium reflects FREE plan", () => {
    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "FREE", subscriptionStatus: "ACTIVE" }),
    });
    expect(result.current.isPremium).toBe(false);
    expect(result.current.subscriptionPlan).toBe("FREE");
  });

  test("isPremium requires ACTIVE status", () => {
    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "INACTIVE" }),
    });
    expect(result.current.isPremium).toBe(false);
  });

  test("availableMonths returns 6 months from next month", () => {
    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });
    expect(result.current.availableMonths).toHaveLength(6);
  });

  test("canGoPrev and canGoNext change with selection", () => {
    const { result } = renderHook(() => useAiInsight(), {
      wrapper: createWrapper({ subscriptionPlan: "PREMIUM", subscriptionStatus: "ACTIVE" }),
    });
    act(() => { result.current.openSheet(); });

    expect(result.current.canGoPrev).toBe(false);
    act(() => { result.current.goToNextMonth(); });
    expect(result.current.canGoPrev).toBe(true);

    act(() => { result.current.goToNextMonth(); });
    expect(result.current.canGoNext).toBe(true);
  });
});
