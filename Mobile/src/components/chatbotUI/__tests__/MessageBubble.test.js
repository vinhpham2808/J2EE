import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import MessageBubble from "../MessageBubble";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "chatbot.editMessage": "Sửa tin nhắn",
        "chatbot.operationSuccess": "thành công",
        "chatbot.undoSuccess": "Hoàn tác",
        "chatbot.undoHint": "Nhấn để hoàn tác",
        "chatbot.retryMessage": "Thử lại",
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

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("../../ui/AppIcon", () => "AppIcon");
jest.mock("../MarkdownContent", () => "MarkdownContent");
jest.mock("../AIConfirmationForm", () => "AIConfirmationForm");
jest.mock("../../../utils/aiIntent", () => ({
  INTENT_ICONS: {
    CREATE_EXPENSE: "💸",
  },
  INTENT_LABELS: {
    CREATE_EXPENSE: "Tạo chi tiêu",
  },
}));
jest.mock("../../../assets/logo&banner/applogo.png", () => "applogo.png");

describe("MessageBubble", () => {
  const defaultProps = {
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    onUndo: jest.fn(),
    onEditMessage: jest.fn(),
    onRetry: jest.fn(),
    isProcessing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders user message and triggers edit button callback", () => {
    const userMsg = {
      sender: "user",
      text: "Xin chào",
      time: "20:00",
    };

    const { getByText, getByLabelText } = render(
      <MessageBubble {...defaultProps} message={userMsg} />
    );

    expect(getByText("Xin chào")).toBeTruthy();
    expect(getByText("20:00")).toBeTruthy();

    const editBtn = getByLabelText("Sửa tin nhắn");
    expect(editBtn).toBeTruthy();

    fireEvent.press(editBtn);
    expect(defaultProps.onEditMessage).toHaveBeenCalledWith(userMsg);
  });

  test("renders standard bot response with avatar and markdown text", () => {
    const botMsg = {
      sender: "bot",
      text: "**Chào bạn**, tôi là Nova.",
      time: "20:01",
      modelLabel: "Nova-V1",
    };

    const { getByText } = render(
      <MessageBubble {...defaultProps} message={botMsg} />
    );

    expect(getByText("20:01")).toBeTruthy();
    expect(getByText("Nova Money · Nova-V1")).toBeTruthy();
  });

  test("renders error bot response and triggers retry callback", () => {
    const errorMsg = {
      sender: "bot",
      text: "Lỗi kết nối",
      time: "20:02",
      isError: true,
    };

    const { getByText, getByLabelText } = render(
      <MessageBubble {...defaultProps} message={errorMsg} />
    );

    expect(getByText("20:02")).toBeTruthy();
    const retryBtn = getByLabelText("Thử lại");
    expect(retryBtn).toBeTruthy();

    fireEvent.press(retryBtn);
    expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
  });

  test("renders AIConfirmationForm when intent is not confirmed", () => {
    const intentMsg = {
      sender: "bot",
      isIntent: true,
      isConfirmation: false,
      intent: "CREATE_EXPENSE",
      extractedFields: { amount: "10000" },
      suggestedValues: { note: "test" },
      confirmationPrompt: "Xác nhận?",
      time: "20:03",
    };

    const { getByText } = render(
      <MessageBubble {...defaultProps} message={intentMsg} />
    );

    expect(getByText("20:03")).toBeTruthy();
  });

  test("renders confirmed success status text when intent is confirmed", () => {
    const confirmedMsg = {
      sender: "bot",
      isIntent: true,
      isConfirmation: true,
      intent: "CREATE_EXPENSE",
      time: "20:04",
    };

    const { getByText } = render(
      <MessageBubble {...defaultProps} message={confirmedMsg} />
    );

    expect(getByText("20:04")).toBeTruthy();
  });

  test("renders undo button and triggers onUndo callback", () => {
    const undoMsg = {
      sender: "bot",
      isUndoAction: true,
      operationId: "op-123",
      text: "Đã tạo giao dịch thành công. Nhấn để hoàn tác",
      time: "20:05",
    };

    const { getByText } = render(
      <MessageBubble {...defaultProps} message={undoMsg} />
    );

    expect(getByText("Đã tạo giao dịch thành công. Nhấn để hoàn tác")).toBeTruthy();
    expect(getByText("20:05")).toBeTruthy();

    const undoBtn = getByText("Hoàn tác");
    expect(undoBtn).toBeTruthy();

    fireEvent.press(undoBtn);
    expect(defaultProps.onUndo).toHaveBeenCalledWith("op-123");
  });
});
