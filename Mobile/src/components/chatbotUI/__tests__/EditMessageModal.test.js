import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import EditMessageModal from "../EditMessageModal";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "chatbot.editMessage": "Sửa tin nhắn",
        "chatbot.editPlaceholder": "Nhập tin nhắn mới...",
        "chatbot.closeEdit": "Đóng sửa",
        "commonComponents.cancel": "Hủy",
      };
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
    WHITE: "#FFFFFF",
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
    WHITE: "#FFFFFF",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
  clampScale: (val) => val,
}));

describe("EditMessageModal", () => {
  const mockMessage = {
    id: "m-123",
    text: "Hôm nay tôi mua gì?",
  };

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    message: mockMessage,
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders text input and title correctly", () => {
    const { getByText, getAllByText, getByPlaceholderText } = render(
      <EditMessageModal {...defaultProps} />
    );

    // Displays both header title and save button text "Sửa tin nhắn"
    expect(getAllByText("Sửa tin nhắn")).toHaveLength(2);
    // Displays the cancel button ("Hủy")
    expect(getByText("Hủy")).toBeTruthy();

    const input = getByPlaceholderText("Nhập tin nhắn mới...");
    expect(input.props.value).toBe("Hôm nay tôi mua gì?");
  });

  test("triggers onSave when save button is pressed with valid text", () => {
    const { getByPlaceholderText, getByLabelText } = render(
      <EditMessageModal {...defaultProps} />
    );

    const input = getByPlaceholderText("Nhập tin nhắn mới...");
    fireEvent.changeText(input, "Hôm nay tôi mua gì thế?");

    const saveBtn = getByLabelText("Lưu chỉnh sửa");
    fireEvent.press(saveBtn);

    expect(defaultProps.onSave).toHaveBeenCalledWith("Hôm nay tôi mua gì thế?", "m-123");
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test("disables save button when text is empty", () => {
    const { getByPlaceholderText, getByLabelText } = render(
      <EditMessageModal {...defaultProps} />
    );

    const input = getByPlaceholderText("Nhập tin nhắn mới...");
    fireEvent.changeText(input, "   "); // whitespace only

    const saveBtn = getByLabelText("Lưu chỉnh sửa");
    expect(saveBtn).toBeDisabled();

    fireEvent.press(saveBtn);
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  test("triggers onClose when cancel button or close cross is clicked", () => {
    const { getByText } = render(<EditMessageModal {...defaultProps} />);

    // Cancel button
    fireEvent.press(getByText("Hủy"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    // Cross close button
    fireEvent.press(getByText("×"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
