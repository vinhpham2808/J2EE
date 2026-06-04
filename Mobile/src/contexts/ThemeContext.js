import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "@app_theme";

export const ThemeContext = createContext(null);

export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEME_MODES.LIGHT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === THEME_MODES.DARK || stored === THEME_MODES.LIGHT) {
          setTheme(stored);
        }
      } catch (e) {
        console.warn("Failed to load theme from storage:", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT;
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch((e) =>
        console.warn("Failed to save theme:", e)
      );
      return next;
    });
  }, []);

  const setThemeMode = useCallback((mode) => {
    if (mode === THEME_MODES.LIGHT || mode === THEME_MODES.DARK) {
      setTheme(mode);
      AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((e) =>
        console.warn("Failed to save theme:", e)
      );
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
