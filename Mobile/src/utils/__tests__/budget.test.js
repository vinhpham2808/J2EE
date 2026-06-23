jest.mock("../../constants/colors", () => ({
  COLORS: {
    EXPENSE: "#EF4444",
    EXPENSE_LIGHT: "#FDE8E3",
    WARNING: "#FFB84D",
    WARNING_LIGHT: "#FFF3E0",
    INCOME: "#22C55E",
    INCOME_LIGHT: "#E8F5F3",
  },
}));

import { getBudgetVisual, summarizeBudgets } from "../budget";

describe("getBudgetVisual", () => {
  test("returns over-budget style when ratio >= 1", () => {
    const result = getBudgetVisual(1);
    expect(result.color).toBe("#EF4444");
    expect(result.label).toBe("Vượt hạn mức");
  });

  test("returns near-limit style when ratio >= 0.8", () => {
    const result = getBudgetVisual(0.85);
    expect(result.color).toBe("#FFB84D");
    expect(result.label).toBe("Sắp chạm hạn mức");
  });

  test("returns within-limit style when ratio < 0.8", () => {
    const result = getBudgetVisual(0.5);
    expect(result.color).toBe("#22C55E");
    expect(result.label).toBe("Trong giới hạn");
  });

  test("uses translated label when t function provided", () => {
    const t = jest.fn((key) => {
      const dict = {
        "budgetCard.overBudget": "Over budget",
        "budgetCard.nearLimit": "Near limit",
        "budgetCard.withinLimit": "Within limit",
      };
      return dict[key];
    });
    expect(getBudgetVisual(1, t).label).toBe("Over budget");
    expect(getBudgetVisual(0.85, t).label).toBe("Near limit");
    expect(getBudgetVisual(0.5, t).label).toBe("Within limit");
  });
});

describe("summarizeBudgets", () => {
  const budgets = [
    { amountLimit: 1000000, totalSpent: 500000 },
    { amountLimit: 2000000, totalSpent: 1800000 },
    { amountLimit: 500000, totalSpent: 500000 },
  ];

  test("sums totalLimit and totalSpent", () => {
    const result = summarizeBudgets(budgets);
    expect(result.totalLimit).toBe(3500000);
    expect(result.totalSpent).toBe(2800000);
  });

  test("counts warnings (spent >= 80% of limit)", () => {
    const result = summarizeBudgets(budgets);
    expect(result.warningCount).toBe(2);
  });

  test("handles empty array", () => {
    const result = summarizeBudgets([]);
    expect(result.totalLimit).toBe(0);
    expect(result.totalSpent).toBe(0);
    expect(result.warningCount).toBe(0);
  });
});
