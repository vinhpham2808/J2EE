jest.mock("react-native-ui-datepicker", () => {
  const actual = jest.requireActual("react-native-ui-datepicker");
  return {
    __esModule: true,
    default: () => null,
    useDefaultStyles: () => ({}),
  };
});

jest.mock("../../constants/colors", () => ({
  COLORS: {
    PRIMARY: "#E8597A",
    WHITE: "#FFF",
    TEXT: "#1A0F14",
    TEXT_MUTED: "#999",
    CARD: "#FFF",
    CARD_BORDER: "#E5E5E5",
    BG: "#FFF",
  },
  useAppColors: () => ({
    TEXT: "#1A0F14",
    TEXT_MUTED: "#999",
    BG: "#FFF",
    CARD_BORDER: "#E5E5E5",
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => (key === "commonComponents.cancel" ? "Hủy" : "Xác nhận"),
    i18n: { language: "vi" },
  }),
}));

jest.mock("../format", () => ({
  todayIso: () => "2026-06-22",
}));

import { normalizeIsoDate, isIsoDate } from "../datePicker";

describe("normalizeIsoDate", () => {
  test("returns same date for valid ISO string", () => {
    expect(normalizeIsoDate("2025-06-15")).toBe("2025-06-15");
  });

  test("returns fallback for invalid date", () => {
    expect(normalizeIsoDate("not-a-date")).toBe("2026-06-22");
  });

  test("returns fallback for null", () => {
    expect(normalizeIsoDate(null)).toBe("2026-06-22");
  });

  test("returns fallback for undefined", () => {
    expect(normalizeIsoDate(undefined)).toBe("2026-06-22");
  });

  test("returns custom fallback when provided", () => {
    expect(normalizeIsoDate("bad", "2000-01-01")).toBe("2000-01-01");
  });

  test("pads single-digit month and day", () => {
    expect(normalizeIsoDate("2025-01-01")).toBe("2025-01-01");
  });

  test("rejects impossible dates", () => {
    expect(normalizeIsoDate("2025-02-30")).toBe("2026-06-22");
  });

  test("rejects month out of range", () => {
    expect(normalizeIsoDate("2025-13-01")).toBe("2026-06-22");
  });
});

describe("isIsoDate", () => {
  test("returns true for valid ISO date", () => {
    expect(isIsoDate("2025-06-15")).toBe(true);
  });

  test("returns false for invalid date", () => {
    expect(isIsoDate("not-a-date")).toBe(false);
  });

  test("returns false for null", () => {
    expect(isIsoDate(null)).toBe(false);
  });

  test("returns false for undefined", () => {
    expect(isIsoDate(undefined)).toBe(false);
  });

  test("returns false for impossible date", () => {
    expect(isIsoDate("2025-04-31")).toBe(false);
  });
});
