import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ContributionModal from "../ContributionModal";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "contributionModal.title": "Thêm tiền tích lũy",
        "contributionModal.amount": "Số tiền",
        "contributionModal.amountPlaceholder": "Nhập số tiền...",
        "contributionModal.date": "Ngày đóng góp",
        "contributionModal.note": "Ghi chú",
        "contributionModal.notePlaceholder": "Nhập ghi chú...",
        "contributionModal.cancel": "Hủy",
        "contributionModal.confirm": "Xác nhận",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CARD: "#FFFFFF",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    BG: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    BG: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT_MUTED: "#B8A6AC",
    PRIMARY: "#EF5E83",
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatCurrencyInput: (val) => val,
}));

jest.mock("../../../utils/datePicker", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    PickDateField: ({ label, value, onChange }) => (
      <Pressable onPress={() => onChange("2026-06-21")} accessibilityLabel={label}>
        <Text>{label}: {value}</Text>
      </Pressable>
    ),
  };
});

describe("ContributionModal", () => {
  const goal = { id: "g-1", name: "Mua xe máy" };
  const defaultProps = {
    visible: true,
    goal,
    amount: "500000",
    date: "2026-06-20",
    note: "Tích lũy tháng 6",
    onAmountChange: jest.fn(),
    onDateChange: jest.fn(),
    onNoteChange: jest.fn(),
    onClose: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns null if goal is not provided", () => {
    const { toJSON } = render(
      <ContributionModal {...defaultProps} goal={null} />
    );
    expect(toJSON()).toBeNull();
  });

  test("renders fields with initial values and handles text input changes", () => {
    const { getByText, getByPlaceholderText, getByLabelText } = render(
      <ContributionModal {...defaultProps} />
    );

    expect(getByText("Thêm tiền tích lũy")).toBeTruthy();
    expect(getByText("Mua xe máy")).toBeTruthy();

    const amountInput = getByPlaceholderText("Nhập số tiền...");
    expect(amountInput.props.value).toBe("500000");
    fireEvent.changeText(amountInput, "600000");
    expect(defaultProps.onAmountChange).toHaveBeenCalledWith("600000");

    const noteInput = getByPlaceholderText("Nhập ghi chú...");
    expect(noteInput.props.value).toBe("Tích lũy tháng 6");
    fireEvent.changeText(noteInput, "Tích lũy thêm");
    expect(defaultProps.onNoteChange).toHaveBeenCalledWith("Tích lũy thêm");

    // Trigger date picker press
    const dateBtn = getByLabelText("Ngày đóng góp");
    fireEvent.press(dateBtn);
    expect(defaultProps.onDateChange).toHaveBeenCalledWith("2026-06-21");
  });

  test("calls onClose and onSubmit on buttons click", () => {
    const { getByText } = render(<ContributionModal {...defaultProps} />);

    fireEvent.press(getByText("Hủy"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText("Xác nhận"));
    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });
});
