jest.mock("../../services/apiClient", () => ({ get: jest.fn(), put: jest.fn() }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return { useFocusEffect: jest.fn((cb) => React.useEffect(() => { cb(); }, [])) };
});

import { renderHook, act } from "@testing-library/react-native";
import useEmailPreferences from "../useEmailPreferences";

describe("useEmailPreferences", () => {
  const apiClient = require("../../services/apiClient");

  beforeEach(() => { jest.clearAllMocks(); });

  test("fetches preferences on mount", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: [{ type: "DAILY_EXPENSE_REPORT", isEnabled: true }],
    });

    const { result } = renderHook(() => useEmailPreferences());

    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(apiClient.get).toHaveBeenCalledWith("/profile/email-preferences");
    expect(result.current.dailyReportPref).toEqual({ type: "DAILY_EXPENSE_REPORT", isEnabled: true });
    expect(result.current.isDailyEnabled).toBe(true);
  });

  test("defaults to disabled when no preferences", async () => {
    apiClient.get.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useEmailPreferences());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(result.current.isDailyEnabled).toBe(false);
    expect(result.current.dailyReportPref).toBeUndefined();
  });

  test("handles fetch error gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    apiClient.get.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useEmailPreferences());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(result.current.isDailyEnabled).toBe(false);
    expect(result.current.dailyReportPref).toBeUndefined();
    consoleErrorSpy.mockRestore();
  });

  test("toggleDailyEmail updates preference and calls API", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: [{ type: "DAILY_EXPENSE_REPORT", isEnabled: false }],
    });
    apiClient.put.mockResolvedValueOnce({});

    const { result } = renderHook(() => useEmailPreferences());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(result.current.isDailyEnabled).toBe(false);

    await act(async () => {
      await result.current.toggleDailyEmail(true);
    });

    expect(apiClient.put).toHaveBeenCalledWith("/profile/email-preferences", [
      { type: "DAILY_EXPENSE_REPORT", isEnabled: true },
    ]);
    expect(result.current.isDailyEnabled).toBe(true);
  });

  test("rolls back preference on API error", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: [{ type: "DAILY_EXPENSE_REPORT", isEnabled: true }],
    });
    apiClient.put.mockRejectedValueOnce(new Error("Update failed"));

    const { result } = renderHook(() => useEmailPreferences());
    await act(async () => {});

    expect(result.current.isDailyEnabled).toBe(true);

    await act(async () => {
      await result.current.toggleDailyEmail(false);
    });

    expect(result.current.isDailyEnabled).toBe(true);
  });

  test("does nothing when no dailyReportPref on toggle", async () => {
    apiClient.get.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useEmailPreferences());
    await act(async () => {});

    await act(async () => {
      await result.current.toggleDailyEmail(true);
    });
    expect(apiClient.put).not.toHaveBeenCalled();
  });
});
