import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Animated } from "react-native";
import ChatInputBar from "../ChatInputBar";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "chatbot.sendMessage": "Gửi tin nhắn",
        "chatbot.voiceInput": "Nhập giọng nói",
        "chatbot.stopVoiceInput": "Dừng nhập giọng nói",
        "chatbot.stopResponse": "Dừng sinh phản hồi",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
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

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaBottom: (insets, def) => def,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("../../../assets/accessories/mic.png", () => "mic.png");

describe("ChatInputBar", () => {
  const defaultProps = {
    value: "",
    onChangeText: jest.fn(),
    onSend: jest.fn(),
    onStop: jest.fn(),
    placeholder: "Nhập tin nhắn...",
    loading: false,
    disabled: false,
    onMicPress: jest.fn(),
    isRecording: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(Animated, "timing").mockImplementation((value, config) => ({
      start: (callback) => {
        value.setValue(config.toValue);
        if (callback) callback({ finished: true });
      },
      stop: () => {},
    }));

    jest.spyOn(Animated, "loop").mockImplementation((animation) => ({
      start: () => {},
      stop: () => {},
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders placeholder and mic button when empty", () => {
    const { getByPlaceholderText, queryByLabelText, getByLabelText } = render(
      <ChatInputBar {...defaultProps} />
    );

    expect(getByPlaceholderText("Nhập tin nhắn...")).toBeTruthy();
    expect(getByLabelText("Nhập giọng nói")).toBeTruthy();
    expect(queryByLabelText("Gửi tin nhắn")).toBeNull();
    expect(queryByLabelText("Dừng sinh phản hồi")).toBeNull();
  });

  test("triggers onChangeText on typing", () => {
    const { getByPlaceholderText } = render(
      <ChatInputBar {...defaultProps} />
    );

    const input = getByPlaceholderText("Nhập tin nhắn...");
    fireEvent.changeText(input, "Hello Nova");

    expect(defaultProps.onChangeText).toHaveBeenCalledWith("Hello Nova");
  });

  test("renders send button and triggers onSend when input has text", () => {
    const { getByLabelText, queryByLabelText } = render(
      <ChatInputBar {...defaultProps} value="Hello" />
    );

    expect(queryByLabelText("Nhập giọng nói")).toBeNull();
    
    const sendBtn = getByLabelText("Gửi tin nhắn");
    expect(sendBtn).toBeTruthy();

    fireEvent.press(sendBtn);
    expect(defaultProps.onSend).toHaveBeenCalledTimes(1);
  });

  test("renders stop button and triggers onStop when loading is true", () => {
    const { getByLabelText } = render(
      <ChatInputBar {...defaultProps} loading={true} />
    );

    const stopBtn = getByLabelText("Dừng sinh phản hồi");
    expect(stopBtn).toBeTruthy();

    fireEvent.press(stopBtn);
    expect(defaultProps.onStop).toHaveBeenCalledTimes(1);
  });

  test("triggers onMicPress when mic button is pressed", () => {
    const { getByLabelText } = render(
      <ChatInputBar {...defaultProps} value="" />
    );

    const micBtn = getByLabelText("Nhập giọng nói");
    fireEvent.press(micBtn);

    expect(defaultProps.onMicPress).toHaveBeenCalledTimes(1);
  });

  test("renders recording state and pulse anim when isRecording is true", () => {
    const { getByLabelText, queryByLabelText } = render(
      <ChatInputBar {...defaultProps} isRecording={true} />
    );

    expect(queryByLabelText("Nhập giọng nói")).toBeNull();
    const stopRecordingBtn = getByLabelText("Dừng nhập giọng nói");
    expect(stopRecordingBtn).toBeTruthy();

    fireEvent.press(stopRecordingBtn);
    expect(defaultProps.onMicPress).toHaveBeenCalledTimes(1);
  });
});
