import test from "node:test";
import assert from "node:assert/strict";
import moment from "moment";
import {
  buildCalendarDays,
  buildTransactionDayMap,
  calculateMonthTotals,
  formatCompactTransactionAmount,
  getDefaultSelectedDate,
} from "./transactionCalendar.js";

test("buildTransactionDayMap groups transactions by local calendar day and keeps daily totals", () => {
  const dayMap = buildTransactionDayMap(
    [
      { id: 1, name: "Luong", amount: 1000000, date: "2026-05-10", type: "income" },
      { id: 2, name: "An trua", amount: 50000, date: "2026-05-10", type: "expense" },
      { id: 3, name: "Thuong", amount: 200000, date: "2026-05-11", type: "income" },
    ],
    "both",
  );

  assert.equal(dayMap.get("2026-05-10").transactions.length, 2);
  assert.deepEqual(dayMap.get("2026-05-10").totals, {
    income: 1000000,
    expense: 50000,
  });
  assert.deepEqual(dayMap.get("2026-05-11").totals, {
    income: 200000,
    expense: 0,
  });
});

test("buildCalendarDays returns a padded 6x7 month grid", () => {
  const month = moment("2026-05-01", "YYYY-MM-DD", true);
  const calendarDays = buildCalendarDays(month);

  assert.equal(calendarDays.length, 42);
  assert.equal(calendarDays[0].dateKey, "2026-04-26");
  assert.equal(calendarDays[0].isCurrentMonth, false);
  assert.equal(calendarDays[6].dateKey, "2026-05-02");
  assert.equal(calendarDays[6].isCurrentMonth, true);
  assert.equal(calendarDays[41].dateKey, "2026-06-06");
});

test("calculateMonthTotals sums only the visible month and computes net balance", () => {
  const month = moment("2026-05-01", "YYYY-MM-DD", true);
  const totals = calculateMonthTotals(
    [
      { amount: 1000000, date: "2026-05-03", type: "income" },
      { amount: 200000, date: "2026-05-05", type: "expense" },
      { amount: 150000, date: "2026-04-30", type: "expense" },
    ],
    month,
    "both",
  );

  assert.deepEqual(totals, {
    income: 1000000,
    expense: 200000,
    net: 800000,
  });
});

test("getDefaultSelectedDate returns today only when the current month contains transactions for today", () => {
  const currentMonth = moment("2026-05-01", "YYYY-MM-DD", true);
  const now = moment("2026-05-10", "YYYY-MM-DD", true);
  const dayMap = buildTransactionDayMap(
    [{ amount: 100000, date: "2026-05-10", type: "income" }],
    "income",
  );

  assert.equal(getDefaultSelectedDate(currentMonth, dayMap, now), "2026-05-10");
  assert.equal(
    getDefaultSelectedDate(
      moment("2026-04-01", "YYYY-MM-DD", true),
      dayMap,
      now,
    ),
    null,
  );
  assert.equal(
    getDefaultSelectedDate(
      currentMonth,
      buildTransactionDayMap([{ amount: 100000, date: "2026-05-09", type: "income" }], "income"),
      now,
    ),
    null,
  );
});

test("formatCompactTransactionAmount shortens values for calendar badges", () => {
  assert.equal(formatCompactTransactionAmount(1000000, "income"), "+1M");
  assert.equal(formatCompactTransactionAmount(500000, "expense"), "-500K");
  assert.equal(formatCompactTransactionAmount(1250000, "income"), "+1.3M");
  assert.equal(formatCompactTransactionAmount(950, "expense"), "-950");
});
