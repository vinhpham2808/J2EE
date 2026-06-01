import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDateForDisplay,
  formatLocalDateToIso,
  getMonthFilterValue,
  isIsoDateAfter,
  normalizeToIsoDate,
  parseDisplayDateToIso,
  sanitizeDateInput,
} from "./dateInput.js";

test("normalizeToIsoDate accepts ISO, ISO datetime, and display dates", () => {
  assert.equal(normalizeToIsoDate("2026-05-30"), "2026-05-30");
  assert.equal(normalizeToIsoDate("2026-05-30T08:30:00"), "2026-05-30");
  assert.equal(normalizeToIsoDate("30/05/2026"), "2026-05-30");
});

test("normalizeToIsoDate rejects impossible dates", () => {
  assert.equal(normalizeToIsoDate("31/02/2026"), "");
  assert.equal(normalizeToIsoDate("2026-13-10"), "");
});

test("formatDateForDisplay always returns dd/mm/yyyy", () => {
  assert.equal(formatDateForDisplay("2026-05-30"), "30/05/2026");
  assert.equal(formatDateForDisplay("2026-05-30T08:30:00"), "30/05/2026");
  assert.equal(formatDateForDisplay(""), "");
});

test("sanitizeDateInput keeps partial typing and normalizes pasted ISO values", () => {
  assert.equal(sanitizeDateInput("1"), "1");
  assert.equal(sanitizeDateInput("1205"), "12/05");
  assert.equal(sanitizeDateInput("12052026"), "12/05/2026");
  assert.equal(sanitizeDateInput("2026-05-30"), "30/05/2026");
});

test("parseDisplayDateToIso converts dd/mm/yyyy to iso", () => {
  assert.equal(parseDisplayDateToIso("30/05/2026"), "2026-05-30");
});

test("isIsoDateAfter compares normalized ISO dates safely", () => {
  assert.equal(isIsoDateAfter("31/05/2026", "30/05/2026"), true);
  assert.equal(isIsoDateAfter("2026-05-29", "2026-05-30"), false);
});

test("formatLocalDateToIso uses local calendar fields", () => {
  const sampleDate = new Date(2026, 4, 30);
  assert.equal(formatLocalDateToIso(sampleDate), "2026-05-30");
});

test("getMonthFilterValue extracts yyyy-mm from a date", () => {
  assert.equal(getMonthFilterValue("30/05/2026"), "2026-05");
  assert.equal(getMonthFilterValue(""), "");
});
