import { useContext, useState, useEffect, useRef, useCallback } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { useRouteContext } from "../context/RouteContext.jsx";
import ChatSidebar from "../components/ChatSidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { useUser } from "../hooks/useUser.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import Dashboard from "../components/Dashboard.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import {
  parseIntentResponse,
  isCrudIntent,
  isActionIntent,
  clientTelemetry,
  isExportEmailIntent,
  shouldPreferQuestionFlow,
  discriminateEmailReportIntent,
} from "../util/aiIntentParser.js";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Zap, MessageSquare } from "lucide-react";
import aiIcon from "../assets/logo/AI_favicon.png";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { useTranslation } from "../hooks/useTranslation.js";

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
  const { t } = useTranslation();
  usePageTitle(t("ai.pageTitle"));
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

  // Reset isSending khi Ã„â€˜Ã¡Â»â€¢i session hoÃ¡ÂºÂ·c unmount Ã¢â‚¬â€ trÃƒÂ¡nh spinner stuck
  useEffect(() => {
    setIsSending(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [activeSessionId]);

  // Model / provider state
  const [selectedProvider, setSelectedProvider] = useState("gptoss");

  // Intent handling state
  const [isProcessingCrud, setIsProcessingCrud] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);


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
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Resolve active provider / model / label
  const resolveModel = () => {
    if (selectedProvider === "gemini") {
      // Agent mode Ã¢â‚¬â€ luÃƒÂ´n dÃƒÂ¹ng Gemini
      return {
        activeProvider: "gemini",
        activeModel: "gemini-3.1-flash-lite",
        activeModelLabel: "Gemini 3.1 Flash-Lite",
      };
    }
    // Chat mode:
    // If PREMIUM: use GPT-OSS 120B
    // If BASIC: use Gemini 3.1 Flash-Lite
    if (isPremiumPlan) {
      return {
        activeProvider: "gptoss",
        activeModel: "gpt-oss-120b",
        activeModelLabel: "GPT-OSS 120B",
      };
    } else {
      return {
        activeProvider: "gemini",
        activeModel: "gemini-3.1-flash-lite",
        activeModelLabel: "Gemini 3.1 Flash-Lite",
      };
    }
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
      // Auto-cancel the pending intent and allow the new message to go through
      clientTelemetry.logConfirmationCancelled(pendingIntent.intent, pendingIntent.extractedFields);
      setPendingIntent(null);
      setMessages((prev) => prev.map((m) => {
        if (m.isIntent && !m.isConfirmation && !m.isCancelled) return { ...m, isCancelled: true };
        return m;
      }));
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
      const syncSessionHistory = async (sessionId, nextMessages) => {
        if (!sessionId) return;
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
              content: "Message resent but chat history may not be fully synced. Please reload the session if you see old content.",
              isSystem: true
            }
          ]);
        }
      };
      const replaceEditedSessionHistory = async (sessionId, nextMessages) => {
        if (!isEditingExistingMessage) return;
        await syncSessionHistory(sessionId, nextMessages);
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
          content: data.reply || "I received your question but could not generate a suitable response.",
          provider: data.provider || activeProvider,
          modelUsed: data.modelUsed,
          modelLabel: activeModelLabel,
          isGuarded: data.provider === "nova-guard",
          timestamp: new Date().toISOString(),
        }];
        setMessages(nextMessages);

        const resolvedSessionId = data.sessionId || activeSessionId;
        await replaceEditedSessionHistory(resolvedSessionId, nextMessages);
        if (data.sessionId && !activeSessionId) {
          setActiveSessionId(data.sessionId);
        }
        debouncedFetchSessions();
        // KhÃƒÂ´ng return sÃ¡Â»â€ºm Ã¢â‚¬â€ Ã„â€˜Ã¡Â»Æ’ finally xÃ¡Â»Â­ lÃƒÂ½ setIsSending(false) thÃ¡Â»â€˜ng nhÃ¡ÂºÂ¥t
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

      // BUG-07: If backend returned a generic email intent, override with keyword-based discrimination
      // to distinguish EMAIL_INCOME_REPORT from EMAIL_EXPENSE_REPORT more reliably.
      if (parsed.intent === "EMAIL_INCOME_REPORT" || parsed.intent === "EMAIL_EXPENSE_REPORT") {
        const discriminated = discriminateEmailReportIntent(trimmedMessage);
        if (discriminated && discriminated !== parsed.intent) {
          parsed.intent = discriminated;
        }
      }

      // Telemetry: log missing fields on ACTION intents
      if (parsed.intentType === 'ACTION' && parsed.missingFields?.length > 0) {
        clientTelemetry.logMissingFields(parsed.intent, parsed.missingFields, currentPage);
      }

      if (shouldPreferQuestionFlow(parsed.intent, parsed.intentType, trimmedMessage)) {
        clientTelemetry.logQuestionFallbackOverride(parsed.intent, trimmedMessage, currentPage);
        const { data } = await axiosConfig.post(API_ENDPOINTS.AI_CHAT, {
          provider: activeProvider,
          model: activeModel,
          sessionId: resolvedSessionId,
          saveHistory: true,
          messages: conversationHistory,
        }, { signal, _skipGlobalLoading: true });

        const nextMessages = [
          ...updatedMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply || "I received your question but could not generate a suitable response.",
            provider: data.provider || activeProvider,
            modelUsed: data.modelUsed,
            modelLabel: activeModelLabel,
            isGuarded: data.provider === "nova-guard"
          }
        ];
        setMessages(nextMessages);

        const fallbackSessionId = data.sessionId || resolvedSessionId || activeSessionId;
        await syncSessionHistory(fallbackSessionId, nextMessages);
        if (intentResponse.data?.sessionId && !activeSessionId) {
          setActiveSessionId(intentResponse.data.sessionId);
        }
      } else if (isCrudIntent(parsed.intent) || isActionIntent(parsed.intent, parsed.intentType)) {
        // If action intent but missing required fields, still show confirmation form
        // (backend already populated missingFields Ã¢â‚¬â€ frontend should highlight them)
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
        if (intentResponse.data?.sessionId && !activeSessionId) {
          setActiveSessionId(intentResponse.data.sessionId);
        }
      } else if (parsed.intent === "ANSWER_QUESTION") {
        // Telemetry: if message looks like agent command but got ANSWER_QUESTION, log it
        const agentVerbPattern = /\b(them|tao|ghi|nhap|xoa|bo|huy|sua|chinh|doi|cap nhat|xuat|tai|chuyen|gui mail|gui email|gui qua email|gui qua mail|add|delete|remove|update|export|transfer)\b/i;
        if (agentVerbPattern.test(trimmedMessage)) {
          clientTelemetry.logAgentCommandFallback(trimmedMessage, currentPage);
        }
        const nextMessages = [
          ...updatedMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: parsed.answer || intentResponse.data?.reply || "I received your question but could not generate a suitable response.",
            provider: intentResponse.data?.provider || activeProvider,
            modelUsed: intentResponse.data?.modelUsed,
            modelLabel: activeModelLabel,
            isGuarded: intentResponse.data?.provider === "nova-guard"
          }
        ];
        setMessages(nextMessages);
        await replaceEditedSessionHistory(resolvedSessionId, nextMessages);
        if (intentResponse.data?.sessionId && !activeSessionId) {
          setActiveSessionId(intentResponse.data.sessionId);
        }
      } else if (parsed.intent === "INVALID_REQUEST") {
        const isGuardedResponse = intentResponse.data?.provider === "nova-guard";
        const nextMessages = [
          ...updatedMessages,
          {
            id: `${isGuardedResponse ? "assistant-guarded" : "assistant-error"}-${Date.now()}`,
            role: "assistant",
            content: parsed.answer || intentResponse.data?.reply || parsed.validationErrors?.[0] || "Request is invalid or outside the supported scope.",
            isError: !isGuardedResponse,
            isGuarded: isGuardedResponse,
            provider: intentResponse.data?.provider || activeProvider,
            modelUsed: intentResponse.data?.modelUsed,
            modelLabel: activeModelLabel
          }
        ];
        setMessages(nextMessages);
        await replaceEditedSessionHistory(resolvedSessionId, updatedMessages);
        if (intentResponse.data?.sessionId && !activeSessionId) {
          setActiveSessionId(intentResponse.data.sessionId);
        }
      } else {
        // Unrecognized intent Ã¢â‚¬â€ fall back to regular chat (only for genuine QUESTION-type intents)
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
            content: data.reply || "I received your question but could not generate a suitable response.",
            provider: data.provider || activeProvider,
            modelUsed: data.modelUsed,
            modelLabel: activeModelLabel,
            isGuarded: data.provider === "nova-guard"
          }
        ];
        setMessages(nextMessages);
        
        const fallbackSessionId = data.sessionId || resolvedSessionId || activeSessionId;
        await replaceEditedSessionHistory(fallbackSessionId, nextMessages);
        if (intentResponse.data?.sessionId && !activeSessionId) {
          setActiveSessionId(intentResponse.data.sessionId);
        } else if (data.sessionId && !activeSessionId) {
          setActiveSessionId(data.sessionId);
        }
      }
      
      debouncedFetchSessions();
    } catch (error) {
      if (error.name === "CanceledError" || error.message === "canceled") {
        setMessages(prev => [...prev, {
          id: `assistant-canceled-${Date.now()}`,
          role: "assistant",
          content: "[Response stopped]",
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: error.response?.data?.message || "I cannot respond at the moment. Please try again later.",
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
        ? "This month's income Excel report has been downloaded!"
        : "This month's expense Excel report has been downloaded!";
    }
    if (intent === "EMAIL_INCOME_REPORT" || intent === "EMAIL_EXPENSE_REPORT") {
      const endpoint = intent === "EMAIL_INCOME_REPORT"
        ? API_ENDPOINTS.EMAIL_INCOME
        : API_ENDPOINTS.EMAIL_EXPENSE;
      await axiosConfig.get(endpoint);
      return intent === "EMAIL_INCOME_REPORT"
        ? "This month's income report has been sent to your email!"
        : "This month's expense report has been sent to your email!";
    }
    throw new Error("Unable to determine action.");
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
        resultContent = data.message || "Operation successful!";
        if (data.undoable && data.operationId) undoData = data;
      }

      setMessages((prev) => prev.map((m) => m.isIntent ? { ...m, isConfirmation: true } : m));
      setMessages((prev) => [
        ...prev,
        { id: `result-${Date.now()}`, role: "assistant", content: resultContent, isAgentResult: true }
      ]);
      if (undoData) {
        setMessages((prev) => [
          ...prev,
          {
            id: `undo-${Date.now()}`,
            role: "assistant",
            isUndoAction: true,
            operationId: undoData.operationId,
            content: "You can undo this action in a few minutes."
          }
        ]);
      }
    } catch (error) {
      let errorMsg = "Unable to perform the operation. Please try again.";
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
        { id: `result-error-${Date.now()}`, role: "assistant", content: `Error: ${errorMsg}`, isError: true }
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
    // Mark intent message as isCancelled (distinct from isConfirmation which means confirmed)
    setMessages((prev) => prev.map((m) => {
      if (m.isIntent && !m.isConfirmation && !m.isCancelled) return { ...m, isCancelled: true };
      return m;
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: `cancel-${Date.now()}`,
        role: "assistant",
        content: "Action cancelled.",
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
          content: "Action successfully undone.",
          isSystem: true
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `undo-error-${Date.now()}`,
          role: "assistant",
          content: "Cannot undo. The allowed time may have expired.",
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
    setMessages([]);
    axiosConfig.get(API_ENDPOINTS.AI_CHAT_MESSAGES(sessionId))
      .then(({ data }) => setMessages(Array.isArray(data) ? data : []))
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
    setSelectedProvider(provider);
  };


  if (isFreePlan) {
    return (
      <Dashboard activeMenu={t("nav.sidebar.aiChat")}>
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
                {t("ai.privilegedBadge")}
              </div>

              <h2 className="text-2xl font-extrabold text-white leading-tight">
                {"Nova Money - " + t("ai.pageTitle")}
              </h2>
              
              <p className="text-sm text-slate-300 mt-2 mb-6 leading-relaxed max-w-sm mx-auto">
                {t("ai.upgradeNotice")}<span className="font-semibold text-purple-400">BASIC</span>{t("ai.upgradeNoticeSuffix")}<span className="font-semibold text-purple-400">PREMIUM</span>{"."}
              </p>

              {/* AI Features Grid */}
              <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4 md:p-5 text-left space-y-3.5 mb-7">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                    <MessageSquare size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{"Trò chuyện & Tư vấn tài chính"}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{"Tóm tắt chi tiêu và nhận lời khuyên thông minh được cá nhân hóa."}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{"Chế độ Agent mạnh mẽ (Premium)"}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{"Tự động thêm, sửa và xóa giao dịch bằng ngôn ngữ tự nhiên."}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{"Báo cáo & Phân tích thông minh"}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{"Nhận các đề xuất tiết kiệm thông minh, cá nhân hóa để tối ưu hóa dòng tiền."}</p>
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
                  {t("ai.backHome")}
                </button>
                <button
                  onClick={() => navigate("/payment")}
                  className="w-full sm:order-2 px-5 py-3 rounded-2xl text-sm font-bold text-white
                    bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:via-pink-500 hover:to-amber-400
                    shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150
                    flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap size={16} />
                  {t("ai.upgradeNow")}
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
        selectedProvider={selectedProvider}
        isFreePlan={isFreePlan}
        isProcessingCrud={isProcessingCrud}
        onProviderSwitch={handleProviderSwitch}
        onConfirmAction={handleConfirmAction}
        onCancelConfirmation={handleCancelConfirmation}
        onUndo={handleUndo}
      />

    </div>
  );
};

export default AIChat;
