import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Pressable } from "react-native";
import CategoryForm from "../CategoryForm";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "categoryForm.cancel": "Hủy",
        "categoryForm.saving": "Đang lưu...",
        "categoryForm.nameLabel": "Tên danh mục",
        "categoryForm.namePlaceholder": "Nhập tên danh mục",
        "categoryForm.typeLabel": "Loại danh mục",
        "categoryForm.iconLabel": "Biểu tượng",
        "categoryForm.selectIcon": "Chọn biểu tượng",
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
    PRIMARY_LIGHT: "#ffb2bf",
    ROSE_MIST: "#FFE4EA",
    TEXT_MUTED: "#B8A6AC",
  }),
}));

jest.mock("../../../utils/categoryIcons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CategoryVectorIcon: "CategoryVectorIcon",
    getIconColor: () => "#FF0000",
    getIconLocaleKey: (icon) => `icon.${icon}`,
  };
});

jest.mock("../CategoryTypeSegmentedControl", () => "CategoryTypeSegmentedControl");

describe("CategoryForm", () => {
  const mockForm = {
    name: "Ăn uống",
    type: "expense",
    icon: "food",
    hint: "Dùng cho chi tiêu ăn uống hàng ngày",
    saving: false,
    setName: jest.fn(),
    setType: jest.fn(),
    setIsIconPickerOpen: jest.fn(),
  };

  const mockOnCancel = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    mockForm.setName.mockClear();
    mockForm.setType.mockClear();
    mockForm.setIsIconPickerOpen.mockClear();
    mockOnCancel.mockClear();
    mockOnSave.mockClear();
  });

  test("renders card form correctly with default labels", () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <CategoryForm
        title="Tạo Danh Mục"
        subtitle="Vui lòng nhập thông tin"
        form={mockForm}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        saveLabel="Lưu lại"
      />
    );

    expect(getByText("Tạo Danh Mục")).toBeTruthy();
    expect(getByText("Vui lòng nhập thông tin")).toBeTruthy();
    expect(getByText("Tên danh mục")).toBeTruthy();
    expect(getByText("Loại danh mục")).toBeTruthy();
    expect(getByText("Dùng cho chi tiêu ăn uống hàng ngày")).toBeTruthy();
    expect(getByText("Biểu tượng")).toBeTruthy();
    expect(getByText("Lưu lại")).toBeTruthy();

    // Cancel button should not render in card mode (it's only in modal mode)
    expect(queryByText("Hủy")).toBeNull();
  });

  test("renders modal form cancel button and triggers onCancel", () => {
    const { getByText } = render(
      <CategoryForm
        title="Tạo Danh Mục"
        form={mockForm}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        saveLabel="Lưu"
        variant="modal"
      />
    );

    const cancelBtn = getByText("Hủy");
    expect(cancelBtn).toBeTruthy();

    fireEvent.press(cancelBtn);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test("typing name triggers form.setName", () => {
    const { getByPlaceholderText } = render(
      <CategoryForm
        title="Tạo Danh Mục"
        form={mockForm}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        saveLabel="Lưu"
      />
    );

    const input = getByPlaceholderText("Nhập tên danh mục");
    fireEvent.changeText(input, "Cafe");

    expect(mockForm.setName).toHaveBeenCalledWith("Cafe");
  });

  test("pressing icon trigger opens icon picker", () => {
    const { getByText } = render(
      <CategoryForm
        title="Tạo Danh Mục"
        form={mockForm}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        saveLabel="Lưu"
      />
    );

    // The icon trigger wraps the label text
    const triggerText = getByText("icon.food");
    expect(triggerText).toBeTruthy();

    // Trigger is parent of iconText or we can just press the text
    fireEvent.press(triggerText);
    expect(mockForm.setIsIconPickerOpen).toHaveBeenCalledWith(true);
  });

  test("triggers onSave when save button pressed", () => {
    const { getByText } = render(
      <CategoryForm
        title="Tạo"
        form={mockForm}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        saveLabel="Lưu"
      />
    );

    const saveBtn = getByText("Lưu");
    fireEvent.press(saveBtn);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  test("disables save button and cancel button when saving is true", () => {
    const savingForm = {
      ...mockForm,
      saving: true,
    };

    const { getByText } = render(
      <CategoryForm
        title="Tạo"
        form={savingForm}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        saveLabel="Lưu"
        variant="modal"
      />
    );

    // Should show "Đang lưu..." saving text
    expect(getByText("Đang lưu...")).toBeTruthy();

    // Press save text should not trigger saving since Pressable is disabled
    const saveBtn = getByText("Đang lưu...").parent.parent;
    expect(saveBtn).toBeDisabled();

    fireEvent.press(saveBtn);
    expect(mockOnSave).not.toHaveBeenCalled();

    const cancelBtn = getByText("Hủy").parent.parent;
    expect(cancelBtn).toBeDisabled();

    fireEvent.press(cancelBtn);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });
});
