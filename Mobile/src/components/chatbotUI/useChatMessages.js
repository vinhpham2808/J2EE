import { useState, useRef, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { sendAiChat, parseAiIntent, confirmAiAction, undoAiAction } from "../../services/aiService";
import { parseIntentResponse, isCrudIntent, isActionIntent, INTENT_ICONS } from "../../utils/aiIntentParser";
import http from "../../services/http";
import { API_ENDPOINTS } from "../../constants/api";

// ─── Helpers ─────────────────────────────────────────────

const getCurrentTimeLabel = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const WELCOME_MESSAGE = {
  id: "welcome",
  text: "Xin chào! Tôi là Nova Money - Trợ lý AI của Money Manager. Tôi có thể trò chuyện, tư vấn tài chính, hoặc tự động thao tác dữ liệu giúp bạn ở chế độ Agent.",
  sender: "bot",
  time: getCurrentTimeLabel()
};

/**
 * useChatMessages — Quản lý toàn bộ state tin nhắn, sessions, sửa tin, dừng & thử lại.
 */
export default function useChatMessages({ activeMode, activeProvider, activeModel, activeModelLabel }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputLocked, setInputLocked] = useState(false);
  const [isProcessingCrud, setIsProcessingCrud] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);

  const flatListRef = useRef(null);
  const messagesRef = useRef(messages);
  const isSendingRef = useRef(false);
  const messageIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const currentRequestIdRef = useRef(0);

  const chatBusy = loading || inputLocked || isProcessingCrud;

  // ── Session Management ────────────────────────────────

  const fetchSessions = useCallback(async () => {
    try {
      const response = await http.get(API_ENDPOINTS.AI_CHAT_SESSIONS);
      setSessions(response.data || []);
    } catch {
      setSessions([]);
    }
  }, []);

  const selectSession = useCallback(async (sessionId) => {
    stopGenerating();
    const requestId = ++currentRequestIdRef.current;
    isSendingRef.current = false;

    setActiveSessionId(sessionId);
    setPendingIntent(null);
    setLoading(true);
    setInputLocked(false);
    try {
      const response = await http.get(API_ENDPOINTS.AI_CHAT_MESSAGES(sessionId));
      if (requestId !== currentRequestIdRef.current) return;

      const rawMsgs = response.data || [];
      const mapped = rawMsgs.map((m) => ({
        id: String(m.id || Math.random()),
        text: m.content || "",
        sender: m.role === "user" ? "user" : "bot",
        time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : getCurrentTimeLabel()
      }));
      const nextMsgs = mapped.length > 0 ? mapped : [WELCOME_MESSAGE];
      setMessages(nextMsgs);
      messagesRef.current = nextMsgs;
    } catch {
      if (requestId !== currentRequestIdRef.current) return;
      setMessages([WELCOME_MESSAGE]);
      messagesRef.current = [WELCOME_MESSAGE];
    } finally {
      if (requestId === currentRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [stopGenerating]);

  const deleteSession = useCallback(async (sessionId) => {
    try {
      await http.delete(API_ENDPOINTS.AI_CHAT_DELETE_SESSION(sessionId));
      if (activeSessionId === sessionId) {
        startNewChat();
      }
      fetchSessions();
    } catch {
      Alert.alert("Lỗi", "Không thể xóa phiên trò chuyện.");
    }
  }, [activeSessionId, fetchSessions]);

  const renameSession = useCallback(async (sessionId, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      await http.put(API_ENDPOINTS.AI_CHAT_RENAME_SESSION(sessionId), { title: newTitle });
      fetchSessions();
    } catch {
      Alert.alert("Lỗi", "Không thể đổi tên phiên.");
    }
  }, [fetchSessions]);

  const startNewChat = useCallback(() => {
    stopGenerating();
    currentRequestIdRef.current += 1;
    isSendingRef.current = false;

    setActiveSessionId(null);
    setPendingIntent(null);
    setLoading(false);
    setInputLocked(false);
    setMessages([WELCOME_MESSAGE]);
    messagesRef.current = [WELCOME_MESSAGE];
  }, [stopGenerating]);

  // Tải danh sách phiên chat khi khởi chạy
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ── Stop Generating ──────────────────────────────────

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // ── Internal helpers ───────────────────────────────────

  const createMessageId = useCallback((prefix = "message") => {
    messageIdRef.current += 1;
    return `${prefix}-${Date.now()}-${messageIdRef.current}`;
  }, []);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => {
      const next = [...prev, message];
      messagesRef.current = next;
      return next;
    });
  }, []);

  const buildHistory = useCallback((msgs) => {
    return msgs
      .filter((m) => m.id !== "welcome" && !m.isSystem && !m.isIntent && !m.isConfirmation)
      .slice(-20)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      }));
  }, []);

  const buildPersistedMessages = useCallback((msgs) => {
    return msgs
      .filter((m) => m.id !== "welcome" && !m.isSystem && !m.isIntent && !m.isConfirmation && !m.isError)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      }));
  }, []);

  // ── Export action helpers ──────────────────────────────

  const executeExportAction = useCallback(async (intent) => {
    if (intent === "EXPORT_EXCEL_INCOME" || intent === "EXPORT_EXCEL_EXPENSE") {
      const endpoint = intent === "EXPORT_EXCEL_INCOME"
        ? API_ENDPOINTS.INCOME_EXCEL_DOWNLOAD
        : API_ENDPOINTS.EXPENSE_EXCEL_DOWNLOAD;
      await http.get(endpoint);
      return intent === "EXPORT_EXCEL_INCOME"
        ? "📥 Đã chuẩn bị báo cáo Excel thu nhập tháng này!"
        : "📥 Đã chuẩn bị báo cáo Excel chi tiêu tháng này!";
    }
    if (intent === "EMAIL_INCOME_REPORT" || intent === "EMAIL_EXPENSE_REPORT") {
      const endpoint = intent === "EMAIL_INCOME_REPORT"
        ? API_ENDPOINTS.EMAIL_INCOME
        : API_ENDPOINTS.EMAIL_EXPENSE;
      await http.get(endpoint);
      return intent === "EMAIL_INCOME_REPORT"
        ? "📧 Đã gửi báo cáo thu nhập tháng này đến email của bạn!"
        : "📧 Đã gửi báo cáo chi tiêu tháng này đến email của bạn!";
    }
    throw new Error("Không xác định được hành động.");
  }, []);

  // ── Send / Edit / Resend ───────────────────────────────

  const sendMessage = useCallback(async (textToSend, options = {}) => {
    const trimmedText = String(textToSend || "").trim();
    const editMessageId = options?.editMessageId ?? null;
    if (!trimmedText || (chatBusy && !editMessageId) || isSendingRef.current) return;

    const currentMessages = messagesRef.current;
    
    // Nếu có pendingIntent (đang chờ xác nhận CRUD) thì chặn gửi tin nhắn mới
    const hasPendingIntent = currentMessages.some((m) => m.isIntent && !m.isConfirmation);
    if (hasPendingIntent && !editMessageId) {
      appendMessage({
        id: createMessageId("system-warn"),
        text: "⚠️ Vui lòng xác nhận hoặc hủy thao tác hiện tại trước khi gửi lệnh mới.",
        sender: "bot",
        isSystem: true,
        time: getCurrentTimeLabel()
      });
      return;
    }

    isSendingRef.current = true;
    setInputLocked(true);
    setLoading(true);

    // Xử lý Cắt Lịch Sử (Nếu đang chỉnh sửa tin nhắn cũ)
    const editingMessageIndex = editMessageId
      ? currentMessages.findIndex((m) => m.id === editMessageId)
      : -1;
    const isEditingExisting = editingMessageIndex >= 0;
    
    const baseMessages = isEditingExisting
      ? currentMessages.slice(0, editingMessageIndex)
      : currentMessages;

    const userMessage = {
      id: isEditingExisting ? editMessageId : createMessageId("user"),
      text: trimmedText,
      sender: "user",
      time: getCurrentTimeLabel()
    };

    const nextMessages = [...baseMessages, userMessage];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setPendingIntent(null);

    const requestId = ++currentRequestIdRef.current;

    // Khởi tạo AbortController cho phép dừng generate giữa chừng
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const history = buildHistory(nextMessages);

      // Nếu đang chỉnh sửa tin nhắn cũ, gửi PUT đồng bộ lại lịch sử lên server
      if (isEditingExisting && activeSessionId) {
        await http.put(
          API_ENDPOINTS.AI_CHAT_REPLACE_MESSAGES(activeSessionId),
          { messages: buildPersistedMessages(nextMessages) }
        );
        if (requestId !== currentRequestIdRef.current) return;
      }

      if (activeMode === "chat") {
        const response = await sendAiChat(
          history, activeProvider, activeModel,
          activeSessionId, true, signal
        );
        if (requestId !== currentRequestIdRef.current) return;
        
        appendMessage({
          id: createMessageId("bot"),
          text: response?.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp.",
          sender: "bot",
          modelLabel: activeModelLabel,
          time: getCurrentTimeLabel()
        });

        if (response?.sessionId && !activeSessionId) {
          setActiveSessionId(response.sessionId);
          fetchSessions();
        }
      } else {
        // Agent Mode
        const intentResponse = await parseAiIntent(
          trimmedText, "dashboard", history,
          activeProvider, activeModel, activeSessionId, signal
        );
        if (requestId !== currentRequestIdRef.current) return;
        
        const parsed = parseIntentResponse(intentResponse);

        if (intentResponse?.sessionId && !activeSessionId) {
          setActiveSessionId(intentResponse.sessionId);
          fetchSessions();
        }

        if (isCrudIntent(parsed.intent) || isActionIntent(parsed.intent)) {
          setPendingIntent(parsed);
          appendMessage({
            id: createMessageId("intent"),
            sender: "bot",
            isIntent: true,
            intent: parsed.intent,
            extractedFields: parsed.extractedFields,
            suggestedValues: parsed.suggestedValues,
            confirmationPrompt: parsed.confirmationPrompt,
            time: getCurrentTimeLabel()
          });
        } else if (parsed.intent === "ANSWER_QUESTION") {
          appendMessage({
            id: createMessageId("bot"),
            text: parsed.answer || intentResponse?.reply || "Tôi đã nhận câu hỏi nhưng chưa tạo được câu trả lời phù hợp.",
            sender: "bot",
            modelLabel: activeModelLabel,
            time: getCurrentTimeLabel()
          });
        } else if (parsed.intent === "INVALID_REQUEST") {
          appendMessage({
            id: createMessageId("bot-error"),
            text: parsed.validationErrors?.[0] || "Yêu cầu không hợp lệ hoặc ngoài phạm vi hỗ trợ.",
            sender: "bot",
            isError: true,
            time: getCurrentTimeLabel()
          });
        } else {
          // Fallback to chat
          const response = await sendAiChat(
            history, activeProvider, activeModel,
            activeSessionId || intentResponse?.sessionId, true, signal
          );
          if (requestId !== currentRequestIdRef.current) return;
          
          appendMessage({
            id: createMessageId("bot"),
            text: response?.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp.",
            sender: "bot",
            modelLabel: activeModelLabel,
            time: getCurrentTimeLabel()
          });
        }
      }
      
      // Đồng bộ lại danh sách phiên chat
      fetchSessions();

    } catch (error) {
      if (requestId !== currentRequestIdRef.current) return;
      if (error.name === "AbortError" || error.message === "canceled" || error.code === "ERR_CANCELED") {
        // Xử lý khi người dùng ấn nút STOP
        appendMessage({
          id: createMessageId("bot-info"),
          text: "⏹️ Đã dừng sinh phản hồi.",
          sender: "bot",
          isSystem: true,
          time: getCurrentTimeLabel()
        });
      } else {
        const errorMsg = error.response?.data?.message || "Không thể xử lý yêu cầu. Vui lòng thử lại sau.";
        appendMessage({
          id: createMessageId("bot-error"),
          text: errorMsg,
          sender: "bot",
          isError: true,
          time: getCurrentTimeLabel()
        });
      }
    } finally {
      if (requestId === currentRequestIdRef.current) {
        isSendingRef.current = false;
        setLoading(false);
        setInputLocked(false);
        abortControllerRef.current = null;
      }
    }
  }, [activeMode, activeProvider, activeModel, activeModelLabel, chatBusy, activeSessionId, buildHistory, buildPersistedMessages, appendMessage, createMessageId, fetchSessions]);

  // ── Retry ─────────────────────────────────────────────

  const retryLastMessage = useCallback(() => {
    const currentMessages = messagesRef.current;
    const lastUserIdx = [...currentMessages].reverse().findIndex((m) => m.sender === "user");
    if (lastUserIdx < 0) return;

    const actualIdx = currentMessages.length - 1 - lastUserIdx;
    const lastUserMsg = currentMessages[actualIdx];

    // Cắt bỏ mọi tin nhắn lỗi hoặc Bot phản hồi sau tin nhắn User cuối
    const nextMessages = currentMessages.slice(0, actualIdx);
    messagesRef.current = nextMessages;
    setMessages(nextMessages);

    // Gửi lại nội dung tin nhắn đó
    sendMessage(lastUserMsg.text);
  }, [sendMessage]);

  // ── Confirm / Cancel / Undo ────────────────────────────

  const handleConfirmAction = useCallback(async (intent, confirmedData) => {
    setIsProcessingCrud(true);
    try {
      let resultContent;
      let undoData = null;

      if (isActionIntent(intent)) {
        resultContent = await executeExportAction(intent);
      } else {
        const data = await confirmAiAction(intent, confirmedData);
        const icon = INTENT_ICONS[intent] || "✅";
        resultContent = `${icon} ${data.message || "Thao tác thành công!"}`;
        if (data.undoable && data.operationId) undoData = data;
      }

      setMessages((prev) => prev.map((m) => m.isIntent ? { ...m, isConfirmation: true } : m));
      appendMessage({
        id: createMessageId("result"),
        text: resultContent,
        sender: "bot",
        isSystem: true,
        time: getCurrentTimeLabel()
      });

      if (undoData) {
        appendMessage({
          id: createMessageId("undo"),
          sender: "bot",
          isUndoAction: true,
          operationId: undoData.operationId,
          text: "Bạn có thể hoàn tác thao tác này trong vòng vài phút.",
          time: getCurrentTimeLabel()
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Không thể thực hiện thao tác.";
      appendMessage({
        id: createMessageId("result-error"),
        text: `❌ Lỗi: ${errorMsg}`,
        sender: "bot",
        isError: true,
        time: getCurrentTimeLabel()
      });
    } finally {
      setIsProcessingCrud(false);
      setPendingIntent(null);
    }
  }, [executeExportAction, appendMessage, createMessageId]);

  const handleCancelConfirmation = useCallback(() => {
    setPendingIntent(null);
    setMessages((prev) => prev.map((m) => m.isIntent ? { ...m, isConfirmation: true } : m));
    appendMessage({
      id: createMessageId("cancel"),
      text: "Đã hủy thao tác.",
      sender: "bot",
      isSystem: true,
      time: getCurrentTimeLabel()
    });
  }, [appendMessage, createMessageId]);

  const handleUndo = useCallback(async (operationId) => {
    try {
      await undoAiAction(operationId);
      appendMessage({
        id: createMessageId("undo-result"),
        text: "↩️ Đã hoàn tác thao tác thành công.",
        sender: "bot",
        isSystem: true,
        time: getCurrentTimeLabel()
      });
    } catch (e) {
      Alert.alert("Lỗi hoàn tác", "Không thể hoàn tác. Có thể đã quá thời gian cho phép.");
    }
  }, [appendMessage, createMessageId]);

  // ── Derived ────────────────────────────────────────────

  const hasUserStartedChat = messages.some((m) => m.sender === "user");

  return {
    // State
    messages,
    sessions,
    activeSessionId,
    loading,
    chatBusy,
    pendingIntent,
    isProcessingCrud,
    hasUserStartedChat,
    // Refs
    flatListRef,
    // Actions
    sendMessage,
    retryLastMessage,
    stopGenerating,
    selectSession,
    deleteSession,
    renameSession,
    startNewChat,
    fetchSessions,
    handleConfirmAction,
    handleCancelConfirmation,
    handleUndo
  };
}
