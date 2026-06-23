import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Pressable } from "react-native";
import BudgetForm from "../BudgetForm";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "budgetForm.title": "Thiết lập ngân sách",
        "budgetForm.subtitle": "Quản lý chi tiêu danh mục",
        "budgetForm.category": "Danh mục",
        "budgetForm.limit": "Hạn mức chi tiêu",
        "budgetForm.month": "Tháng",
        "budgetForm.year": "Năm",
        "budgetForm.save": "Lưu ngân sách",
        "budgetForm.saving": "Đang lưu...",
        "budgetForm.categoryFallback": "Danh mục trống",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
  }),
}));

jest.mock("../../../utils/categoryIcons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CategoryVectorIcon: "CategoryVectorIcon",
    getIconColor: () => "#FF0000",
  };
});

describe("BudgetForm", () => {
  const mockBudget = {
    categories: [
      { id: 1, name: "Ăn uống", icon: "food" },
      { id: 2, name: "Mua sắm", icon: "shopping" },
    ],
    categoryId: "1",
    amountLimit: "2000000",
    month: "6",
    year: "2026",
    submitting: false,
    setCategoryId: jest.fn(),
    setAmountLimit: jest.fn(),
    setMonth: jest.fn(),
    setYear: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    mockBudget.setCategoryId.mockClear();
    mockBudget.setAmountLimit.mockClear();
    mockBudget.setMonth.mockClear();
    mockBudget.setYear.mockClear();
    mockBudget.onSave.mockClear();
  });

  test("renders form inputs, labels, and prefilled values correctly", () => {
    const { getByText, getByPlaceholderText } = render(
      <BudgetForm budget={mockBudget} />
    );

    expect(getByText("Thiết lập ngân sách")).toBeTruthy();
    expect(getByText("Quản lý chi tiêu danh mục")).toBeTruthy();
    expect(getByText("Danh mục")).toBeTruthy();
    expect(getByText("Hạn mức chi tiêu")).toBeTruthy();
    expect(getByText("Tháng")).toBeTruthy();
    expect(getByText("Năm")).toBeTruthy();

    // Category chips
    expect(getByText("Ăn uống")).toBeTruthy();
    expect(getByText("Mua sắm")).toBeTruthy();

    // Inputs value check
    const limitInput = getByPlaceholderText("budgetForm.limitPlaceholder");
    expect(limitInput.props.value).toBe("2000000");

    const monthInput = getByPlaceholderText("budgetForm.monthPlaceholder");
    expect(monthInput.props.value).toBe("6");

    const yearInput = getByPlaceholderText("budgetForm.yearPlaceholder");
    expect(yearInput.props.value).toBe("2026");

    // Save button
    expect(getByText("Lưu ngân sách")).toBeTruthy();
  });

  test("triggers setCategoryId when a category chip is pressed", () => {
    const { getByText } = render(<BudgetForm budget={mockBudget} />);

    const chipShopping = getByText("Mua sắm");
    fireEvent.press(chipShopping);

    expect(mockBudget.setCategoryId).toHaveBeenCalledWith("2");
  });

  test("triggers setter callbacks on TextInput text change", () => {
    const { getByPlaceholderText } = render(<BudgetForm budget={mockBudget} />);

    const limitInput = getByPlaceholderText("budgetForm.limitPlaceholder");
    fireEvent.changeText(limitInput, "3000000");
    expect(mockBudget.setAmountLimit).toHaveBeenCalledWith("3000000");

    const monthInput = getByPlaceholderText("budgetForm.monthPlaceholder");
    fireEvent.changeText(monthInput, "7");
    expect(mockBudget.setMonth).toHaveBeenCalledWith("7");

    const yearInput = getByPlaceholderText("budgetForm.yearPlaceholder");
    fireEvent.changeText(yearInput, "2027");
    expect(mockBudget.setYear).toHaveBeenCalledWith("2027");
  });

  test("triggers onSave when save button is pressed and submitting is false", () => {
    const { getByText } = render(<BudgetForm budget={mockBudget} />);

    const saveBtn = getByText("Lưu ngân sách");
    fireEvent.press(saveBtn);

    expect(mockBudget.onSave).toHaveBeenCalledTimes(1);
  });

  test("disables save button and displays saving text when submitting is true", () => {
    const submittingBudget = {
      ...mockBudget,
      submitting: true,
    };

    const { getByText } = render(
      <BudgetForm budget={submittingBudget} />
    );

    const savingBtnText = getByText("Đang lưu...");
    expect(savingBtnText).toBeTruthy();

    const saveBtn = savingBtnText.parent.parent;
    expect(saveBtn).toBeDisabled();

    fireEvent.press(saveBtn);
    expect(mockBudget.onSave).not.toHaveBeenCalled();
  });
});
