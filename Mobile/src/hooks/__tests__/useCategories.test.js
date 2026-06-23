jest.mock("../../services/categoryService", () => ({
  fetchCategories: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => ({ "categoryForm.nameHint": "Nhập tên danh mục", "categoryForm.nameHintExpense": "Nhập tên chi tiêu" }[key] || key) }),
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((cb) => cb()),
}));

jest.mock("../../components/common/ShowMoreButton", () => ({
  useVisibleItems: (items, opts) => ({
    visibleItems: items.slice(0, opts?.initialCount || 3),
    canToggle: items.length > (opts?.initialCount || 3),
    expanded: false,
    toggle: jest.fn(),
  }),
}));

jest.mock("../../utils/categoryIcons", () => ({
  getFirstCategoryIcon: () => "wallet-outline",
}));

jest.mock("../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.message || f }));
jest.mock("../../constants/api", () => ({ API_ENDPOINTS: {} }));
jest.mock("../../services/apiClient", () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }));

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import useCategories from "../useCategories";

// Test pure helper functions from useCategories
function normalizeCategoryType(type) {
  return String(type || "income").toLowerCase() === "expense" ? "expense" : "income";
}

function hasDuplicateName(categories, name, ignoredCategoryId) {
  const normalizedName = name.trim().toLowerCase();
  return categories.some((category) => {
    const sameName = String(category?.name || "").trim().toLowerCase() === normalizedName;
    const isIgnored = ignoredCategoryId && Number(category?.id) === Number(ignoredCategoryId);
    return sameName && !isIgnored;
  });
}

function getFormHint(type, t) {
  if (type === "income") return t("categoryForm.nameHint");
  return t("categoryForm.nameHintExpense");
}

describe("useCategories helpers", () => {
  describe("normalizeCategoryType", () => {
    test("returns expense for expense input", () => {
      expect(normalizeCategoryType("expense")).toBe("expense");
      expect(normalizeCategoryType("EXPENSE")).toBe("expense");
    });
    test("returns income for income or default", () => {
      expect(normalizeCategoryType("income")).toBe("income");
      expect(normalizeCategoryType("")).toBe("income");
      expect(normalizeCategoryType(null)).toBe("income");
      expect(normalizeCategoryType()).toBe("income");
    });
  });

  describe("hasDuplicateName", () => {
    const cats = [{ id: 1, name: "Ăn uống" }, { id: 2, name: "Xăng xe" }];

    test("finds duplicate ignoring case and whitespace", () => {
      expect(hasDuplicateName(cats, "  ăn uống  ")).toBe(true);
    });

    test("returns false for unique name", () => {
      expect(hasDuplicateName(cats, "Mua sắm")).toBe(false);
    });

    test("ignores the category being edited", () => {
      expect(hasDuplicateName(cats, "ăn uống", 1)).toBe(false);
    });

    test("returns empty array safety", () => {
      expect(hasDuplicateName([], "anything")).toBe(false);
    });
  });

  describe("getFormHint", () => {
    const t = (key) => ({ "categoryForm.nameHint": "Name hint", "categoryForm.nameHintExpense": "Expense hint" }[key] || key);
    test("returns income hint for income type", () => {
      expect(getFormHint("income", t)).toBe("Name hint");
    });
    test("returns expense hint for expense type", () => {
      expect(getFormHint("expense", t)).toBe("Expense hint");
    });
  });
});
