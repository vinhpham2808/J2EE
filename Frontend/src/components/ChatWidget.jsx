import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, MessageCircle, RotateCcw, SendHorizontal, X, Maximize2, Minimize2 } from "lucide-react";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { AppContext } from "../context/AppContext.jsx";
import { useRouteContext } from "../context/RouteContext.jsx";
import { parseIntentResponse, isCrudIntent, isActionIntent, INTENT_ICONS, INTENT_LABELS } from "../util/aiIntentParser.js";
import AIConfirmationForm from "./AIConfirmationForm.jsx";

const AVAILABLE_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "gemini" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", provider: "gemini" },
];

// SVG icons cho từng model
const MODEL_ICONS = {
  "gemini-2.5-flash": (
    <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gemini-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1A73E8"/>
          <stop offset="100%" stopColor="#4FC3F7"/>
        </linearGradient>
      </defs>
      <path d="M14 2L17.09 8.26L24 9.27L19 14.14L20.18 21.02L14 17.77L7.82 21.02L9 14.14L4 9.27L10.91 8.26L14 2Z" fill="url(#gemini-grad)"/>
    </svg>
  ),
  "gemini-3.1-flash-lite": (
    <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gemini-lite-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34A853"/>
          <stop offset="100%" stopColor="#A8D8A8"/>
        </linearGradient>
      </defs>
      <path d="M14 2L17.09 8.26L24 9.27L19 14.14L20.18 21.02L14 17.77L7.82 21.02L9 14.14L4 9.27L10.91 8.26L14 2Z" fill="url(#gemini-lite-grad)"/>
    </svg>
  ),
};

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content: "Xin chào! Tôi là Nova Money - Trợ lý AI của Money Manager. Tôi có thể trò chuyện, hỗ trợ tài chính, và giúp bạn tạo/sửa/xóa dữ liệu nhanh chóng.",
};

const QUICK_ACTIONS = [
  { label: "💰 Gợi ý tiết kiệm", text: "Gợi ý cách tiết kiệm dựa trên thói quen chi tiêu của tôi" },
  { label: "🧠 Tâm lý chi tiêu", text: "Tại sao tôi hay mua sắm bốc đồng và làm sao để kiểm soát?" },
  { label: "💬 Tôi đang lo về tiền", text: "Tôi đang stress và lo lắng về tài chính, bạn có thể lắng nghe không?" },
  { label: "🎯 Lập kế hoạch mục tiêu", text: "Giúp tôi lên kế hoạch tiết kiệm cho một mục tiêu lớn" },
];

const PUBLIC_PATHS = new Set([
  "/",
  "/home",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/activate"
]);

const formatAssistantMessage = (content) => {
  if (!content) return [];
  const normalizedContent = content
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/([^\n])(\d+\.\s)/g, "$1\n$2")
    .replace(/([^\n])(-\s)/g, "$1\n$2")
    .replace(/([^\n])(•\s)/g, "$1\n$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalizedContent.split("\n").map((line) => line.trim()).filter(Boolean);
};

const buildHistory = (msgs) =>
  msgs
    .filter((m) => m.id !== "welcome" && !m.isSystem && !m.isIntent && !m.isConfirmation)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-20);

const ChatWidget = () => {
  const { user } = useContext(AppContext);
  const { currentPage, pageLabel } = useRouteContext();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const modelDropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const shouldHideWidget = !token || PUBLIC_PATHS.has(location.pathname);

  const isFreePlan = !user?.subscriptionPlan || user?.subscriptionPlan === "FREE";
  
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [selectedProvider, setProvider] = useState(isFreePlan ? "gptoss" : "gemini");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isProcessingCrud, setIsProcessingCrud] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);

  useEffect(() => {
    if (isFreePlan && selectedProvider === "gemini") {
      setProvider("gptoss");
    }
  }, [isFreePlan, selectedProvider]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!modelDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modelDropdownOpen]);

  if (shouldHideWidget) return null;

  const sendMessage = async (promptText) => {
    const trimmedMessage = promptText.trim();
    if (!trimmedMessage || isSending) return;

    const modelObj = AVAILABLE_MODELS.find(m => m.id === selectedModel);
    const activeProvider = selectedProvider === "gemini" ? modelObj.provider : "gptoss";
    const activeModel = selectedProvider === "gemini" ? selectedModel : "gpt-oss-120b";
    const activeModelLabel = selectedProvider === "gemini"
      ? (modelObj?.label || "Gemini 2.5 Flash")
      : "GPT-OSS 120B";

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
      provider: activeProvider,
      model: activeModel,
      modelLabel: activeModelLabel
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsSending(true);

    try {
      const conversationHistory = buildHistory(updatedMessages);

      if (selectedProvider === "gptoss") {
        const response = await axiosConfig.post(API_ENDPOINTS.AI_CHAT, {
          provider: activeProvider,
          model: activeModel,
          messages: buildHistory(updatedMessages)
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.data?.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp.",
            provider: response.data?.provider || activeProvider,
            modelUsed: response.data?.modelUsed,
            modelLabel: activeModelLabel
          }
        ]);
        setIsSending(false);
        return;
      }

      const intentResponse = await axiosConfig.post(API_ENDPOINTS.AI_PARSE_INTENT, {
        provider: activeProvider,
        model: activeModel,
        userMessage: trimmedMessage,
        pageContext: currentPage || "dashboard",
        conversationHistory
      });

      const parsed = parseIntentResponse(intentResponse.data);

      if (isCrudIntent(parsed.intent) || isActionIntent(parsed.intent)) {
        setPendingIntent(parsed);
        setMessages((prev) => [
          ...prev,
          {
            id: `intent-${Date.now()}`,
            role: "assistant",
            isIntent: true,
            intent: parsed.intent,
            extractedFields: parsed.extractedFields,
            suggestedValues: parsed.suggestedValues,
            confirmationPrompt: parsed.confirmationPrompt
          }
        ]);
      } else if (parsed.intent === "ANSWER_QUESTION") {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: parsed.answer || intentResponse.data?.reply || "Tôi đã nhận câu hỏi nhưng chưa tạo được câu trả lời phù hợp.",
            provider: activeProvider,
            modelUsed: intentResponse.data?.modelUsed,
            modelLabel: activeModelLabel
          }
        ]);
      } else if (parsed.intent === "INVALID_REQUEST") {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content: parsed.validationErrors?.[0] || "Yêu cầu không hợp lệ hoặc ngoài phạm vi hỗ trợ.",
            isError: true,
            provider: activeProvider
          }
        ]);
      } else {
        const response = await axiosConfig.post(API_ENDPOINTS.AI_CHAT, {
          provider: activeProvider,
          model: activeModel,
          messages: buildHistory(updatedMessages)
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.data?.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp.",
            provider: response.data?.provider || activeProvider,
            modelUsed: response.data?.modelUsed,
            modelLabel: activeModelLabel
          }
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: error.response?.data?.message || "Hiện tại tôi chưa phản hồi được. Bạn thử lại sau giúp mình nhé.",
          isError: true,
          provider: activeProvider
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const executeExportAction = async (intent) => {
    if (intent === "EXPORT_EXCEL_INCOME" || intent === "EXPORT_EXCEL_EXPENSE") {
      const endpoint = intent === "EXPORT_EXCEL_INCOME"
        ? API_ENDPOINTS.INCOME_EXCEL_DOWNLOAD
        : API_ENDPOINTS.EXPENSE_EXCEL_DOWNLOAD;
      const filename = intent === "EXPORT_EXCEL_INCOME" ? "income_details.xlsx" : "expense_details.xlsx";
      const response = await axiosConfig.get(endpoint, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      return intent === "EXPORT_EXCEL_INCOME"
        ? "📥 Đã tải xuống báo cáo Excel thu nhập tháng này!"
        : "📥 Đã tải xuống báo cáo Excel chi tiêu tháng này!";
    }
    if (intent === "EMAIL_INCOME_REPORT" || intent === "EMAIL_EXPENSE_REPORT") {
      const endpoint = intent === "EMAIL_INCOME_REPORT"
        ? API_ENDPOINTS.EMAIL_INCOME
        : API_ENDPOINTS.EMAIL_EXPENSE;
      await axiosConfig.get(endpoint);
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
        const { data } = await axiosConfig.post(API_ENDPOINTS.AI_CONFIRM_ACTION, {
          intent,
          extractedData: confirmedData
        });
        const intentIcon = INTENT_ICONS[intent] || "✅";
        resultContent = `${intentIcon} ${data.message || "Thao tác thành công!"}`;
        if (data.undoable && data.operationId) undoData = data;
      }

      setMessages((prev) => prev.map((m) => m.isIntent ? { ...m, isConfirmation: true } : m));
      setMessages((prev) => [
        ...prev,
        { id: `result-${Date.now()}`, role: "assistant", content: resultContent, isSystem: true }
      ]);
      if (undoData) {
        setMessages((prev) => [
          ...prev,
          {
            id: `undo-${Date.now()}`,
            role: "assistant",
            isUndoAction: true,
            operationId: undoData.operationId,
            content: "Bạn có thể hoàn tác thao tác này trong vài phút."
          }
        ]);
      }
    } catch (error) {
      let errorMsg = "Không thể thực hiện thao tác. Vui lòng thử lại.";
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          errorMsg = JSON.parse(text).message || errorMsg;
        } catch { /* keep default */ }
      } else {
        errorMsg = error.response?.data?.message || error.message || errorMsg;
      }
      setMessages((prev) => [
        ...prev,
        { id: `result-error-${Date.now()}`, role: "assistant", content: `❌ ${errorMsg}`, isError: true }
      ]);
    } finally {
      setIsProcessingCrud(false);
      setPendingIntent(null);
    }
  };

  const handleCancelConfirmation = () => {
    setPendingIntent(null);
    setMessages((prev) => prev.map((m) => {
      if (m.isIntent) return { ...m, isConfirmation: true };
      return m;
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: `cancel-${Date.now()}`,
        role: "assistant",
        content: "Đã hủy thao tác.",
        isSystem: true
      }
    ]);
  };

  const handleUndo = async (operationId) => {
    try {
      await axiosConfig.post(`/ai/undo/${operationId}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `undo-result-${Date.now()}`,
          role: "assistant",
          content: "↩️ Đã hoàn tác thao tác thành công.",
          isSystem: true
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `undo-error-${Date.now()}`,
          role: "assistant",
          content: "❌ Không thể hoàn tác. Có thể đã quá thời gian cho phép.",
          isError: true
        }
      ]);
    }
  };

  const handleProviderSwitch = (provider) => {
    if (provider === selectedProvider) return;
    
    if (provider === "gemini" && isFreePlan) {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-error-${Date.now()}`,
          role: "assistant",
          content: "❌ Tính năng Agent của Nova Money (Tạo/sửa/xóa dữ liệu tự động) chỉ khả dụng cho gói BASIC trở lên. Vui lòng nâng cấp gói để sử dụng.",
          isError: true,
          provider
        }
      ]);
      return;
    }

    setProvider(provider);
  };

  const handleModelSwitch = (modelId) => {
    if (modelId === selectedModel) return;
    setSelectedModel(modelId);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(inputMessage);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div 
          className={`flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl shadow-slate-900/20 transition-all duration-300 ease-in-out ${
            isExpanded 
              ? "h-[85vh] w-[800px] max-w-[calc(100vw-2.5rem)]" 
              : "h-[min(38rem,80dvh)] w-[420px] max-w-[calc(100vw-1.5rem)]"
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 bg-linear-to-br from-amber-500 via-amber-400 to-yellow-500 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
                  N
                </div>
                <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-amber-400 bg-green-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold leading-tight">Nova Money - Trợ lý AI</h3>
                <p className="mt-0.5 text-xs text-white/75">
                  {user?.fullName ? `Chào ${user.fullName}` : "Xin chào"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
                aria-label={isExpanded ? "Thu nhỏ" : "Phóng to"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
                aria-label="Đóng hộp chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 dark:bg-[#0A0E1A] px-4 py-4">
            {/* Nova Money capabilities */}
            <details className="group rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-amber-900 dark:text-amber-300 select-none">
                <span className="text-base">✨</span> Nova Money có thể làm gì?
                <ChevronDown size={14} className="ml-auto transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-3 space-y-2 text-xs text-amber-800 dark:text-amber-400">
                <p className="font-medium text-amber-900 dark:text-amber-300">📊 Quản lý dữ liệu</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Tạo/Sửa/Xóa chi tiêu, thu nhập</li>
                  <li>Tạo/Sửa/Xóa danh mục</li>
                  <li>Tạo/Sửa/Xóa ngân sách</li>
                  <li>Tạo/Sửa/Xóa mục tiêu tiết kiệm</li>
                </ul>
                <p className="font-medium text-amber-900 dark:text-amber-300 pt-1">📁 Xuất báo cáo</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Xuất Excel chi tiêu / thu nhập</li>
                  <li>Gửi email báo cáo chi tiêu / thu nhập</li>
                </ul>
                <p className="font-medium text-amber-900 dark:text-amber-300 pt-1">💡 Hỗ trợ thông minh</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Tư vấn tài chính cá nhân</li>
                  <li>Phân tích tâm lý chi tiêu</li>
                  <li>Hỗ trợ cảm xúc về tiền bạc</li>
                  <li>Lập kế hoạch mục tiêu dài hạn</li>
                </ul>
              </div>
            </details>

            {/* Example command */}
            <div className="rounded-2xl border border-dashed border-amber-200 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-500/5 px-4 py-3 text-xs">
              <p className="font-medium text-amber-700 dark:text-amber-400 mb-2">💬 Thử gõ lệnh mẫu:</p>
              <button
                type="button"
                onClick={() => sendMessage("Tạo chi tiêu 50000đ ăn trưa hôm nay")}
                disabled={isSending}
                className="w-full text-left rounded-xl border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-white/5 px-3 py-2 text-amber-700 dark:text-amber-400 transition hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-60"
              >
                "Tạo chi tiêu 50000đ ăn trưa hôm nay"
              </button>
              <button
                type="button"
                onClick={() => sendMessage("Xuất báo cáo Excel chi tiêu tháng này")}
                disabled={isSending}
                className="mt-1.5 w-full text-left rounded-xl border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-white/5 px-3 py-2 text-amber-700 dark:text-amber-400 transition hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-60"
              >
                "Xuất báo cáo Excel chi tiêu tháng này"
              </button>
            </div>

            {/* Quick action chips */}
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => sendMessage(action.text)}
                  disabled={isSending}
                  className="rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 text-left text-xs font-medium text-amber-700 dark:text-amber-400 transition hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Message list */}
            {messages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                className={`flex ${chatMessage.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {chatMessage.role === "assistant" && (
                  <div className="mr-2 flex-shrink-0 pt-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400">
                      N
                    </div>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
                    chatMessage.role === "user"
                      ? "bg-amber-500 text-white"
                      : chatMessage.isError
                        ? "border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-900 dark:text-rose-300"
                        : chatMessage.isSystem
                          ? "border border-amber-100 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400"
                          : "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {/* Intent Confirmation Form */}
                  {chatMessage.isIntent && !chatMessage.isConfirmation && (
                    <AIConfirmationForm
                      intent={chatMessage.intent}
                      extractedFields={chatMessage.extractedFields}
                      suggestedValues={chatMessage.suggestedValues}
                      confirmationPrompt={chatMessage.confirmationPrompt}
                      onConfirm={handleConfirmAction}
                      onCancel={handleCancelConfirmation}
                      isProcessing={isProcessingCrud}
                    />
                  )}

                  {/* Confirmed intent */}
                  {chatMessage.isIntent && chatMessage.isConfirmation && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <span>{INTENT_ICONS[chatMessage.intent]}</span>
                        <span>{INTENT_LABELS[chatMessage.intent] || chatMessage.intent}</span>
                        <span className="text-green-600 dark:text-green-400">đã xác nhận</span>
                      </div>
                    </div>
                  )}

                  {/* Normal assistant message */}
                  {chatMessage.role === "assistant" && !chatMessage.isIntent && !chatMessage.isUndoAction && (
                    <div className="space-y-1.5 break-words">
                      {formatAssistantMessage(chatMessage.content).map((line, index) => (
                        <p key={`${chatMessage.id}-${index}`}>{line}</p>
                      ))}
                      {!chatMessage.isError && !chatMessage.isSystem && chatMessage.modelUsed && (
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          Nova Money · {chatMessage.modelLabel || (chatMessage.provider === "gemini" ? "Gemini 2.5 Flash" : "GPT-OSS 120B")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Undo button */}
                  {chatMessage.isUndoAction && (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400">{chatMessage.content}</p>
                      <button
                        type="button"
                        onClick={() => handleUndo(chatMessage.operationId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-100 dark:bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 transition hover:bg-amber-200 dark:hover:bg-amber-500/25"
                      >
                        <RotateCcw size={12} />
                        Hoàn tác
                      </button>
                    </div>
                  )}

                  {/* User message */}
                  {chatMessage.role === "user" && chatMessage.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isSending && (
              <div className="flex justify-start">
                <div className="mr-2 flex-shrink-0 pt-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400">
                    N
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-3">
            <label htmlFor="chat-message" className="sr-only">Nhập tin nhắn</label>

            {/* Model Selection Dropdown (chỉ hiển thị khi Agent mode) */}
            {selectedProvider === "gemini" && (
              <div className="mb-2" ref={modelDropdownRef}>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Chọn Model AI:
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setModelDropdownOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none transition hover:border-amber-400 dark:hover:border-amber-500"
                  >
                    <span className="flex items-center gap-2">
                      {MODEL_ICONS[selectedModel] || MODEL_ICONS["gemini-2.5-flash"]}
                      {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.label || "Gemini 2.5 Flash"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 dark:text-slate-500 transition-transform ${modelDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {modelDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-xl shadow-slate-900/10 dark:shadow-black/30 py-1">
                      {AVAILABLE_MODELS.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            handleModelSwitch(model.id);
                            setModelDropdownOpen(false);
                          }}
                          className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition cursor-pointer ${
                            model.id === selectedModel
                              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                            {MODEL_ICONS[model.id]}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{model.label}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {model.id === "gemini-2.5-flash"
                                ? "Nhanh, chính xác — Google AI"
                                : "Nhẹ, tiết kiệm — Google AI"}
                            </div>
                          </div>
                          {model.id === selectedModel && (
                            <span className="ml-auto text-amber-500">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                id="chat-message"
                value={inputMessage}
                onChange={(event) => setInputMessage(event.target.value)}
                placeholder={selectedProvider === "gemini"
                  ? `Nhập thao tác: tạo/sửa/xóa dữ liệu, xuất báo cáo... [${AVAILABLE_MODELS.find(m => m.id === selectedModel)?.label}]`
                  : "Nhập câu hỏi hoặc trò chuyện... [GPT-OSS 120B]"}
                rows={2}
                className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition focus:border-amber-400 dark:focus:border-amber-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
              />
              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-white/10"
                aria-label="Gửi tin nhắn"
              >
                <SendHorizontal size={18} />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="mt-2 flex rounded-xl bg-slate-100 dark:bg-white/5 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleProviderSwitch("gemini")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${
                  selectedProvider === "gemini"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                } ${isFreePlan ? "opacity-50" : ""}`}
              >
                <span>🤖</span>
                <span>Agent {isFreePlan && "🔒"}</span>
              </button>
              <button
                type="button"
                onClick={() => handleProviderSwitch("gptoss")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${
                  selectedProvider === "gptoss"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <span>💬</span>
                <span>Chat</span>
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 text-center">
              {selectedProvider === "gemini"
                ? `Agent: Tạo/sửa/xóa dữ liệu, xuất báo cáo · ${AVAILABLE_MODELS.find(m => m.id === selectedModel)?.label}`
                : "Chat: Hỏi đáp thông thường · GPT-OSS 120B"}
            </p>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 text-center">
              ⚠️ Nova Money là AI có thể trả lời sai sót, vui lòng kiểm tra lại thông tin.
            </p>
          </form>
        </div>
      )}

      {/* Floating toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="group relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/30 transition"
        aria-label={isOpen ? "Đóng trợ lý" : "Mở trợ lý"}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
          {isOpen ? <X size={20} /> : <MessageCircle size={22} />}
        </span>
      </button>
    </div>
  );
};

export default ChatWidget;
