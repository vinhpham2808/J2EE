import {
  formatMoney,
  normalizeCurrencyInput,
  formatCurrencyInput,
  parseCurrencyInput,
  getApiErrorMessage,
  todayIso,
  formatDate,
  formatPercent,
} from "../format";

describe("formatMoney", () => {
  test("formats number as VND currency with symbol", () => {
    const result = formatMoney(1500000);
    expect(result).toMatch(/1\.?500\.?000/);
    expect(result).toMatch(/₫/);
  });

  test("handles zero", () => {
    const result = formatMoney(0);
    expect(result).toMatch(/0/);
    expect(result).toMatch(/₫/);
  });

  test("handles undefined by defaulting to 0", () => {
    expect(formatMoney()).toMatch(/0/);
  });
});

describe("normalizeCurrencyInput", () => {
  test("removes non-digit characters", () => {
    expect(normalizeCurrencyInput("1,500,000")).toBe("1500000");
    expect(normalizeCurrencyInput("abc123def")).toBe("123");
    expect(normalizeCurrencyInput("")).toBe("");
  });

  test("handles undefined or null", () => {
    expect(normalizeCurrencyInput(undefined)).toBe("");
    expect(normalizeCurrencyInput(null)).toBe("");
  });
});

describe("formatCurrencyInput", () => {
  test("formats digit string with thousand separators", () => {
    const result = formatCurrencyInput("1500000");
    expect(result).toMatch(/1\.?500\.?000/);
  });

  test("returns empty string for empty input", () => {
    expect(formatCurrencyInput("")).toBe("");
  });
});

describe("parseCurrencyInput", () => {
  test("parses formatted currency string to number", () => {
    expect(parseCurrencyInput("1,500,000")).toBe(1500000);
    expect(parseCurrencyInput("500")).toBe(500);
  });

  test("returns 0 for empty input", () => {
    expect(parseCurrencyInput("")).toBe(0);
  });
});

describe("getApiErrorMessage", () => {
  test("extracts message from response.data.message", () => {
    const error = { response: { data: { message: "Email không hợp lệ" } } };
    expect(getApiErrorMessage(error)).toBe("Email không hợp lệ");
  });

  test("falls back to error.message", () => {
    const error = { message: "Network Error" };
    expect(getApiErrorMessage(error)).toBe("Network Error");
  });

  test("falls back to default message", () => {
    expect(getApiErrorMessage({})).toBe("Đã có lỗi xảy ra");
  });

  test("uses custom fallback message", () => {
    expect(getApiErrorMessage({}, "Custom fallback")).toBe("Custom fallback");
  });
});

describe("todayIso", () => {
  test("returns date in YYYY-MM-DD format", () => {
    const result = todayIso();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatDate", () => {
  test("formats valid date string", () => {
    const result = formatDate("2025-01-15");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("returns '-' for falsy value", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("")).toBe("-");
  });
});

describe("formatPercent", () => {
  test("formats number as percentage with 1 decimal", () => {
    expect(formatPercent(75.5)).toBe("75.5%");
    expect(formatPercent(100)).toBe("100.0%");
    expect(formatPercent(0)).toBe("0.0%");
  });

  test("handles NaN by defaulting to 0 then formatting", () => {
    expect(formatPercent(NaN)).toBe("0.0%");
  });

  test("handles Infinity as non-finite", () => {
    expect(formatPercent(Infinity)).toBe("0%");
  });
});
