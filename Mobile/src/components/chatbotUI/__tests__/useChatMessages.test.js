import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useChatMessages from "../useChatMessages";
import apiClient from "../../../services/apiClient";
import { sendAiChat, parseAiIntent, confirmAiAction } from "../../../services/aiChatService";
import { isCrudIntent, isActionIntent, parseIntentResponse } from "../../../utils/aiIntent";
import { executeExportAction } from "../chatActionHandlers";

jest.mock("../../../services/apiClient", () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  put: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  post: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../constants/api", () => ({
  API_ENDPOINTS: {
    AI_CHAT_SESSIONS: "/sessions",
    AI_CHAT_MESSAGES: (id) => `/sessions/${id}/messages`,
    AI_CHAT_RENAME_SESSION: (id) => `/sessions/${id}/rename`,
    AI_CHAT_DELETE_SESSION: (id) => `/sessions/${id}`,
    AI_CHAT_REPLACE_MESSAGES: (id) => `/sessions/${id}/replace`,
  },
}));

jest.mock("../../../services/aiChatService", () => ({
  sendAiChat: jest.fn(),
  parseAiIntent: jest.fn(),
  confirmAiAction: jest.fn(),
  undoAiAction: jest.fn(),
}));

jest.mock("../../../utils/aiIntent", () => ({
  parseIntentResponse: jest.fn(),
  isCrudIntent: jest.fn(),
  isActionIntent: jest.fn(),
  INTENT_ICONS: { CREATE_EXPENSE: "💸" },
  INTENT_LABELS: { CREATE_EXPENSE: "Tạo chi tiêu" },
}));

jest.mock("../chatActionHandlers", () => ({
  executeExportAction: jest.fn(),
}));

jest.mock("../chatMessageUtils", () => {
  return {
    buildHistory: jest.fn().mockReturnValue([]),
    buildPersistedMessages: jest.fn().mockReturnValue([]),
    getCurrentTimeLabel: () => "12:00",
    getWelcomeMessage: (t) => ({ id: "welcome", text: "Welcome", sender: "bot", time: "12:00" }),
    hasPendingIntent: jest.fn().mockReturnValue(false),
    mapStoredMessages: (msgs) => msgs,
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

// Mock Alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useChatMessages", () => {
  const defaultArgs = {
    activeMode: "chat",
    activeProvider: "openai",
    activeModel: "gpt-4",
    activeModelLabel: "GPT-4",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: [] });
  });

  test("initializes with welcome message and fetches sessions", async () => {
    apiClient.get.mockResolvedValueOnce({ data: [{ id: "session-1", title: "Session 1" }] });

    const { result } = renderHook(() => useChatMessages(defaultArgs));

    expect(result.current.messages).toEqual([
      { id: "welcome", text: "Welcome", sender: "bot", time: "12:00" },
    ]);
    expect(result.current.activeSessionId).toBeNull();
    expect(result.current.loading).toBe(false);

    // Should fetch sessions in useEffect
    await act(async () => {});
    expect(apiClient.get).toHaveBeenCalledWith("/sessions");
    expect(result.current.sessions).toEqual([{ id: "session-1", title: "Session 1" }]);
  });

  test("selectSession loads session messages", async () => {
    const mockMessages = [
      { id: "msg-1", text: "Hello", sender: "user" },
      { id: "msg-2", text: "Hi there", sender: "bot" },
    ];
    apiClient.get.mockImplementation((url) => {
      if (url === "/sessions/session-1/messages") {
        return Promise.resolve({ data: mockMessages });
      }
      return Promise.resolve({ data: [] });
    });

    const { result } = renderHook(() => useChatMessages(defaultArgs));

    await act(async () => {
      await result.current.selectSession("session-1");
    });

    expect(result.current.activeSessionId).toBe("session-1");
    expect(result.current.messages).toEqual(mockMessages);
  });

  test("renameSession triggers put request and updates sessions", async () => {
    const { result } = renderHook(() => useChatMessages(defaultArgs));

    await act(async () => {
      await result.current.renameSession("session-1", "New Title");
    });

    expect(apiClient.put).toHaveBeenCalledWith("/sessions/session-1/rename", { title: "New Title" });
    expect(apiClient.get).toHaveBeenCalledWith("/sessions");
  });

  test("deleteSession deletes session and starts new chat if it is the active session", async () => {
    const { result } = renderHook(() => useChatMessages(defaultArgs));

    await act(async () => {
      await result.current.selectSession("session-1");
    });

    await act(async () => {
      await result.current.deleteSession("session-1");
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/sessions/session-1");
    expect(result.current.activeSessionId).toBeNull(); // Reset because it was active
  });

  test("sendMessage in chat mode calls sendAiChat and appends messages", async () => {
    sendAiChat.mockResolvedValueOnce({ reply: "Hello back!", sessionId: "session-new" });

    const { result } = renderHook(() => useChatMessages(defaultArgs));

    await act(async () => {
      await result.current.sendMessage("Hello bot");
    });

    // Check that user message is added
    expect(result.current.messages.some((m) => m.text === "Hello bot" && m.sender === "user")).toBe(true);

    // Check that bot response is added
    expect(result.current.messages.some((m) => m.text === "Hello back!" && m.sender === "bot")).toBe(true);
    expect(result.current.activeSessionId).toBe("session-new");
  });

  test("sendMessage in agent mode handles ANSWER_QUESTION intent", async () => {
    const args = { ...defaultArgs, activeMode: "agent" };
    parseAiIntent.mockResolvedValueOnce({ reply: "Direct answer" });
    parseIntentResponse.mockReturnValueOnce({ intent: "ANSWER_QUESTION", answer: "Direct answer" });

    const { result } = renderHook(() => useChatMessages(args));

    await act(async () => {
      await result.current.sendMessage("What is my balance?");
    });

    expect(result.current.messages.some((m) => m.text === "Direct answer" && m.sender === "bot")).toBe(true);
  });

  test("sendMessage in agent mode handles CRUD intent by setting pendingIntent", async () => {
    const args = { ...defaultArgs, activeMode: "agent" };
    parseAiIntent.mockResolvedValueOnce({ reply: "Needs confirmation" });
    const mockIntent = {
      intent: "CREATE_EXPENSE",
      extractedFields: { amount: "10000" },
      suggestedValues: { note: "test" },
      confirmationPrompt: "Xác nhận tạo chi tiêu?",
    };
    parseIntentResponse.mockReturnValueOnce(mockIntent);
    isCrudIntent.mockReturnValueOnce(true);

    const { result } = renderHook(() => useChatMessages(args));

    await act(async () => {
      await result.current.sendMessage("Spent 10k on test");
    });

    expect(result.current.pendingIntent).toEqual(mockIntent);
    expect(result.current.messages.some((m) => m.isIntent === true && m.intent === "CREATE_EXPENSE")).toBe(true);
  });

  test("handleConfirmAction triggers confirmation and result messages", async () => {
    confirmAiAction.mockResolvedValueOnce({ message: "Giao dịch đã tạo", undoable: true, operationId: "op-1" });

    const { result } = renderHook(() => useChatMessages(defaultArgs));

    await act(async () => {
      await result.current.handleConfirmAction("CREATE_EXPENSE", { amount: "10000" });
    });

    expect(confirmAiAction).toHaveBeenCalledWith("CREATE_EXPENSE", { amount: "10000" });
    expect(result.current.messages.some((m) => m.isSystem === true && m.text.includes("Giao dịch đã tạo"))).toBe(true);
    expect(result.current.messages.some((m) => m.isUndoAction === true && m.operationId === "op-1")).toBe(true);
  });

  test("handleConfirmAction handles action intents (export) correctly", async () => {
    isActionIntent.mockReturnValueOnce(true);
    executeExportAction.mockResolvedValueOnce("Đã xuất file thành công");

    const { result } = renderHook(() => useChatMessages(defaultArgs));

    await act(async () => {
      await result.current.handleConfirmAction("EXPORT_EXCEL_EXPENSE", {});
    });

    expect(executeExportAction).toHaveBeenCalledWith("EXPORT_EXCEL_EXPENSE", expect.any(Function));
    expect(result.current.messages.some((m) => m.isSystem === true && m.text === "Đã xuất file thành công")).toBe(true);
  });

  test("handleCancelConfirmation clears pendingIntent and adds cancel message", async () => {
    const { result } = renderHook(() => useChatMessages(defaultArgs));

    await act(async () => {
      result.current.handleCancelConfirmation();
    });

    expect(result.current.pendingIntent).toBeNull();
    expect(result.current.messages.some((m) => m.isSystem === true && m.text === "chatbot.actionCancelled")).toBe(true);
  });
});
