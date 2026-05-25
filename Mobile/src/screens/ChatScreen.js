import React, { useState, useRef, useEffect, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from "react-native";
import { COLORS } from "../constants/colors";
import { sendAiChat, parseAiIntent, confirmAiAction, undoAiAction } from "../services/aiService";
import { AuthContext } from "../components/AuthContext";
import { parseIntentResponse, isCrudIntent, isActionIntent, INTENT_ICONS } from "../utils/aiIntentParser";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import ModeSegmentedControl from "../components/chatbotUI/ModeSegmentedControl";
import ModelSelectorPill from "../components/chatbotUI/ModelSelectorPill";
import MessageBubble from "../components/chatbotUI/MessageBubble";
import QuickPromptChips from "../components/chatbotUI/QuickPromptChips";
import ChatInputBar from "../components/chatbotUI/ChatInputBar";

// ─── Helpers ───────────────────────────────────────────────

const getCurrentTimeLabel = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatScreen() {
  const { user } = useContext(AuthContext);

  // Subscription status checking
  const isFreePlan = !user?.subscriptionPlan || user?.subscriptionPlan === "FREE";
  const isBasicPlan = user?.subscriptionPlan === "BASIC";
  const isPremiumPlan = user?.subscriptionPlan === "PREMIUM";

  // Mode and Provider state
  const [activeMode, setActiveMode] = useState("chat"); // "chat" | "agent"
  const [chatModel, setChatModel] = useState("ninerouter"); // "ninerouter" | "gptoss"
  const [agentModel, setAgentModel] = useState("ninerouter"); // "ninerouter" | "gemini"

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Xin chào! Tôi là Nova Money - Trợ lý AI của Money Manager. Tôi có thể trò chuyện, tư vấn tài chính, hoặc tự động thao tác dữ liệu giúp bạn ở chế độ Agent.",
      sender: "bot",
      time: getCurrentTimeLabel()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProcessingCrud, setIsProcessingCrud] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);
  const flatListRef = useRef(null);

  // Sync state model defaults when user tier changes
  useEffect(() => {
    if (isPremiumPlan) {
      if (chatModel === "ninerouter" && agentModel === "ninerouter") {
        setChatModel("gptoss");
        setAgentModel("gemini");
      }
    } else {
      setChatModel("ninerouter");
      setAgentModel("ninerouter");
      setActiveMode("chat"); // Free/Basic default to chat
    }
  }, [user?.subscriptionPlan]);

  const getActiveParams = () => {
    const activeProvider = activeMode === "agent"
      ? (agentModel === "ninerouter" ? "ninerouter" : "gemini")
      : (chatModel === "ninerouter" ? "ninerouter" : "gptoss");
      
    const activeModel = activeMode === "agent"
      ? (agentModel === "ninerouter" ? "gemma4-31B" : "gemini-3.1-flash-lite")
      : (chatModel === "ninerouter" ? "project-demo" : "gpt-oss-120b");

    const activeModelLabel = activeMode === "agent"
      ? (agentModel === "ninerouter" ? "Nova Lite" : "Gemini 3.1 Flash")
      : (chatModel === "ninerouter" ? "Nova Lite" : "GPT-OSS 120B");

    return { activeProvider, activeModel, activeModelLabel };
  };

  const buildHistory = (msgs) => {
    return msgs
      .filter((m) => m.id !== "welcome" && !m.isSystem && !m.isIntent && !m.isConfirmation)
      .slice(-20)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      }));
  };

  const sendMessage = async (textToSend) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText || loading) return;

    if (pendingIntent) {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-warn-${Date.now()}`,
          text: "⚠️ Vui lòng xác nhận hoặc hủy thao tác hiện tại trước khi gửi lệnh mới.",
          sender: "bot",
          isSystem: true,
          time: getCurrentTimeLabel()
        }
      ]);
      return;
    }

    const { activeProvider, activeModel, activeModelLabel } = getActiveParams();

    const userMessage = {
      id: String(Date.now()),
      text: trimmedText,
      sender: "user",
      time: getCurrentTimeLabel()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setLoading(true);

    try {
      const history = buildHistory(updatedMessages);

      if (activeMode === "chat") {
        const response = await sendAiChat(history, activeProvider, activeModel);
        const botMessage = {
          id: String(Date.now() + 1),
          text: response?.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp.",
          sender: "bot",
          modelLabel: activeModelLabel,
          time: getCurrentTimeLabel()
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Agent Mode: Parse intent first
        const intentResponse = await parseAiIntent(
          trimmedText,
          "dashboard", // Context page on mobile
          history,
          activeProvider,
          activeModel
        );

        const parsed = parseIntentResponse(intentResponse);

        if (isCrudIntent(parsed.intent) || isActionIntent(parsed.intent)) {
          setPendingIntent(parsed);
          const intentMessage = {
            id: String(Date.now() + 1),
            sender: "bot",
            isIntent: true,
            intent: parsed.intent,
            extractedFields: parsed.extractedFields,
            suggestedValues: parsed.suggestedValues,
            confirmationPrompt: parsed.confirmationPrompt,
            time: getCurrentTimeLabel()
          };
          setMessages((prev) => [...prev, intentMessage]);
        } else if (parsed.intent === "ANSWER_QUESTION") {
          const botMessage = {
            id: String(Date.now() + 1),
            text: parsed.answer || intentResponse?.reply || "Tôi đã nhận câu hỏi nhưng chưa tạo được câu trả lời phù hợp.",
            sender: "bot",
            modelLabel: activeModelLabel,
            time: getCurrentTimeLabel()
          };
          setMessages((prev) => [...prev, botMessage]);
        } else if (parsed.intent === "INVALID_REQUEST") {
          const botMessage = {
            id: String(Date.now() + 1),
            text: parsed.validationErrors?.[0] || "Yêu cầu không hợp lệ hoặc ngoài phạm vi hỗ trợ.",
            sender: "bot",
            isError: true,
            time: getCurrentTimeLabel()
          };
          setMessages((prev) => [...prev, botMessage]);
        } else {
          // Fallback to chat API
          const response = await sendAiChat(history, activeProvider, activeModel);
          const botMessage = {
            id: String(Date.now() + 1),
            text: response?.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp.",
            sender: "bot",
            modelLabel: activeModelLabel,
            time: getCurrentTimeLabel()
          };
          setMessages((prev) => [...prev, botMessage]);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Không thể xử lý yêu cầu. Vui lòng thử lại sau.";
      const errorMessage = {
        id: String(Date.now() + 1),
        text: errorMsg,
        sender: "bot",
        isError: true,
        time: getCurrentTimeLabel()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const executeExportAction = async (intent) => {
    if (intent === "EXPORT_EXCEL_INCOME" || intent === "EXPORT_EXCEL_EXPENSE") {
      const endpoint = intent === "EXPORT_EXCEL_INCOME"
        ? API_ENDPOINTS.INCOME_EXCEL_DOWNLOAD
        : API_ENDPOINTS.EXPENSE_EXCEL_DOWNLOAD;
      
      // On mobile, trigger get excel report API
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
  };

  const handleConfirmAction = async (intent, confirmedData) => {
    setIsProcessingCrud(true);
    try {
      let resultContent;
      let undoData = null;

      if (isActionIntent(intent)) {
        resultContent = await executeExportAction(intent);
      } else {
        const data = await confirmAiAction(intent, confirmedData);
        const intentIcon = INTENT_ICONS[intent] || "✅";
        resultContent = `${intentIcon} ${data.message || "Thao tác thành công!"}`;
        if (data.undoable && data.operationId) {
          undoData = data;
        }
      }

      setMessages((prev) => prev.map((m) => m.isIntent ? { ...m, isConfirmation: true } : m));
      setMessages((prev) => [
        ...prev,
        {
          id: `result-${Date.now()}`,
          text: resultContent,
          sender: "bot",
          isSystem: true,
          time: getCurrentTimeLabel()
        }
      ]);

      if (undoData) {
        setMessages((prev) => [
          ...prev,
          {
            id: `undo-${Date.now()}`,
            sender: "bot",
            isUndoAction: true,
            operationId: undoData.operationId,
            text: "Bạn có thể hoàn tác thao tác này trong vòng vài phút.",
            time: getCurrentTimeLabel()
          }
        ]);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Không thể thực hiện thao tác.";
      setMessages((prev) => [
        ...prev,
        {
          id: `result-error-${Date.now()}`,
          text: `❌ Lỗi: ${errorMsg}`,
          sender: "bot",
          isError: true,
          time: getCurrentTimeLabel()
        }
      ]);
    } finally {
      setIsProcessingCrud(false);
      setPendingIntent(null);
    }
  };

  const handleCancelConfirmation = () => {
    setPendingIntent(null);
    setMessages((prev) => prev.map((m) => m.isIntent ? { ...m, isConfirmation: true } : m));
    setMessages((prev) => [
      ...prev,
      {
        id: `cancel-${Date.now()}`,
        text: "Đã hủy thao tác.",
        sender: "bot",
        isSystem: true,
        time: getCurrentTimeLabel()
      }
    ]);
  };

  const handleUndo = async (operationId) => {
    try {
      await undoAiAction(operationId);
      setMessages((prev) => [
        ...prev,
        {
          id: `undo-result-${Date.now()}`,
          text: "↩️ Đã hoàn tác thao tác thành công.",
          sender: "bot",
          isSystem: true,
          time: getCurrentTimeLabel()
        }
      ]);
    } catch (e) {
      Alert.alert("Lỗi hoàn tác", "Không thể hoàn tác. Có thể đã quá thời gian cho phép.");
    }
  };

  const handleModeSwitch = (mode) => {
    if (mode === activeMode) return;

    if (mode === "agent" && isFreePlan) {
      Alert.alert(
        "Yêu cầu gói BASIC trở lên",
        "Tính năng Agent của Nova Money (Tạo/sửa/xóa dữ liệu tự động) chỉ khả dụng cho gói BASIC trở lên. Vui lòng nâng cấp gói để sử dụng.",
        [{ text: "Đóng", style: "cancel" }]
      );
      return;
    }

    setActiveMode(mode);
  };

  const handleModelChange = (model) => {
    if (activeMode === "chat") {
      if (model === chatModel) return;
      if (!isPremiumPlan && model !== "ninerouter") return;

      setChatModel(model);
    } else {
      // Agent mode
      if (model === agentModel) return;
      if (!isPremiumPlan && model !== "ninerouter") return;

      setAgentModel(model);
    }
  };

  useEffect(() => {
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  // ─── Derived helpers ────────────────────────────────────

  const getModelLabel = () => getActiveParams().activeModelLabel;

  const getModelValue = () => (activeMode === "chat" ? chatModel : agentModel);

  const getModelSelectorTitle = () => (activeMode === "chat" ? "MODEL CHAT" : "MODEL AGENT");

  const getModelOptions = () => {
    if (activeMode === "chat") {
      return [
        {
          label: "Nova Lite",
          value: "ninerouter",
          icon: "✦",
          description: "Nhanh · tiết kiệm",
        },
        {
          label: "GPT-OSS 120B",
          value: "gptoss",
          icon: "✧",
          description: "Mạnh · phân tích sâu",
          disabled: !isPremiumPlan,
          badge: !isPremiumPlan ? "PREMIUM" : null,
        },
      ];
    }

    return [
      {
        label: "Gemini 3.1 Flash",
        value: "gemini",
        icon: "🤖",
        description: "Nhanh · thông minh · tiết kiệm",
        disabled: !isPremiumPlan,
        badge: !isPremiumPlan ? "PREMIUM" : null,
      },
      {
        label: "Nova Lite",
        value: "ninerouter",
        icon: "✦",
        description: "Nhanh · tiết kiệm",
      },
    ];
  };

  const getInputPlaceholder = () => {
    if (activeMode === "agent") {
      return "Tạo/sửa/xóa dữ liệu, xuất excel...";
    }
    return "Trò chuyện, hỏi đáp tài chính...";
  };

  const hasUserStartedChat = messages.some((m) => m.sender === "user");

  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt.text);
  };

  const openSettings = () => {
    Alert.alert("Cài đặt", "Tính năng cài đặt chat đang được phát triển.", [
      { text: "Đóng", style: "cancel" },
    ]);
  };

  const renderMessage = ({ item }) => (
    <MessageBubble
      message={item}
      onConfirm={handleConfirmAction}
      onCancel={handleCancelConfirmation}
      onUndo={handleUndo}
      isProcessing={isProcessingCrud}
    />
  );

  // ─── Render ─────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ModeSegmentedControl
        activeMode={activeMode}
        isFreePlan={isFreePlan}
        onChangeMode={handleModeSwitch}
      />

      <ModelSelectorPill
        label={getModelLabel()}
        value={getModelValue()}
        options={getModelOptions()}
        title={getModelSelectorTitle()}
        onSelect={handleModelChange}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.CHAT_PURPLE} size="small" />
                <Text style={styles.loadingText}>
                  {getModelLabel()} đang suy nghĩ...
                </Text>
              </View>
            ) : null
          }
        />

        {!hasUserStartedChat && !loading && (
          <QuickPromptChips onSelect={handleQuickPrompt} />
        )}

        <ChatInputBar
          value={inputText}
          onChangeText={setInputText}
          onSend={() => sendMessage(inputText)}
          placeholder={getInputPlaceholder()}
          loading={loading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.CHAT_BG,
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.CHAT_BUBBLE,
    borderWidth: 1,
    borderColor: COLORS.CHAT_BORDER,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    marginTop: 6,
  },
  loadingText: {
    color: COLORS.CHAT_MUTED,
    fontSize: 12,
  },
});
