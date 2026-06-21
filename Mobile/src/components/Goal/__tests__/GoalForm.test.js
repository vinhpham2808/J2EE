import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import GoalForm from "../GoalForm";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "goalForm.title": "Thiết lập mục tiêu",
        "goalForm.subtitle": "Nhập các thông số cần thiết",
        "goalForm.nameLabel": "Tên mục tiêu",
        "goalForm.namePlaceholder": "Nhập tên mục tiêu...",
        "goalForm.targetLabel": "Số tiền cần đạt",
        "goalForm.targetPlaceholder": "Nhập số tiền...",
        "goalForm.startDate": "Ngày bắt đầu",
        "goalForm.endDate": "Ngày hoàn thành",
        "goalForm.saving": "Đang thiết lập...",
        "goalForm.create": "Tạo mục tiêu",
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
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    BG: "#FFFFFF",
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

describe("GoalForm", () => {
  const defaultProps = {
    name: "Mua xe máy mới",
    targetAmount: "45000000",
    startDate: "2026-06-20",
    targetDate: "2026-12-20",
    loading: false,
    onNameChange: jest.fn(),
    onAmountChange: jest.fn(),
    onStartDateChange: jest.fn(),
    onTargetDateChange: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all input labels and handles change text events", () => {
    const { getByText, getByPlaceholderText, getByLabelText } = render(
      <GoalForm {...defaultProps} />
    );

    expect(getByText("Thiết lập mục tiêu")).toBeTruthy();
    expect(getByText("Nhập các thông số cần thiết")).toBeTruthy();

    const nameInput = getByPlaceholderText("Nhập tên mục tiêu...");
    expect(nameInput.props.value).toBe("Mua xe máy mới");
    fireEvent.changeText(nameInput, "Mua xe máy");
    expect(defaultProps.onNameChange).toHaveBeenCalledWith("Mua xe máy");

    const amountInput = getByPlaceholderText("Nhập số tiền...");
    expect(amountInput.props.value).toBe("45000000");
    fireEvent.changeText(amountInput, "50000000");
    expect(defaultProps.onAmountChange).toHaveBeenCalledWith("50000000");

    // Trigger date picker press
    fireEvent.press(getByLabelText("Ngày bắt đầu"));
    expect(defaultProps.onStartDateChange).toHaveBeenCalledWith("2026-06-21");

    fireEvent.press(getByLabelText("Ngày hoàn thành"));
    expect(defaultProps.onTargetDateChange).toHaveBeenCalledWith("2026-06-21");
  });

  test("submits form when create button is pressed", () => {
    const { getByText } = render(<GoalForm {...defaultProps} />);

    const createBtn = getByText("Tạo mục tiêu");
    fireEvent.press(createBtn);

    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  test("disables save button and displays saving text when loading is true", () => {
    const { getByText, queryByText } = render(
      <GoalForm {...defaultProps} loading={true} />
    );

    expect(getByText("Đang thiết lập...")).toBeTruthy();
    expect(queryByText("Tạo mục tiêu")).toBeNull();

    const saveBtn = getByText("Đang thiết lập...").parent.parent;
    expect(saveBtn).toBeDisabled();

    fireEvent.press(saveBtn);
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });
});
