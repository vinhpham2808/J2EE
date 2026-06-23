import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import AIConfirmationForm from "../AIConfirmationForm";
import { fetchCategoriesByType } from "../../../services/categoryService";
import { getFieldsForIntent } from "../../../utils/aiIntent";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "chat.missingInfo": "Thiếu thông tin",
        "chat.loadingCategory": "Đang tải...",
        "chat.selectCategory": "Chọn danh mục",
        "contributionModal.confirm": "Xác nhận",
        "commonComponents.cancel": "Hủy",
      };
      if (key === "chat.missingField") {
        return `Vui lòng nhập ${options?.label}`;
      }
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    ROSE_MIST: "#FFE4EA",
    INCOME: "#4CDAD9",
  },
  useAppColors: () => ({
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    ROSE_MIST: "#FFE4EA",
    INCOME: "#4CDAD9",
  }),
}));

jest.mock("../../../utils/aiIntent", () => ({
  getFieldsForIntent: jest.fn(),
  INTENT_ICONS: {
    CREATE_EXPENSE: "💸",
  },
  INTENT_LABELS: {
    CREATE_EXPENSE: "Tạo chi tiêu",
  },
}));

jest.mock("../../../services/categoryService", () => ({
  fetchCategoriesByType: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("AIConfirmationForm", () => {
  const defaultProps = {
    intent: "CREATE_EXPENSE",
    extractedFields: { amount: "50000" },
    suggestedValues: { note: "Ăn trưa" },
    confirmationPrompt: "Xác nhận tạo giao dịch này?",
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    isProcessing: false,
  };

  const mockFields = [
    { key: "amount", label: "Số tiền", type: "number", required: true },
    { key: "categoryName", label: "Danh mục", type: "category_select", categoryType: "expense", required: true },
    { key: "note", label: "Ghi chú", type: "text", required: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getFieldsForIntent.mockReturnValue(mockFields);
    fetchCategoriesByType.mockResolvedValue([
      { id: 1, name: "Ăn uống", icon: "🍔" },
      { id: 2, name: "Mua sắm", icon: "🛍️" },
    ]);
  });

  test("renders header details, prompt, and input fields", async () => {
    const { getByText, getByPlaceholderText, findByText } = render(
      <AIConfirmationForm {...defaultProps} />
    );

    // wait for loading categories to settle
    await findByText("Chọn danh mục");

    expect(getByText("💸")).toBeTruthy();
    expect(getByText("Tạo chi tiêu")).toBeTruthy();
    expect(getByText("Xác nhận tạo giao dịch này?")).toBeTruthy();

    expect(getByPlaceholderText("Số tiền")).toBeTruthy();
    expect(getByPlaceholderText("Ghi chú")).toBeTruthy();
  });

  test("populates initial field values correctly", async () => {
    const { getByPlaceholderText, findByText } = render(
      <AIConfirmationForm {...defaultProps} />
    );

    await findByText("Chọn danh mục");

    expect(getByPlaceholderText("Số tiền").props.value).toBe("50000");
    expect(getByPlaceholderText("Ghi chú").props.value).toBe("Ăn trưa");
  });

  test("changes field text values correctly", async () => {
    const { getByPlaceholderText, findByText } = render(
      <AIConfirmationForm {...defaultProps} />
    );

    await findByText("Chọn danh mục");

    const amountInput = getByPlaceholderText("Số tiền");
    fireEvent.changeText(amountInput, "60000");
    expect(amountInput.props.value).toBe("60000");
  });

  test("opens CategorySelectionModal and selects a category", async () => {
    const { getByText, findByText } = render(
      <AIConfirmationForm {...defaultProps} />
    );

    await findByText("Chọn danh mục");

    // Press Category Select Button
    const categoryBtn = getByText("Chọn danh mục");
    fireEvent.press(categoryBtn);

    // The modal should display "Ăn uống"
    const categoryOption = await findByText("Ăn uống");
    expect(categoryOption).toBeTruthy();

    // Select the category
    fireEvent.press(categoryOption);

    // The button should now display the selected category name
    expect(getByText("Ăn uống")).toBeTruthy();
  });

  test("validates required fields on submit", async () => {
    const { getByText, findByText } = render(
      <AIConfirmationForm
        {...defaultProps}
        extractedFields={{ amount: "" }} // Amount is empty and required
      />
    );

    await findByText("Chọn danh mục");

    const confirmBtn = getByText("✓ Xác nhận");
    fireEvent.press(confirmBtn);

    expect(Alert.alert).toHaveBeenCalledWith("Thiếu thông tin", "Vui lòng nhập Số tiền");
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  test("triggers onConfirm with merged fields on successful submit", async () => {
    const { getByText, findByText } = render(
      <AIConfirmationForm {...defaultProps} />
    );

    await findByText("Chọn danh mục");

    // Select category first because it's required
    const categoryBtn = getByText("Chọn danh mục");
    fireEvent.press(categoryBtn);

    const categoryOption = await findByText("Ăn uống");
    fireEvent.press(categoryOption);

    const confirmBtn = getByText("✓ Xác nhận");
    fireEvent.press(confirmBtn);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith("CREATE_EXPENSE", {
      amount: "50000",
      note: "Ăn trưa",
      categoryName: "Ăn uống",
    });
  });

  test("triggers onCancel when cancel button is clicked", async () => {
    const { getByText, findByText } = render(
      <AIConfirmationForm {...defaultProps} />
    );

    await findByText("Chọn danh mục");

    const cancelBtn = getByText("✕ Hủy");
    fireEvent.press(cancelBtn);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test("disables interactions when isProcessing is true", async () => {
    const { getByPlaceholderText, findByText, queryByText } = render(
      <AIConfirmationForm {...defaultProps} isProcessing={true} />
    );

    // Wait for the form to settle
    await waitFor(() => {
      expect(getByPlaceholderText("Số tiền").props.editable).toBe(false);
    });

    expect(getByPlaceholderText("Ghi chú").props.editable).toBe(false);

    // Confirm button shows activity indicator instead of text
    expect(queryByText("✓ Xác nhận")).toBeNull();
  });
});
