jest.mock("../../../constants/colors", () => ({
  COLORS: { EXPENSE: "#E76F51", EXPENSE_LIGHT: "#FDE8E3", INCOME: "#2A9D8F", INCOME_LIGHT: "#E8F5F3" },
}));

import { CATEGORY_TYPE_META } from "../categoryTypeMeta";

describe("categoryTypeMeta", () => {
  test("has expense and income keys", () => {
    expect(CATEGORY_TYPE_META).toHaveProperty("expense");
    expect(CATEGORY_TYPE_META).toHaveProperty("income");
  });

  test("expense has correct structure", () => {
    expect(CATEGORY_TYPE_META.expense.label).toBe("Chi tiêu");
    expect(CATEGORY_TYPE_META.expense.chipBg).toBe("#FDE8E3");
    expect(CATEGORY_TYPE_META.expense.chipText).toBe("#E76F51");
  });

  test("income has correct structure", () => {
    expect(CATEGORY_TYPE_META.income.label).toBe("Thu nhập");
    expect(CATEGORY_TYPE_META.income.chipBg).toBe("#E8F5F3");
    expect(CATEGORY_TYPE_META.income.chipText).toBe("#2A9D8F");
  });

  test("does not have unexpected keys", () => {
    const keys = Object.keys(CATEGORY_TYPE_META);
    expect(keys).toEqual(["expense", "income"]);
  });

  test("each entry has all required fields", () => {
    Object.values(CATEGORY_TYPE_META).forEach((entry) => {
      expect(entry).toHaveProperty("label");
      expect(entry).toHaveProperty("chipBg");
      expect(entry).toHaveProperty("chipText");
    });
  });
});
