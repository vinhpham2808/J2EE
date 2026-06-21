import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Pressable } from "react-native";
import ChatScreen from "../ChatScreen";
import useModelConfig from "../../../components/chatbotUI/useModelConfig";
import useChatMessages from "../../../components/chatbotUI/useChatMessages";
import useVoiceInput from "../../../components/chatbotUI/useVoiceInput";

// 1. Mock translation and colors
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CHAT_BG: "#FFFFFF",
    CHAT_BUBBLE: "#F0F0F0",
    CHAT_BORDER: "#E0E0E0",
  },
  useAppColors: () => ({
    CHAT_BG: "#FFFFFF",
    CHAT_BUBBLE: "#F0F0F0",
    CHAT_BORDER: "#E0E0E0",
    PRIMARY: "#000000",
    CHAT_MUTED: "#888888",
    SURFACE: "#FFFFFF",
    TEXT: "#000000",
    TEXT_SECONDARY: "#555555",
    ACTION_VOICE: "#A855F7",
  }),
}));

// 2. Mock all hooks relative to __tests__
jest.mock("../../../components/chatbotUI/useModelConfig");
jest.mock("../../../components/chatbotUI/useChatMessages");
jest.mock("../../../components/chatbotUI/useVoiceInput");

// 3. Mock all subcomponents relative to __tests__
jest.mock("../../../components/chatbotUI/ChatAssistantHeader", () => {
  const React = require("react");
  const { View, Button } = require("react-native");
  return jest.fn((props) => (
    <View testID="ChatAssistantHeader" {...props}>
      <Button title="Open Sessions" onPress={props.onOpenSessions} testID="OpenSessionsBtn" />
      <Button title="Change Mode" onPress={() => props.onChangeMode("new-mode")} testID="ChangeModeBtn" />
    </View>
  ));
});

jest.mock("../../../components/chatbotUI/MessageBubble", () => {
  const React = require("react");
  const { View, Button, Text } = require("react-native");
  return jest.fn((props) => (
    <View testID={`MessageBubble-${props.message.id}`} {...props}>
      <Text>{props.message.text}</Text>
      <Button title="Confirm" onPress={props.onConfirm} testID={`ConfirmBtn-${props.message.id}`} />
      <Button title="Cancel" onPress={props.onCancel} testID={`CancelBtn-${props.message.id}`} />
      <Button title="Undo" onPress={props.onUndo} testID={`UndoBtn-${props.message.id}`} />
      <Button title="Edit" onPress={() => props.onEditMessage(props.message)} testID={`EditBtn-${props.message.id}`} />
      <Button title="Retry" onPress={props.onRetry} testID={`RetryBtn-${props.message.id}`} />
    </View>
  ));
});

jest.mock("../../../components/chatbotUI/QuickPromptChips", () => {
  const React = require("react");
  const { View, Button } = require("react-native");
  return jest.fn((props) => (
    <View testID="QuickPromptChips" {...props}>
      <Button title="Select Quick Prompt" onPress={() => props.onSelect({ text: "Hello AI" })} testID="QuickPromptBtn" />
    </View>
  ));
});

jest.mock("../../../components/chatbotUI/ChatInputBar", () => {
  const React = require("react");
  const { View, Button, TextInput } = require("react-native");
  return jest.fn((props) => (
    <View testID="ChatInputBar" {...props}>
      <TextInput testID="ChatInput" value={props.value} onChangeText={props.onChangeText} />
      <Button title="Send" onPress={props.onSend} testID="SendBtn" />
      <Button title="Stop" onPress={props.onStop} testID="StopBtn" />
      <Button title="Mic" onPress={props.onMicPress} testID="MicBtn" />
    </View>
  ));
});

jest.mock("../../../components/chatbotUI/SessionsModal", () => {
  const React = require("react");
  const { View, Button } = require("react-native");
  return jest.fn((props) => {
    if (!props.visible) return null;
    return (
      <View testID="SessionsModal" {...props}>
        <Button title="Close Sessions" onPress={props.onClose} testID="CloseSessionsBtn" />
        <Button title="Select Session" onPress={() => props.onSelectSession("sess-1")} testID="SelectSessionBtn" />
        <Button title="Delete Session" onPress={() => props.onDeleteSession("sess-1")} testID="DeleteSessionBtn" />
        <Button title="Rename Session" onPress={() => props.onRenameSession("sess-1", "New Name")} testID="RenameSessionBtn" />
        <Button title="New Chat" onPress={props.onNewChat} testID="NewChatBtn" />
      </View>
    );
  });
});

jest.mock("../../../components/chatbotUI/EditMessageModal", () => {
  const React = require("react");
  const { View, Button } = require("react-native");
  return jest.fn((props) => {
    if (!props.visible) return null;
    return (
      <View testID="EditMessageModal" {...props}>
        <Button title="Close Edit" onPress={props.onClose} testID="CloseEditBtn" />
        <Button title="Save Edit" onPress={() => props.onSave("Edited text", props.message?.id)} testID="SaveEditBtn" />
      </View>
    );
  });
});

jest.mock("../../../components/ui/AppIcon", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return jest.fn((props) => (
    <View testID={`Icon-${props.name}`}>
      <Text>{props.name}</Text>
    </View>
  ));
});

describe("ChatScreen", () => {
  const mockHandleModeSwitch = jest.fn();
  const mockSendMessage = jest.fn();
  const mockRetryLastMessage = jest.fn();
  const mockStopGenerating = jest.fn();
  const mockSelectSession = jest.fn();
  const mockDeleteSession = jest.fn();
  const mockRenameSession = jest.fn();
  const mockStartNewChat = jest.fn();
  const mockHandleConfirmAction = jest.fn();
  const mockHandleCancelConfirmation = jest.fn();
  const mockHandleUndo = jest.fn();
  const mockHandleMicPress = jest.fn();

  const mockScrollToEnd = jest.fn();
  const mockFlatListRef = { current: { scrollToEnd: mockScrollToEnd } };

  let voiceInputOptions = null;

  beforeEach(() => {
    jest.clearAllMocks();

    useModelConfig.mockReturnValue({
      activeMode: "chat",
      activeProvider: "gemini",
      activeModel: "gemini-pro",
      activeModelLabel: "Gemini Pro",
      modelLabel: "Gemini Pro",
      inputPlaceholder: "Ask Gemini...",
      isFreePlan: true,
      handleModeSwitch: mockHandleModeSwitch,
    });

    useChatMessages.mockReturnValue({
      messages: [],
      sessions: [],
      activeSessionId: "session-1",
      loading: false,
      chatBusy: false,
      hasUserStartedChat: false,
      isProcessingCrud: false,
      flatListRef: mockFlatListRef,
      sendMessage: mockSendMessage,
      retryLastMessage: mockRetryLastMessage,
      stopGenerating: mockStopGenerating,
      selectSession: mockSelectSession,
      deleteSession: mockDeleteSession,
      renameSession: mockRenameSession,
      startNewChat: mockStartNewChat,
      handleConfirmAction: mockHandleConfirmAction,
      handleCancelConfirmation: mockHandleCancelConfirmation,
      handleUndo: mockHandleUndo,
    });

    useVoiceInput.mockImplementation((options) => {
      voiceInputOptions = options;
      return {
        isRecording: false,
        handleMicPress: mockHandleMicPress,
      };
    });
  });

  test("renders screen under default state correctly", () => {
    const { getByTestId, queryByTestId, queryByText } = render(<ChatScreen />);

    expect(getByTestId("ChatAssistantHeader")).toBeTruthy();
    expect(getByTestId("ChatInputBar")).toBeTruthy();
    expect(getByTestId("QuickPromptChips")).toBeTruthy(); // because hasUserStartedChat=false, chatBusy=false

    // Check loading indicator is not shown
    expect(queryByText("chat.thinking")).toBeNull();
  });

  test("renders loading state correctly", () => {
    useChatMessages.mockReturnValueOnce({
      messages: [],
      sessions: [],
      activeSessionId: "session-1",
      loading: true,
      chatBusy: false,
      hasUserStartedChat: false,
      isProcessingCrud: false,
      flatListRef: mockFlatListRef,
      sendMessage: mockSendMessage,
      retryLastMessage: mockRetryLastMessage,
      stopGenerating: mockStopGenerating,
      selectSession: mockSelectSession,
      deleteSession: mockDeleteSession,
      renameSession: mockRenameSession,
      startNewChat: mockStartNewChat,
      handleConfirmAction: mockHandleConfirmAction,
      handleCancelConfirmation: mockHandleCancelConfirmation,
      handleUndo: mockHandleUndo,
    });

    const { getByText } = render(<ChatScreen />);
    expect(getByText("chat.thinking")).toBeTruthy();
  });

  test("hides QuickPromptChips when hasUserStartedChat is true or chatBusy is true", () => {
    useChatMessages.mockReturnValueOnce({
      messages: [],
      sessions: [],
      activeSessionId: "session-1",
      loading: false,
      chatBusy: false,
      hasUserStartedChat: true,
      isProcessingCrud: false,
      flatListRef: mockFlatListRef,
      sendMessage: mockSendMessage,
      retryLastMessage: mockRetryLastMessage,
      stopGenerating: mockStopGenerating,
      selectSession: mockSelectSession,
      deleteSession: mockDeleteSession,
      renameSession: mockRenameSession,
      startNewChat: mockStartNewChat,
      handleConfirmAction: mockHandleConfirmAction,
      handleCancelConfirmation: mockHandleCancelConfirmation,
      handleUndo: mockHandleUndo,
    });

    const { queryByTestId } = render(<ChatScreen />);
    expect(queryByTestId("QuickPromptChips")).toBeNull();
  });

  test("triggers model mode switch correctly", () => {
    const { getByTestId } = render(<ChatScreen />);
    fireEvent.press(getByTestId("ChangeModeBtn"));
    expect(mockHandleModeSwitch).toHaveBeenCalledWith("new-mode");
  });

  test("triggers quick prompt selection and sends message", () => {
    const { getByTestId } = render(<ChatScreen />);
    fireEvent.press(getByTestId("QuickPromptBtn"));
    expect(mockSendMessage).toHaveBeenCalledWith("Hello AI");
  });

  test("handles chat input typing and send action", () => {
    const { getByTestId } = render(<ChatScreen />);
    const input = getByTestId("ChatInput");

    // Type message
    act(() => {
      fireEvent.changeText(input, "Hello World");
    });
    expect(input.props.value).toBe("Hello World");

    // Press Send
    fireEvent.press(getByTestId("SendBtn"));
    expect(mockSendMessage).toHaveBeenCalledWith("Hello World");

    // Input should be cleared
    expect(input.props.value).toBe("");
  });

  test("does not send message if input is empty or whitespace", () => {
    const { getByTestId } = render(<ChatScreen />);
    const input = getByTestId("ChatInput");

    // Type empty space
    act(() => {
      fireEvent.changeText(input, "   ");
    });
    fireEvent.press(getByTestId("SendBtn"));
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  test("stops generating message on stop button press", () => {
    const { getByTestId } = render(<ChatScreen />);
    fireEvent.press(getByTestId("StopBtn"));
    expect(mockStopGenerating).toHaveBeenCalled();
  });

  test("voice input callback updates input text correctly (first, prepend, non-starts-with)", () => {
    const { getByTestId } = render(<ChatScreen />);
    const input = getByTestId("ChatInput");

    expect(input.props.value).toBe("");

    // 1. Initial voice result
    act(() => {
      voiceInputOptions.onResult("hello");
    });
    expect(input.props.value).toBe("hello");

    // 2. Continuous voice result that starts with the current text
    act(() => {
      voiceInputOptions.onResult("hello world");
    });
    expect(input.props.value).toBe("hello world");

    // 3. Unrelated voice result (does not start with current)
    act(() => {
      voiceInputOptions.onResult("how are you");
    });
    expect(input.props.value).toBe("hello world how are you");
  });

  test("renders custom microphone recording modal and triggers mic control buttons", () => {
    // Override useVoiceInput to return isRecording = true
    useVoiceInput.mockImplementationOnce((options) => {
      voiceInputOptions = options;
      return {
        isRecording: true,
        handleMicPress: mockHandleMicPress,
      };
    });

    const { getByText, getByTestId, UNSAFE_getAllByType } = render(<ChatScreen />);

    // Verify modal text content
    expect(getByText("chat.voiceTitle")).toBeTruthy();
    expect(getByText("chat.voiceDisclaimer")).toBeTruthy();
    expect(getByText("chat.voiceHint")).toBeTruthy();

    // Verify AppIcon (close icon)
    expect(getByTestId("Icon-close")).toBeTruthy();

    // Press close icon to close mic
    fireEvent.press(getByTestId("Icon-close"));
    expect(mockHandleMicPress).toHaveBeenCalledTimes(1);

    // Click mic button in footer to stop/start recording
    const pressables = UNSAFE_getAllByType(Pressable);
    // Close button (first) and mic button (second)
    // Close button style contains voiceCloseBtn, mic button contains voiceMicButton
    const footerMicBtn = pressables.find(p => {
      const flatStyle = p.props.style ? Object.assign({}, ...[p.props.style].flat()) : {};
      return flatStyle.width === 64; // styles.voiceMicButton has width: 64
    });

    expect(footerMicBtn).toBeTruthy();
    fireEvent.press(footerMicBtn);
    expect(mockHandleMicPress).toHaveBeenCalledTimes(2);
  });

  test("sessions modal interaction triggers corresponding callbacks", () => {
    const { getByTestId, queryByTestId } = render(<ChatScreen />);

    // Sessions modal is initially hidden
    expect(queryByTestId("SessionsModal")).toBeNull();

    // Open sessions modal
    fireEvent.press(getByTestId("OpenSessionsBtn"));
    expect(getByTestId("SessionsModal")).toBeTruthy();

    // Select session
    fireEvent.press(getByTestId("SelectSessionBtn"));
    expect(mockSelectSession).toHaveBeenCalledWith("sess-1");

    // Delete session
    fireEvent.press(getByTestId("DeleteSessionBtn"));
    expect(mockDeleteSession).toHaveBeenCalledWith("sess-1");

    // Rename session
    fireEvent.press(getByTestId("RenameSessionBtn"));
    expect(mockRenameSession).toHaveBeenCalledWith("sess-1", "New Name");

    // New chat session
    fireEvent.press(getByTestId("NewChatBtn"));
    expect(mockStartNewChat).toHaveBeenCalled();

    // Close sessions modal
    fireEvent.press(getByTestId("CloseSessionsBtn"));
    expect(queryByTestId("SessionsModal")).toBeNull();
  });

  test("message bubble triggers edit message modal flow and updates messages", () => {
    const mockMessages = [
      { id: "msg-123", text: "This is a user message", sender: "user" }
    ];

    useChatMessages.mockReturnValue({
      messages: mockMessages,
      sessions: [],
      activeSessionId: "session-1",
      loading: false,
      chatBusy: false,
      hasUserStartedChat: true,
      isProcessingCrud: false,
      flatListRef: mockFlatListRef,
      sendMessage: mockSendMessage,
      retryLastMessage: mockRetryLastMessage,
      stopGenerating: mockStopGenerating,
      selectSession: mockSelectSession,
      deleteSession: mockDeleteSession,
      renameSession: mockRenameSession,
      startNewChat: mockStartNewChat,
      handleConfirmAction: mockHandleConfirmAction,
      handleCancelConfirmation: mockHandleCancelConfirmation,
      handleUndo: mockHandleUndo,
    });

    const { getByTestId, queryByTestId, getByText } = render(<ChatScreen />);

    // Verify message bubble is rendered
    expect(getByTestId("MessageBubble-msg-123")).toBeTruthy();
    expect(getByText("This is a user message")).toBeTruthy();

    // Modal initially closed
    expect(queryByTestId("EditMessageModal")).toBeNull();

    // Press Edit
    fireEvent.press(getByTestId("EditBtn-msg-123"));
    expect(getByTestId("EditMessageModal")).toBeTruthy();

    // Save edited message
    fireEvent.press(getByTestId("SaveEditBtn"));
    expect(mockSendMessage).toHaveBeenCalledWith("Edited text", { editMessageId: "msg-123" });

    // Close modal
    fireEvent.press(getByTestId("CloseEditBtn"));
    expect(queryByTestId("EditMessageModal")).toBeNull();
  });

  test("message bubble control callbacks: confirm, cancel, undo, and retry", () => {
    const mockMessages = [
      { id: "msg-999", text: "Important choice", sender: "ai" }
    ];

    useChatMessages.mockReturnValue({
      messages: mockMessages,
      sessions: [],
      activeSessionId: "session-1",
      loading: false,
      chatBusy: false,
      hasUserStartedChat: true,
      isProcessingCrud: false,
      flatListRef: mockFlatListRef,
      sendMessage: mockSendMessage,
      retryLastMessage: mockRetryLastMessage,
      stopGenerating: mockStopGenerating,
      selectSession: mockSelectSession,
      deleteSession: mockDeleteSession,
      renameSession: mockRenameSession,
      startNewChat: mockStartNewChat,
      handleConfirmAction: mockHandleConfirmAction,
      handleCancelConfirmation: mockHandleCancelConfirmation,
      handleUndo: mockHandleUndo,
    });

    const { getByTestId } = render(<ChatScreen />);

    // Trigger confirm
    fireEvent.press(getByTestId("ConfirmBtn-msg-999"));
    expect(mockHandleConfirmAction).toHaveBeenCalled();

    // Trigger cancel
    fireEvent.press(getByTestId("CancelBtn-msg-999"));
    expect(mockHandleCancelConfirmation).toHaveBeenCalled();

    // Trigger undo
    fireEvent.press(getByTestId("UndoBtn-msg-999"));
    expect(mockHandleUndo).toHaveBeenCalled();

    // Trigger retry
    fireEvent.press(getByTestId("RetryBtn-msg-999"));
    expect(mockRetryLastMessage).toHaveBeenCalled();
  });
});
