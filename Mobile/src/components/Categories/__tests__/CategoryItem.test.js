import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { View, Pressable } from "react-native";
import CategoryItem from "../CategoryItem";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "categoryForm.unnamed": "Chưa đặt tên",
        "categoryForm.edit": "Sửa",
        "categoryForm.delete": "Xóa",
        "categoryTypeMeta.income": "Thu nhập",
        "categoryTypeMeta.expense": "Chi tiêu",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    EXPENSE_LIGHT: "#FDE8E3",
    EXPENSE: "#E76F51",
    INCOME_LIGHT: "#E8F5F3",
    INCOME: "#2A9D8F",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    SHADOW_COLOR: "#000000",
    BG: "#FFFFFF",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    EXPENSE: "#EF4444",
  }),
}));

jest.mock("../../../utils/categoryIcons", () => ({
  getIconColor: () => "#FF0000",
}));

jest.mock("../../../utils/format", () => ({
  formatDate: (val) => String(val),
}));

jest.mock("../../ui/AppIcon", () => "AppIcon");
jest.mock("../../ui/TransactionIcon", () => "TransactionIcon");

describe("CategoryItem", () => {
  const mockItem = {
    id: "cat-1",
    name: "Ăn trưa",
    icon: "food",
    type: "expense",
    createdAt: "2026-06-20T10:00:00Z",
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
    
    // Mock measureInWindow on View prototype to allow layout anchoring
    jest.spyOn(View.prototype, "measureInWindow").mockImplementation((cb) => {
      cb(100, 200, 50, 50); // x, y, width, height
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders item name, type chip and timestamp correctly", () => {
    const { getByText } = render(
      <CategoryItem
        item={mockItem}
        onEditCategory={mockOnEdit}
        onDeleteCategory={mockOnDelete}
      />
    );

    expect(getByText("Ăn trưa")).toBeTruthy();
    expect(getByText("Chi tiêu")).toBeTruthy();
  });

  test("opens dropdown menu when dots pressed and triggers edit/delete callbacks", () => {
    const { getByText, UNSAFE_queryAllByType } = render(
      <CategoryItem
        item={mockItem}
        onEditCategory={mockOnEdit}
        onDeleteCategory={mockOnDelete}
      />
    );

    // The dots button is a Pressable containing "⋮"
    const dotsBtn = getByText("⋮");
    fireEvent.press(dotsBtn);

    // Verify modal and options are visible
    expect(getByText("Sửa")).toBeTruthy();
    expect(getByText("Xóa")).toBeTruthy();

    // Click Edit
    fireEvent.press(getByText("Sửa"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockItem);

    // Re-open menu to test delete
    fireEvent.press(dotsBtn);
    fireEvent.press(getByText("Xóa"));
    expect(mockOnDelete).toHaveBeenCalledWith(mockItem);
  });
});
