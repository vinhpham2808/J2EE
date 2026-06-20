jest.mock("@react-native-async-storage/async-storage", () => {
  let store = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
      setItem: jest.fn((key, value) => { store[key] = value; return Promise.resolve(); }),
      clear: jest.fn(() => { store = {}; return Promise.resolve(); }),
    },
  };
});

import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider, ThemeContext, THEME_MODES, useTheme } from "../ThemeContext";

describe("ThemeContext", () => {
  beforeEach(() => { AsyncStorage.clear(); jest.clearAllMocks(); });

  test("provides default light theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe(THEME_MODES.LIGHT);
  });

  test("loaded becomes true after mount", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    await act(async () => {});
    expect(result.current.loaded).toBe(true);
  });

  test("toggleTheme switches from light to dark", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe(THEME_MODES.DARK);
  });

  test("toggleTheme switches back to light", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => { result.current.toggleTheme(); });
    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe(THEME_MODES.LIGHT);
  });

  test("setThemeMode sets specific mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => { result.current.setThemeMode(THEME_MODES.DARK); });

    expect(result.current.theme).toBe(THEME_MODES.DARK);
  });

  test("setThemeMode ignores invalid mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => { result.current.setThemeMode("invalid"); });

    expect(result.current.theme).toBe(THEME_MODES.LIGHT);
  });

  test("toggleTheme persists to AsyncStorage", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => { result.current.toggleTheme(); });
    await act(async () => {});

    expect(AsyncStorage.setItem).toHaveBeenCalledWith("@app_theme", "dark");
  });

  test("loads stored dark theme on mount", async () => {
    await AsyncStorage.setItem("@app_theme", "dark");

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    await act(async () => {});

    expect(result.current.theme).toBe(THEME_MODES.DARK);
  });

  test("useTheme throws outside provider", () => {
    expect(() => renderHook(() => useTheme())).toThrow("useTheme must be used inside ThemeProvider");
  });

  test("handles AsyncStorage error gracefully", async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error("Storage error"));

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    await act(async () => {});

    expect(result.current.theme).toBe(THEME_MODES.LIGHT);
    expect(result.current.loaded).toBe(true);
  });

  test("setThemeMode persists to AsyncStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => { result.current.setThemeMode(THEME_MODES.DARK); });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith("@app_theme", "dark");
  });
});
