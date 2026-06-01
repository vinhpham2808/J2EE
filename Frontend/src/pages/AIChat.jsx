import { useContext, useState, useEffect, useRef, useCallback } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { useRouteContext } from "../context/RouteContext.jsx";
import ChatSidebar from "../components/ChatSidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { useUser } from "../hooks/useUser.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import Dashboard from "../components/Dashboard.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { parseIntentResponse, isCrudIntent, isActionIntent, clientTelemetry, isExportEmailIntent } from "../util/aiIntentParser.js";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Zap, MessageSquare } from "lucide-react";
import aiIcon from "../assets/logo/AI_favicon.png";

const AGENT_MODEL_OPTIONS = [
  { value: "gemini", label: "Gemini 3.1 Flash-Lite", description: "Phản hồi nhanh, tiết kiệm", icon: "🤖" },
];

const buildHistory = (msgs) =>
  msgs
    .filter((m) => !m.isSystem && !m.isIntent && !m.isConfirmation)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-20);

const buildPersistedMessages = (msgs) =>
  msgs
    .filter((m) => !m.isSystem && !m.isIntent && !m.isConfirmation && !m.isUndoAction && !m.isError)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

const AIChat = () => {
  useUser();
  const { user } = useContext(AppContext);
  const { currentPage } = useRouteContext();
  const navigate = useNavigate();

  // Plan-based flags
  const isFreePlan  = !user?.subscriptionPlan || user?.subscriptionPlan === "FREE";
  const isPremiumPlan = user?.subscriptionPlan === "PREMIUM";

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const fetchSessionsTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Model / provider state
  const [selectedProvider, setProvider] = useState("gptoss");
  const [agentModel, setAgentModel] = useState("gemini");

  // Intent handling state
  const [isProcessingCrud, setIsProcessingCrud] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);

  // Sync model defaults when plan changes
  useEffect(() => {
    if (isPremiumPlan) {
      setAgentModel("gemini");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.subscriptionPlan]);

  // Sessions fetching
  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await axiosConfig.get(API_ENDPOINTS.AI_CHAT_SESSIONS);
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const debouncedFetchSessions = useCallback(() => {
    if (fetchSessionsTimerRef.current) clearTimeout(fetchSessionsTimerRef.current);
    fetchSessionsTimerRef.current = setTimeout(() => fetchSessions(), 2000);
  }, [fetchSessions]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Resolve active provider / model / label
  const resolveModel = () => {
    if (selectedProvider === "gemini") {
      // Agent mode — luôn dùng Gemini
      return {
        activeProvider: "gemini",
        activeModel: "gemini-3.1-flash-lite",
        activeModelLabel: "Gemini 3.1 Flash-Lite",
      };
    }
    // Chat mode — luôn dùng GPT-OSS
    return {
      activeProvider: "gptoss",
      activeModel: "gpt-oss-120b",
      activeModelLabel: "GPT-OSS 120B",
    };
  };

  const handleSendMessage = async (text, options = {}) => {
    const trimmedMessage = text.trim();
    const editMessageId = options?.editMessageId ?? null;
    if (!trimmedMessage || isSending) return;

    const editingMessageIndex = editMessageId
      ? messages.findIndex((message) => message.id === editMessageId)
      : -1;
    const isEditingExistingMessage = editingMessageIndex >= 0;

    if (pendingIntent && !isEditingExistingMessage) {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-warn-${Date.now()}`,
          role: "assistant",
          content: "⚠️ Vui lòng xác nhận hoặc hủy thao tác hiện tại trước khi gửi lệnh mới.",
          isSystem: true
        }
      ]);
      return;
    }

    setIsSending(true);

    const { activeProvider, activeModel, activeModelLabel } = resolveModel();
    const baseMessages = isEditingExistingMessage ? messages.slice(0, editingMessageIndex) : messages;

    const userMsg = { 
      id: `user-${Date.now()}`, 
      role: "user", 
      content: trimmedMessage,
      provider: activeProvider,
      model: activeModel,
      modelLabel: activeModelLabel,
      timestamp: new Date().toISOString() 
    };
    const updatedMessages = [...baseMessages, userMsg];
    setPendingIntent(null);
    setMessages(updatedMessages);

    try {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const conversationHistory = buildHistory(updatedMessages);
      const replaceEditedSessionHistory = async (sessionId, nextMessages) => {
        if (!isEditingExistingMessage || !sessionId) return;
        try {
          await axiosConfig.put(
            API_ENDPOINTS.AI_CHAT_REPLACE_MESSAGES(sessionId),
            { messages: buildPersistedMessages(nextMessages) },
            { _skipGlobalLoading: true }
          );
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `system-rewrite-failed-${Date.now()}`,
              role: "assistant",
              content: "Đã gửi lại nhưng chưa đồng bộ hoàn toàn lịch sử chat. Bạn tải lại phiên nếu thấy nội dung cũ.",
              isSystem: true
            }
          ]);
        }
      };

      if (selectedProvider === "gptoss") {
        const { data } = await axiosConfig.post(API_ENDPOINTS.AI_CHAT, {
          provider: activeProvider,
          model: activeModel,
          sessionId: activeSessionId,
          saveHistory: true,
          messages: conversationHistory,
        }, { signal, _skipGlobalLoading: true });

        const nextMessages = [...updatedMessages, {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp.",
          provider: data.provider || activeProvider,
          modelUsed: data.modelUsed,
          modelLabel: activeModelLabel,
          timestamp: new Date().toISOString(),
        }];
        setMessages(nextMessages);

        const resolvedSessionId = data.sessionId || activeSessionId;
        if (data.sessionId && !activeSessionId) {
          setActiveSessionId(data.sessionId);
        }
        await replaceEditedSessionHistory(resolvedSessionId, nextMessages);
        debouncedFetchSessions();
        setIsSending(false);
        return;
      }

      // Intent Parsing logic for Agent mode
      const intentResponse = await axiosConfig.post(API_ENDPOINTS.AI_PARSE_INTENT, {
        provider: activeProvider,
        model: activeModel,
        sessionId: activeSessionId,
        userMessage: trimmedMessage,
        pageContext: currentPage || "dashboard",
        conversationHistory
      }, { signal, _skipGlobalLoading: true });

      const parsed = parseIntentResponse(intentResponse.data);
      const resolvedSessionId = intentResponse.data?.sessionId || activeSessionId;

      if (intentResponse.data?.sessionId && !activeSessionId) {
        setActiveSessionId(intentResponse.data.sessionId);
      }

      // Telemetry: log missing fields on ACTION intents
      if (parsed.intentType === 'ACTION' && parsed.missingFields?.length > 0) {
        clientTelemetry.logMissingFields(parsed.intent, parsed.missingFields, currentPage);
      }

      if (isCrudIntent(parsed.intent) || isActionIntent(parsed.intent, parsed.intentType)) {
        // If action intent but missing required fields, still show confirmation form
        // (backend already populated missingFields — frontend should highlight them)
        setPendingIntent(parsed);
        const nextMessages = [
          ...updatedMessages,
          {
            id: `intent-${Date.now()}`,
            role: "assistant",
            isIntent: true,
            intent: parsed.intent,
            intentType: parsed.intentType,
            extractedFields: parsed.extractedFields,
            suggestedValues: parsed.suggestedValues,
            missingFields: parsed.missingFields,
            confirmationPrompt: parsed.confirmationPrompt
          }
        ];
        setMessages(nextMessages);
        await replaceEditedSessionHistory(resolvedSessionId, updatedMessages);
      } else if (parsed.intent === "ANSWER_QUESTION") {
        // Telemetry: if message looks like agent command but got ANSWER_QUESTION, log it
        const agentVerbPattern = /\b(thêm|tạo|ghi|nhập|xóa|bỏ|hủy|sửa|chỉnh|đổi|cập nhật|xuất|tải|chuyển|gửi mail|gửi email|gửi qua email|gửi qua mail|add|delete|remove|update|export|transfer)\b/i;
        if (agentVerbPattern.test(trimmedMessage)) {
          clientTelemetry.logAgentCommandFallback(trimmedMessage, currentPage);
        }
        const nextMessages = [
          ...updatedMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: parsed.answer || intentResponse.data?.reply || "Tôi đã nhận câu hỏi nhưng chưa tạo được câu trả lời phù hợp.",
            provider: activeProvider,
            modelUsed: intentResponse.data?.modelUsed,
            modelLabel: activeModelLabel
          }
        ];
        setMessages(nextMessages);
        await replaceEditedSessionHistory(resolvedSessionId, nextMessages);
      } else if (parsed.intent === "INVALID_REQUEST") {
        const nextMessages = [
          ...updatedMessages,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content: parsed.validationErrors?.[0] || "Yêu cầu không hợp lệ hoặc ngoài phạm vi hỗ trợ.",
            isError: true,
            provider: activeProvider
          }
        ];
        setMessages(nextMessages);
        await replaceEditedSessionHistory(resolvedSessionId, updatedMessages);
      } else {
        // Unrecognized intent — fall back to regular chat (only for genuine QUESTION-type intents)
        const { data } = await axiosConfig.post(API_ENDPOINTS.AI_CHAT, {
          provider: activeProvider,
          model: activeModel,
          sessionId: activeSessionId,
          saveHistory: true,
          messages: conversationHistory,
        }, { signal, _skipGlobalLoading: true });
        
        const nextMessages = [
          ...updatedMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp.",
            provider: data.provider || activeProvider,
            modelUsed: data.modelUsed,
            modelLabel: activeModelLabel
          }
        ];
        setMessages(nextMessages);
        
        const fallbackSessionId = data.sessionId || activeSessionId;
        if (data.sessionId && !activeSessionId) {
          setActiveSessionId(data.sessionId);
        }
        await replaceEditedSessionHistory(fallbackSessionId, nextMessages);
      }
      
      debouncedFetchSessions();
    } catch (error) {
      if (error.name === "CanceledError" || error.message === "canceled") {
        setMessages(prev => [...prev, {
          id: `assistant-canceled-${Date.now()}`,
          role: "assistant",
          content: "[Đã dừng phản hồi]",
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: error.response?.data?.message || "Hiện tại tôi chưa phản hồi được. Bạn thử lại sau giúp mình nhé.",
          timestamp: new Date().toISOString(),
          isError: true,
        }]);
      }
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const executeExportAction = async (intent) => {
    if (!isExportEmailIntent(intent)) {
      throw new Error(`executeExportAction khong ho tro intent: ${intent}`);
    }

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

      if (isExportEmailIntent(intent)) {
        resultContent = await executeExportAction(intent);
      } else {
        const { data } = await axiosConfig.post(API_ENDPOINTS.AI_CONFIRM_ACTION, {
          intent,
          sessionId: activeSessionId,
          extractedData: confirmedData
        });
        resultContent = `✅ ${data.message || "Thao tác thành công!"}`;
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
      debouncedFetchSessions();
    } finally {
      setIsProcessingCrud(false);
      setPendingIntent(null);
    }
  };

  const handleCancelConfirmation = () => {
    // Telemetry: log when user cancels (may indicate wrong parse)
    if (pendingIntent) {
      clientTelemetry.logConfirmationCancelled(pendingIntent.intent, pendingIntent.extractedFields);
    }
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
      await axiosConfig.post(API_ENDPOINTS.AI_UNDO(operationId));
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

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setPendingIntent(null);
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setShowMobileSidebar(false);
    setPendingIntent(null);
    axiosConfig.get(API_ENDPOINTS.AI_CHAT_MESSAGES(sessionId))
      .then(({ data }) => setMessages(data))
      .catch(() => setMessages([]));
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await axiosConfig.delete(API_ENDPOINTS.AI_CHAT_DELETE_SESSION(sessionId));
      if (activeSessionId === sessionId) handleNewChat();
      fetchSessions();
    } catch {
      // Non-blocking: keep the current session list if delete fails.
    }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      await axiosConfig.put(API_ENDPOINTS.AI_CHAT_RENAME_SESSION(sessionId), { title: newTitle });
      fetchSessions();
    } catch {
      // Non-blocking: keep the existing title if rename fails.
    }
  };

  // Model change handlers
  const handleProviderSwitch = (provider) => {
    if (provider === selectedProvider) return;
    if (provider === "gemini" && isFreePlan) {
      // silently block; user sees a locked Agent tab
      return;
    }
    setProvider(provider);
  };

  const handleAgentModelChange = (newModel) => {
    if (newModel === agentModel) return;
    if (!isPremiumPlan) return;
    setAgentModel(newModel);
  };

  if (isFreePlan) {
    return (
      <Dashboard activeMenu="Trợ lý AI">
        <div className="flex items-center justify-center min-h-[75vh] px-4 relative overflow-hidden">
          {/* Glow orb background */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-72 h-72 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 text-white rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden animate-fade-in-up">
            {/* Top Accent Gradient Border */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500" />
            
            <div className="text-center">
              {/* AI icon with animation */}
              <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-2xl
                bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-xl shadow-purple-500/20 overflow-hidden">
                <img src={aiIcon} alt="Nova Money AI" className="w-full h-full object-cover" />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              </div>

              {/* Badges */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                bg-purple-500/10 border border-purple-500/30 text-purple-300 mb-4 uppercase tracking-wider">
                <Sparkles size={12} className="text-amber-400" />
                Trợ lý Đặc quyền
              </div>

              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Nova Money — Trợ lý AI
              </h2>
              
              <p className="text-sm text-slate-300 mt-2 mb-6 leading-relaxed max-w-sm mx-auto">
                Tính năng Trợ lý AI đặc quyền chỉ khả dụng từ gói hội viên <span className="font-semibold text-purple-400">BASIC</span> và <span className="font-semibold text-purple-400">PREMIUM</span>.
              </p>

              {/* AI Features Grid */}
              <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4 md:p-5 text-left space-y-3.5 mb-7">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                    <MessageSquare size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Trò chuyện & Tư vấn Tài chính</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Tâm sự chi tiêu, nhận lời khuyên thông minh cho cuộc sống cá nhân.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Chế độ Agent đắc lực (Premium)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Tự động thêm, sửa, xoá giao dịch, quản lý hũ chi tiêu bằng ngôn ngữ tự nhiên.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Báo cáo & Phân tích thông minh</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Nhận gợi ý tiết kiệm thông minh cá nhân hóa giúp bạn tối ưu hóa dòng tiền.</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full sm:order-1 px-5 py-3 rounded-2xl text-sm font-medium
                    bg-slate-800 hover:bg-slate-700 active:scale-98 transition duration-150 text-slate-300 hover:text-white"
                >
                  Quay lại Trang chủ
                </button>
                <button
                  onClick={() => navigate("/payment")}
                  className="w-full sm:order-2 px-5 py-3 rounded-2xl text-sm font-bold text-white
                    bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:via-pink-500 hover:to-amber-400
                    shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150
                    flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap size={16} />
                  Nâng cấp ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dashboard>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#131314] text-slate-800 dark:text-slate-200 transition-colors duration-300 relative">
      <div className="pointer-events-none absolute inset-0 dark:block hidden overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.15]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 70% 70%, #a855f7 0%, transparent 55%), radial-gradient(circle at 50% 50%, #6366f1 0%, transparent 60%)",
          }}
        />
      </div>

      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isLoading={isLoadingSessions}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        showMobile={showMobileSidebar}
        onCloseMobile={() => setShowMobileSidebar(false)}
      />

      <ChatWindow
        key={activeSessionId || "new-chat"}
        messages={messages}
        isSending={isSending}
        onSendMessage={handleSendMessage}
        userName={user?.fullName}
        messagesEndRef={messagesEndRef}
        onToggleSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
        onStopGenerating={handleStopGenerating}
        /* Model selector props */
        selectedProvider={selectedProvider}
        agentModel={agentModel}
        agentModelOptions={AGENT_MODEL_OPTIONS}
        plan={user?.subscriptionPlan || "FREE"}
        isFreePlan={isFreePlan}
        onProviderSwitch={handleProviderSwitch}
        onAgentModelChange={handleAgentModelChange}
        /* Intent handling props */
        onConfirmAction={handleConfirmAction}
        onCancelConfirmation={handleCancelConfirmation}
        onUndo={handleUndo}
        isProcessingCrud={isProcessingCrud}
      />

    </div>
  );
};

export default AIChat;
