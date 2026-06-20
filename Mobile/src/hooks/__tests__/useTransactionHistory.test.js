jest.mock("../../services/apiClient", () => ({ get: jest.fn() }));
jest.mock("../../services/expenseService", () => ({ fetchExpensesByFilter: jest.fn(), deleteExpenseById: jest.fn() }));
jest.mock("../../services/incomeService", () => ({ fetchIncomesByFilter: jest.fn(), deleteIncomeById: jest.fn() }));
jest.mock("../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.message || f }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

import { buildDaysInMonth, groupTransactionsByDate } from "../useTransactionHistory";

describe("useTransactionHistory helpers", () => {
  describe("buildDaysInMonth", () => {
    test("returns leading empty days then actual days", () => {
      const days = buildDaysInMonth(new Date(2026, 5, 1));
      const firstNonEmpty = days.findIndex((d) => d.day !== null);
      expect(firstNonEmpty).toBeGreaterThanOrEqual(0);
      for (let i = 0; i < firstNonEmpty; i++) {
        expect(days[i].day).toBeNull();
        expect(days[i].id).toMatch(/^empty-/);
      }
      const actualDays = days.filter((d) => d.day !== null);
      expect(actualDays.length).toBe(30);
    });

    test("marks today correctly", () => {
      const today = new Date();
      const days = buildDaysInMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      const todayDay = days.find((d) => d.isToday);
      expect(todayDay).toBeDefined();
      expect(todayDay.day).toBe(today.getDate());
    });

    test("handles February in leap year", () => {
      const days = buildDaysInMonth(new Date(2024, 1, 1));
      const actualDays = days.filter((d) => d.day !== null);
      expect(actualDays.length).toBe(29);
    });

    test("handles February in non-leap year", () => {
      const days = buildDaysInMonth(new Date(2023, 1, 1));
      const actualDays = days.filter((d) => d.day !== null);
      expect(actualDays.length).toBe(28);
    });
  });

  describe("groupTransactionsByDate", () => {
    const t1 = { id: 1, type: "expense", amount: 100, createdAt: "2026-06-15T10:00:00Z" };
    const t2 = { id: 2, type: "income", amount: 500, createdAt: "2026-06-15T12:00:00Z" };
    const t3 = { id: 3, type: "expense", amount: 50, createdAt: "2026-06-16T08:00:00Z" };

    test("groups transactions by date", () => {
      const groups = groupTransactionsByDate([t1, t2, t3]);
      expect(groups).toHaveLength(2);
      expect(groups[0].items).toHaveLength(1);
      expect(groups[0].totalExpense).toBe(50);
      expect(groups[1].items).toHaveLength(2);
      expect(groups[1].totalIncome).toBe(500);
      expect(groups[1].totalExpense).toBe(100);
    });

    test("sorts groups by date descending", () => {
      const groups = groupTransactionsByDate([t3, t1]);
      expect(groups[0].date > groups[1].date).toBe(true);
    });

    test("returns empty array for empty input", () => {
      expect(groupTransactionsByDate([])).toEqual([]);
    });

    test("handles transactions with missing createdAt", () => {
      const tx = { id: 1, type: "expense", amount: 50, date: "2026-06-15" };
      const groups = groupTransactionsByDate([tx]);
      expect(groups).toHaveLength(1);
      expect(groups[0].totalExpense).toBe(50);
    });
  });
});
