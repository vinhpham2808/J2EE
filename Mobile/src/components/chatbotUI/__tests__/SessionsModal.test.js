import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import SessionsModal from "../SessionsModal";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "chat.sessionDefaultTitle": "Cuộc hội thoại mới",
        "chat.sessionHistory": "Lịch sử chat",
        "chat.newChat": "Đoạn chat mới",
        "chat.noHistory": "Không có lịch sử",
        "chat.sessionsPlaceholder": "Nhập tên...",
        "chat.missingInfo": "Thiếu thông tin",
        "chat.emptyName": "Tên không được trống",
        "chat.deleteTitle": "Xóa cuộc hội thoại",
        "chat.deleteMessage": `Xóa cuộc hội thoại ${options?.title}?`,
        "chat.cancel": "Hủy",
        "chat.confirmDelete": "Xóa",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
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
    EXPENSE: "#FF0000",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
  clampScale: (val) => val,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// Mock Alert
jest.spyOn(Alert, "alert").mockImplementation((title, msg, buttons) => {
  if (buttons && buttons[1] && buttons[1].onPress) {
    buttons[1].onPress();
  }
});

describe("SessionsModal", () => {
  const sessions = [
    { id: "s-1", title: "Giao dịch ăn uống" },
    { id: "s-2", title: "Dự báo chi tiêu" },
  ];

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    sessions,
    activeSessionId: "s-1",
    onSelectSession: jest.fn(),
    onDeleteSession: jest.fn(),
    onRenameSession: jest.fn(),
    onNewChat: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders sessions list correctly", () => {
    const { getByText } = render(<SessionsModal {...defaultProps} />);

    expect(getByText("Lịch sử chat")).toBeTruthy();
    expect(getByText("Đoạn chat mới")).toBeTruthy();
    expect(getByText("Giao dịch ăn uống")).toBeTruthy();
    expect(getByText("Dự báo chi tiêu")).toBeTruthy();
  });

  test("renders empty placeholder when no sessions exist", () => {
    const { getByText } = render(
      <SessionsModal {...defaultProps} sessions={[]} />
    );

    expect(getByText("Không có lịch sử")).toBeTruthy();
  });

  test("calls onSelectSession and onClose when a session item is pressed", () => {
    const { getByText } = render(<SessionsModal {...defaultProps} />);

    fireEvent.press(getByText("Dự báo chi tiêu"));

    expect(defaultProps.onSelectSession).toHaveBeenCalledWith("s-2");
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test("calls onNewChat and onClose when New Chat button is pressed", () => {
    const { getByText } = render(<SessionsModal {...defaultProps} />);

    fireEvent.press(getByText("Đoạn chat mới"));

    expect(defaultProps.onNewChat).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test("triggers delete alert and calls onDeleteSession", () => {
    const { getByLabelText } = render(<SessionsModal {...defaultProps} />);

    const deleteBtn = getByLabelText("Xóa Giao dịch ăn uống");
    fireEvent.press(deleteBtn);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Xóa cuộc hội thoại",
      "Xóa cuộc hội thoại Giao dịch ăn uống?",
      expect.any(Array)
    );
    expect(defaultProps.onDeleteSession).toHaveBeenCalledWith("s-1");
  });

  test("enters rename mode, typing, and submitting calling onRenameSession", () => {
    const { getByLabelText, getByPlaceholderText } = render(
      <SessionsModal {...defaultProps} />
    );

    const renameBtn = getByLabelText("Đổi tên Giao dịch ăn uống");
    fireEvent.press(renameBtn);

    // Should display rename input
    const input = getByPlaceholderText("Nhập tên...");
    expect(input.props.value).toBe("Giao dịch ăn uống");

    fireEvent.changeText(input, "Giao dịch trưa");

    const confirmBtn = getByLabelText("Xác nhận đổi tên");
    fireEvent.press(confirmBtn);

    expect(defaultProps.onRenameSession).toHaveBeenCalledWith("s-1", "Giao dịch trưa");
  });

  test("enters rename mode and cancels it", () => {
    const { getByLabelText, getByPlaceholderText, queryByPlaceholderText } = render(
      <SessionsModal {...defaultProps} />
    );

    const renameBtn = getByLabelText("Đổi tên Giao dịch ăn uống");
    fireEvent.press(renameBtn);

    expect(getByPlaceholderText("Nhập tên...")).toBeTruthy();

    const cancelBtn = getByLabelText("Hủy đổi tên");
    fireEvent.press(cancelBtn);

    expect(queryByPlaceholderText("Nhập tên...")).toBeNull();
    expect(defaultProps.onRenameSession).not.toHaveBeenCalled();
  });
});
