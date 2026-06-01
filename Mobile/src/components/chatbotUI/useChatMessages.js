import { useState, useRef, useCallback } from "react";
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
 * useChatMessages — Quản lý toàn bộ state tin nhắn, gửi/nhận, xác nhận CRUD, undo.
 *
 * Nhận vào:
 *   activeMode, activeProvider, activeModel, activeModelLabel
 *
 * Trả về:
 *   messages, loading, chatBusy, pendingIntent, isProcessingCrud
 *   sendMessage, handleConfirmAction, handleCancelConfirmation, handleUndo
 *   flatListRef, hasUserStartedChat
 */
export default function useChatMessages({ activeMode, activeProvider, activeModel, activeModelLabel }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [inputLocked, setInputLocked] = useState(false);
  const [isProcessingCrud, setIsProcessingCrud] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);

  const flatListRef    = useRef(null);
  const messagesRef    = useRef(messages);
  const isSendingRef   = useRef(false);
  const messageIdRef   = useRef(0);

  const chatBusy = loading || inputLocked || isProcessingCrud;

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

  // ── Send message ───────────────────────────────────────

  const sendMessage = useCallback(async (textToSend) => {
    const trimmedText = String(textToSend || "").trim();
    if (!trimmedText || chatBusy || isSendingRef.current) return;

    // Lấy pendingIntent từ state mới nhất (dùng ref nếu cần, nhưng ở đây closure đủ)
    // Ta dùng messagesRef để truy xuất pending gián tiếp
    const currentMessages = messagesRef.current;
    const hasPendingIntent = currentMessages.some((m) => m.isIntent && !m.isConfirmation);
    if (hasPendingIntent) {
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

    const userMessage = {
      id: createMessageId("user"),
      text: trimmedText,
      sender: "user",
      time: getCurrentTimeLabel()
    };

    const nextMessages = [...currentMessages, userMessage];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setLoading(true);

    try {
      const history = buildHistory(nextMessages);

      if (activeMode === "chat") {
        const response = await sendAiChat(history, activeProvider, activeModel);
        appendMessage({
          id: createMessageId("bot"),
          text: response?.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp.",
          sender: "bot",
          modelLabel: activeModelLabel,
          time: getCurrentTimeLabel()
        });
      } else {
        // Agent Mode
        const intentResponse = await parseAiIntent(
          trimmedText, "dashboard", history,
          activeProvider, activeModel
        );
        const parsed = parseIntentResponse(intentResponse);

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
          const response = await sendAiChat(history, activeProvider, activeModel);
          appendMessage({
            id: createMessageId("bot"),
            text: response?.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp.",
            sender: "bot",
            modelLabel: activeModelLabel,
            time: getCurrentTimeLabel()
          });
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Không thể xử lý yêu cầu. Vui lòng thử lại sau.";
      appendMessage({
        id: createMessageId("bot-error"),
        text: errorMsg,
        sender: "bot",
        isError: true,
        time: getCurrentTimeLabel()
      });
    } finally {
      isSendingRef.current = false;
      setLoading(false);
      setInputLocked(false);
    }
  }, [activeMode, activeProvider, activeModel, activeModelLabel, chatBusy, buildHistory, appendMessage, createMessageId]);

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
    loading,
    chatBusy,
    pendingIntent,
    isProcessingCrud,
    hasUserStartedChat,
    // Refs
    flatListRef,
    // Actions
    sendMessage,
    handleConfirmAction,
    handleCancelConfirmation,
    handleUndo
  };
}
