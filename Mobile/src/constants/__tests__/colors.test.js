jest.mock("../../contexts/ThemeContext", () => ({
  useTheme: jest.fn(),
  THEME_MODES: { LIGHT: "light", DARK: "dark" },
}));

import { useTheme } from "../../contexts/ThemeContext";
import { COLORS, DARK_COLORS, useAppColors } from "../colors";

describe("colors constants", () => {
  test("COLORS has expected key categories", () => {
    expect(COLORS.PRIMARY).toBe("#ef5e83");
    expect(COLORS.WHITE).toBe("#FFFFFF");
    expect(COLORS.BLACK).toBe("#000000");
    expect(COLORS.INCOME).toBe("#2A9D8F");
    expect(COLORS.EXPENSE).toBe("#E76F51");
    expect(COLORS.BG).toBe("#FFF5F7");
    expect(COLORS.APP_BACKGROUND).toBe("#F2F2F7");
  });

  test("DARK_COLORS overrides light values", () => {
    expect(DARK_COLORS.BG).toBe("#0F0D0C");
    expect(DARK_COLORS.APP_BACKGROUND).toBe("#1C1C1E");
    expect(DARK_COLORS.TEXT).toBe("#F3EEEC");
  });

  test("DARK_COLORS inherits unchanged values from COLORS", () => {
    expect(DARK_COLORS.PRIMARY).toBe(COLORS.PRIMARY);
    expect(DARK_COLORS.INCOME).toBe(COLORS.INCOME);
    expect(DARK_COLORS.EXPENSE).toBe(COLORS.EXPENSE);
  });

  test("useAppColors returns COLORS in light mode", () => {
    useTheme.mockReturnValue({ theme: "light" });
    expect(useAppColors()).toEqual(COLORS);
  });

  test("useAppColors returns DARK_COLORS in dark mode", () => {
    useTheme.mockReturnValue({ theme: "dark" });
    expect(useAppColors()).toEqual(DARK_COLORS);
  });
});
