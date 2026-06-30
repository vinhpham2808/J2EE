import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CategoryScreen from "../CategoryScreen";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "finance.category.addSave": "Add Save",
      "finance.category.addSubtitle": "Add Subtitle",
      "finance.category.addTitle": "Add Title",
      "finance.category.editSave": "Edit Save",
      "finance.category.editSubtitle": "Edit Subtitle",
      "finance.category.editTitle": "Edit Title",
      "finance.category.emptyTitle": "Empty Title",
      "finance.category.emptyDescription": "Empty Description",
    }[key] || key),
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: { TEXT: "#000", TEXT_SECONDARY: "#666" },
  useAppColors: () => ({
    BG: "#FFF",
    TEXT: "#000",
    TEXT_SECONDARY: "#666",
    PRIMARY: "#ef5e83",
    CARD: "#EEE",
  }),
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: () => 40,
  getSafeAreaBottom: () => 20,
}));

// Mock subcomponents
jest.mock("../../../components/Categories/CategoryForm", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ form, onSave, onCancel, title }) => (
    <View testID={`category-form-${form.category ? "edit" : "create"}`}>
      <Text>{title}</Text>
      <TouchableOpacity testID={`save-btn-${form.category ? "edit" : "create"}`} onPress={() => onSave(form)} />
      {onCancel && <TouchableOpacity testID="cancel-btn-edit" onPress={onCancel} />}
    </View>
  );
});

jest.mock("../../../components/Categories/CategoryItem", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ item, onEditCategory, onDeleteCategory }) => (
    <View testID={`category-item-${item.id}`}>
      <Text>{item.name}</Text>
      <TouchableOpacity testID={`edit-btn-${item.id}`} onPress={() => onEditCategory(item)} />
      <TouchableOpacity testID={`delete-btn-${item.id}`} onPress={() => onDeleteCategory(item.id)} />
    </View>
  );
});

jest.mock("../../../components/Categories/CategoryListHeader", () => {
  const React = require("react");
  const { View, TouchableOpacity, Text } = require("react-native");
  return ({ canExpand, hasCategories, onToggle, showAll }) => (
    <View testID="category-list-header">
      <Text>{`canExpand: ${canExpand}, showAll: ${showAll}`}</Text>
      {canExpand && (
        <TouchableOpacity testID="toggle-btn" onPress={onToggle}>
          <Text>Toggle</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

jest.mock("../../../components/Categories/IconPickerBottomSheet", () => {
  const React = require("react");
  const { View, TouchableOpacity, Text } = require("react-native");
  return ({ visible, onClose, onSelect, selectedIcon, type }) => (
    visible ? (
      <View testID={`icon-picker-${type}`}>
        <Text>{`selected: ${selectedIcon}`}</Text>
        <TouchableOpacity testID={`close-icon-picker-${type}`} onPress={onClose} />
        <TouchableOpacity testID={`select-icon-${type}`} onPress={() => onSelect("new-icon")} />
      </View>
    ) : null
  );
});

// Mock hook
const mockCreateForm = {
  category: null,
  isIconPickerOpen: false,
  icon: "food",
  type: "expense",
  setIsIconPickerOpen: jest.fn(),
  setIcon: jest.fn(),
};

const mockEditForm = {
  category: null,
  isIconPickerOpen: false,
  icon: "drink",
  type: "income",
  setIsIconPickerOpen: jest.fn(),
  setIcon: jest.fn(),
};

const mockCategoriesHook = {
  categories: [],
  canExpandCategories: false,
  createForm: mockCreateForm,
  editForm: mockEditForm,
  onCloseEditCategory: jest.fn(),
  onDeleteCategory: jest.fn(),
  onOpenEditCategory: jest.fn(),
  onRefresh: jest.fn(),
  onSave: jest.fn(),
  onUpdateCategory: jest.fn(),
  refreshing: false,
  showAllCategories: false,
  toggleCategories: jest.fn(),
  visibleCategories: [],
};

jest.mock("../../../hooks/useCategories", () => () => mockCategoriesHook);

describe("CategoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoriesHook.categories = [];
    mockCategoriesHook.visibleCategories = [];
    mockCategoriesHook.canExpandCategories = false;
    mockCategoriesHook.showAllCategories = false;
    mockCategoriesHook.refreshing = false;
    mockCreateForm.category = null;
    mockCreateForm.isIconPickerOpen = false;
    mockCreateForm.icon = "food";
    mockEditForm.category = null;
    mockEditForm.isIconPickerOpen = false;
    mockEditForm.icon = "drink";
  });

  it("renders empty state when there are no categories", () => {
    const { getByText, queryByTestId } = render(<CategoryScreen />);

    expect(getByText("Empty Title")).toBeTruthy();
    expect(getByText("Empty Description")).toBeTruthy();
    expect(queryByTestId("category-item-1")).toBeNull();
  });

  it("renders list of categories successfully", () => {
    mockCategoriesHook.categories = [
      { id: "1", name: "Food", icon: "food", type: "expense" },
      { id: "2", name: "Drink", icon: "drink", type: "expense" }
    ];
    mockCategoriesHook.visibleCategories = mockCategoriesHook.categories;

    const { getByText, getByTestId, queryByText } = render(<CategoryScreen />);

    expect(queryByText("Empty Title")).toBeNull();
    expect(getByTestId("category-item-1")).toBeTruthy();
    expect(getByTestId("category-item-2")).toBeTruthy();
    expect(getByText("Food")).toBeTruthy();
    expect(getByText("Drink")).toBeTruthy();
  });

  it("calls toggleCategories when expand is possible and toggle button is pressed", () => {
    mockCategoriesHook.canExpandCategories = true;
    const { getByTestId } = render(<CategoryScreen />);

    fireEvent.press(getByTestId("toggle-btn"));
    expect(mockCategoriesHook.toggleCategories).toHaveBeenCalled();
  });

  it("triggers category editing flow", () => {
    mockCategoriesHook.categories = [{ id: "1", name: "Food", icon: "food", type: "expense" }];
    mockCategoriesHook.visibleCategories = mockCategoriesHook.categories;

    const { getByTestId } = render(<CategoryScreen />);

    // Press edit button on item
    fireEvent.press(getByTestId("edit-btn-1"));
    expect(mockCategoriesHook.onOpenEditCategory).toHaveBeenCalledWith(mockCategoriesHook.categories[0]);
  });

  it("shows edit modal when editForm.category is set", () => {
    mockEditForm.category = { id: "1", name: "Food", icon: "food", type: "expense" };

    const { getByTestId } = render(<CategoryScreen />);

    // Edit form should exist
    expect(getByTestId("category-form-edit")).toBeTruthy();

    // Trigger save
    fireEvent.press(getByTestId("save-btn-edit"));
    expect(mockCategoriesHook.onUpdateCategory).toHaveBeenCalledWith(mockEditForm);

    // Trigger cancel
    fireEvent.press(getByTestId("cancel-btn-edit"));
    expect(mockCategoriesHook.onCloseEditCategory).toHaveBeenCalled();
  });

  it("triggers category deletion flow", () => {
    mockCategoriesHook.categories = [{ id: "1", name: "Food", icon: "food", type: "expense" }];
    mockCategoriesHook.visibleCategories = mockCategoriesHook.categories;

    const { getByTestId } = render(<CategoryScreen />);

    fireEvent.press(getByTestId("delete-btn-1"));
    expect(mockCategoriesHook.onDeleteCategory).toHaveBeenCalledWith("1");
  });

  it("opens, closes and selects icon in create form icon picker", () => {
    mockCreateForm.isIconPickerOpen = true;

    const { getByTestId } = render(<CategoryScreen />);

    expect(getByTestId("icon-picker-expense")).toBeTruthy();

    // Close picker
    fireEvent.press(getByTestId("close-icon-picker-expense"));
    expect(mockCreateForm.setIsIconPickerOpen).toHaveBeenCalledWith(false);

    // Select icon
    fireEvent.press(getByTestId("select-icon-expense"));
    expect(mockCreateForm.setIcon).toHaveBeenCalledWith("new-icon");
  });

  it("opens, closes and selects icon in edit form icon picker", () => {
    mockEditForm.isIconPickerOpen = true;

    const { getByTestId } = render(<CategoryScreen />);

    expect(getByTestId("icon-picker-income")).toBeTruthy();

    // Close picker
    fireEvent.press(getByTestId("close-icon-picker-income"));
    expect(mockEditForm.setIsIconPickerOpen).toHaveBeenCalledWith(false);

    // Select icon
    fireEvent.press(getByTestId("select-icon-income"));
    expect(mockEditForm.setIcon).toHaveBeenCalledWith("new-icon");
  });
});
