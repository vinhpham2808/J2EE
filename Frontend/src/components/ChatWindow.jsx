import { useMemo, useRef, useState } from "react";
import { ArrowUp, MessageSquare, Sparkles, RotateCcw, Menu, Square, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import AIConfirmationForm from "./AIConfirmationForm.jsx";
import { INTENT_ICONS, INTENT_LABELS } from "../util/aiIntentParser.js";
import aiIcon from "../assets/logo/AI_favicon.png";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "br", "table", "thead", "tbody", "tr", "th", "td"],
};

const fixMarkdown = (content) => {
  if (!content) return "";
  return content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
};

const markdownComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-200">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-outside pl-5 space-y-1 my-2 text-slate-700 dark:text-slate-200 marker:text-violet-500 dark:marker:text-amber-500">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside pl-5 space-y-1 my-2 text-slate-700 dark:text-slate-200 marker:text-violet-500 dark:marker:text-amber-500">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-violet-700 dark:text-amber-400 bg-violet-50 dark:bg-amber-400/5 px-1 py-0.5 rounded transition-all">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-800 dark:text-slate-300">{children}</em>,
  code: ({ children, className }) =>
    className ? (
      <code className="font-mono text-xs text-slate-700 dark:text-slate-200">{children}</code>
    ) : (
      <code className="rounded bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 font-mono text-xs text-violet-600 dark:text-amber-300">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="rounded-xl bg-slate-100 dark:bg-white/10 p-3 my-2 overflow-x-auto border border-slate-200/50 dark:border-white/5">{children}</pre>
  ),
  h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5 text-violet-700 dark:text-amber-400 border-b border-slate-100 dark:border-white/[0.06] pb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-slate-800 dark:text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-slate-700 dark:text-slate-100">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-violet-500 dark:border-amber-400 pl-3.5 pr-2 py-1 my-2 bg-violet-50/30 dark:bg-amber-500/[0.02] rounded-r-lg text-slate-600 dark:text-slate-400 italic leading-relaxed">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-slate-100 dark:border-white/[0.06] shadow-sm">
      <table className="min-w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06]">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 tracking-wider">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-t border-slate-100 dark:border-white/[0.04] px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50/30 dark:hover:bg-white/[0.01] transition-colors">{children}</td>
  ),
};

const modelLabelMap = {
  "gpt-oss-120b": "GPT-OSS",
  "gemini-3.1-flash-lite": "Gemini 3.1 Flash-Lite",
};

const CHAT_MODE_CARDS = [
  {
    title: "📊 Phân tích tài chính",
    desc: "Phân tích và gợi ý cải thiện chi tiêu tháng này.",
    prompt: "Hãy phân tích tình hình tài chính tháng này của tôi và đưa ra lời khuyên cải thiện.",
  },
  {
    title: "💡 Gợi ý tiết kiệm",
    desc: "Tư vấn kế hoạch tiết kiệm chi tiêu hiệu quả.",
    prompt: "Làm thế nào để tôi có thể tiết kiệm chi tiêu hiệu quả hơn trong tháng này?",
  },
  {
    title: "📈 Báo cáo tuần qua",
    desc: "Tóm tắt nhanh dòng tiền tuần vừa rồi.",
    prompt: "Tóm tắt báo cáo chi tiêu và thu nhập của tôi trong tuần qua.",
  },
  {
    title: "🎯 Kế hoạch tài chính",
    desc: "Lập kế hoạch mục tiêu tài chính cá nhân.",
    prompt: "Giúp tôi lập kế hoạch tài chính để tiết kiệm được 50 triệu trong 6 tháng.",
  },
];

const AGENT_MODE_CARDS = [
  {
    title: "📝 Thêm nhanh chi tiêu",
    desc: "Nhập giao dịch bằng ngôn ngữ tự nhiên.",
    prompt: "Thêm chi tiêu ăn trưa cùng đồng nghiệp 75k danh mục Ăn uống hôm nay",
  },
  {
    title: "💰 Ghi thu nhập",
    desc: "Ghi nhanh khoản thu nhập vừa nhận.",
    prompt: "Thêm thu nhập lương tháng 15 triệu hôm nay",
  },
  {
    title: "📤 Xuất Excel chi tiêu",
    desc: "Tải xuống báo cáo chi tiêu tháng này.",
    prompt: "Xuất báo cáo chi tiêu tháng này ra file Excel",
  },
  {
    title: "📧 Gửi báo cáo qua email",
    desc: "Gửi báo cáo tháng này đến email của bạn.",
    prompt: "Gửi báo cáo chi tiêu tháng này qua email cho tôi",
  },
];

const AIActionBar = ({ onRetry, disabled, currentBranch, totalBranches, onPrevBranch, onNextBranch }) => (
  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Thử lại"
      >
        <RotateCcw size={14} />
      </button>
    </div>
    {totalBranches > 1 && (
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <button onClick={onPrevBranch} disabled={currentBranch === 0} className="hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30">
          <ChevronLeft size={14} />
        </button>
        <span>{currentBranch + 1} / {totalBranches}</span>
        <button onClick={onNextBranch} disabled={currentBranch === totalBranches - 1} className="hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30">
          <ChevronRight size={14} />
        </button>
      </div>
    )}
  </div>
);

const ChatWindow = ({
  messages,
  isSending,
  onSendMessage,
  userName,
  messagesEndRef,
  onToggleSidebar,
  selectedProvider,
  isFreePlan,
  onProviderSwitch,
  isProcessingCrud,
  onConfirmAction,
  onCancelConfirmation,
  onUndo,
  onStopGenerating,
}) => {
  const [input, setInput] = useState("");
  const [activeBranches, setActiveBranches] = useState({});
  const [editingTarget, setEditingTarget] = useState(null);
  const composerRef = useRef(null);
  const isComposingRef = useRef(false);

  const { visibleMessages } = useMemo(() => {
    const turns = [];
    for (const msg of messages) {
      if (msg.role === "user") {
        const lastTurn = turns[turns.length - 1];
        if (lastTurn && lastTurn.userMsg?.content === msg.content) {
          lastTurn.branches.push({ userMsg: msg, responses: [] });
        } else {
          turns.push({
            id: msg.id || `turn-${turns.length}`,
            userMsg: msg,
            branches: [{ userMsg: msg, responses: [] }]
          });
        }
      } else {
        const lastTurn = turns[turns.length - 1];
        if (lastTurn) {
          const lastBranch = lastTurn.branches[lastTurn.branches.length - 1];
          lastBranch.responses.push(msg);
        } else {
          turns.push({
            id: msg.id || `assistant-turn-${turns.length}`,
            userMsg: null,
            branches: [{ userMsg: null, responses: [msg] }]
          });
        }
      }
    }

    const visible = [];
    for (const turn of turns) {
      const activeIdx = activeBranches[turn.id] ?? (turn.branches.length - 1);
      const branch = turn.branches[activeIdx];
      
      if (branch.userMsg) {
        visible.push({ ...branch.userMsg, turnId: turn.id, isUser: true });
      }
      for (const res of branch.responses) {
        visible.push({ 
          ...res, 
          turnId: turn.id, 
          activeIdx, 
          totalBranches: turn.branches.length,
          isLastResponse: res === branch.responses[branch.responses.length - 1]
        });
      }
    }
    return { visibleMessages: visible };
  }, [messages, activeBranches]);

  const hasModelControls = !!onProviderSwitch;
  const suggestionCards = selectedProvider === "gemini" ? AGENT_MODE_CARDS : CHAT_MODE_CARDS;

  const cancelEditing = () => {
    setEditingTarget(null);
    setInput("");
    composerRef.current?.focus();
  };

  const startEditing = (message) => {
    if (isSending || !message?.id) return;
    setEditingTarget({ id: message.id, content: message.content });
    setInput(message.content);
    composerRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    onSendMessage(input, { editMessageId: editingTarget?.id ?? null });
    setInput("");
    setEditingTarget(null);
    // Force-clear the DOM value so pending IME commits cannot re-insert text
    if (composerRef.current) composerRef.current.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !isComposingRef.current) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCompositionStart = () => { isComposingRef.current = true; };
  const handleCompositionEnd  = () => { isComposingRef.current = false; };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#131314] relative overflow-hidden">
      {/* Header bar - Sticky Glassmorphic */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3.5 shrink-0 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 dark:border-white/[0.06] gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        {hasModelControls && (
          <div className="relative flex items-center rounded-full bg-slate-100/80 dark:bg-white/[0.06] p-0.5 text-xs font-medium border border-slate-200/60 dark:border-white/[0.08] shadow-sm">
            <button
              type="button"
              onClick={() => onProviderSwitch("gemini")}
              className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-all duration-200 ease-out cursor-pointer ${
                selectedProvider === "gemini"
                  ? "bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-amber-500 dark:to-orange-500 text-white shadow-sm shadow-violet-500/20 dark:shadow-amber-500/20 scale-[1.02]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
              } ${isFreePlan ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Sparkles size={12} className={selectedProvider === "gemini" ? "text-white" : ""} />
              <span className="tracking-wide">Agent{isFreePlan ? " 🔒" : ""}</span>
            </button>
            <button
              type="button"
              onClick={() => onProviderSwitch("gptoss")}
              className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-all duration-200 ease-out cursor-pointer ${
                selectedProvider === "gptoss"
                  ? "bg-slate-800 dark:bg-white/[0.14] text-white dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
              }`}
            >
              <MessageSquare size={12} className={selectedProvider === "gptoss" ? "text-white" : ""} />
              <span className="tracking-wide">Chat</span>
            </button>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 md:px-8 relative" style={{ scrollbarWidth: "thin" }}>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-full py-8 md:py-12 animate-fade-in-up max-w-2xl mx-auto text-center px-4 relative">
            {/* Subtle center gradient orb - dark mode only */}
            <div className="hidden dark:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-[100%] blur-[100px] opacity-30 pointer-events-none" style={{
              background: "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 70%)"
            }} />

            <div className="relative z-10 flex flex-col items-center">
              {/* Premium Hero Icon with bounce/float effect */}
              <div className="relative mb-6 p-4 rounded-3xl bg-gradient-to-tr from-violet-600/10 to-indigo-600/10 dark:from-violet-500/25 dark:to-indigo-500/25 border border-violet-500/20 dark:border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                <img src={aiIcon} alt="Nova Money AI" className="w-12 h-12 object-cover rounded-2xl" />
                <div className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-400 dark:bg-amber-500 text-white shadow-md">
                  <Sparkles size={11} className="animate-pulse" />
                </div>
              </div>

              {/* Title & Description */}
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-[#e3e3e3] dark:to-[#c4c7c5] tracking-tight leading-tight">
                Xin chào, {userName || "bạn mến"}!
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm md:text-base font-normal max-w-md leading-relaxed">
                Tôi là Trợ lý Tài chính Nova AI. Bạn cần tôi hỗ trợ phân tích chi tiêu hay cập nhật giao dịch gì hôm nay không?
              </p>
              
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-medium">
                {selectedProvider === "gemini"
                  ? "⚡ Gợi ý Agent - ra lệnh trực tiếp"
                  : "💬 Gợi ý Chat - hỏi & tư vấn"}
              </p>

              {/* Grid of Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-6 text-left">
                {suggestionCards.map((card, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setEditingTarget(null);
                      setInput(card.prompt);
                    }}
                    className="p-4 rounded-2xl text-left bg-slate-50/50 hover:bg-slate-100/80 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]
                      border border-slate-200/50 hover:border-violet-500/30 dark:border-white/[0.04] dark:hover:border-amber-500/30
                      transition-all duration-300 group shadow-sm hover:shadow-[0_4px_20px_rgba(139,92,246,0.06)] dark:hover:shadow-[0_4px_20px_rgba(245,158,11,0.06)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 transition-colors group-hover:text-violet-600 dark:group-hover:text-amber-400">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                      {card.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            {visibleMessages.map((msg, i) => (
              <div
                key={msg.id || `${msg.turnId || "msg"}-${i}`}
                className={`flex gap-3 md:gap-4 items-start ${msg.role === "user" ? "justify-end" : ""} animate-msg-appear`}
              >
                {msg.role !== "user" && (
                  <div className="w-8.5 h-8.5 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10 mt-1 shadow-sm">
                    <img src={aiIcon} alt="Nova Money" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={`text-sm leading-relaxed transition-all duration-300
                    ${msg.role === "user"
                      ? "bg-gradient-to-tr from-violet-600/90 via-violet-600 to-indigo-600/95 dark:from-amber-500/90 dark:via-amber-500 dark:to-orange-500/95 text-white rounded-[20px] rounded-tr-sm shadow-sm shadow-violet-500/5 dark:shadow-amber-500/5 px-4.5 py-2.5 max-w-[85%] sm:max-w-[75%]"
                      : msg.isError
                        ? "bg-red-50/60 dark:bg-red-500/5 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-500/10 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[90%] sm:max-w-[85%] shadow-sm"
                        : msg.isSystem
                          ? "bg-amber-50/60 dark:bg-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/10 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[90%] sm:max-w-[85%] shadow-sm"
                          : "bg-slate-50/40 dark:bg-white/[0.02] border border-slate-100/80 dark:border-white/[0.03] text-slate-700 dark:text-[#e3e3e3] rounded-2xl rounded-tl-sm px-5 py-4 max-w-[90%] sm:max-w-[85%] shadow-sm"}`}
                >
                  {msg.isIntent && !msg.isConfirmation && (
                    <AIConfirmationForm
                      intent={msg.intent || "UNKNOWN"}
                      extractedFields={msg.extractedFields || {}}
                      suggestedValues={msg.suggestedValues || {}}
                      confirmationPrompt={msg.confirmationPrompt}
                      onConfirm={onConfirmAction || (() => {})}
                      onCancel={onCancelConfirmation || (() => {})}
                      isProcessing={isProcessingCrud}
                    />
                  )}

                  {msg.isIntent && msg.isConfirmation && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400 font-medium">
                      <span>{INTENT_ICONS[msg.intent]}</span>
                      <span>{INTENT_LABELS[msg.intent] || msg.intent}</span>
                      <span className="text-green-500 dark:text-green-400">đã xác nhận</span>
                    </div>
                  )}

                  {msg.isUndoAction && (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-500 dark:text-amber-400 font-medium">{msg.content}</p>
                      {onUndo && (
                        <button
                          type="button"
                          onClick={() => onUndo(msg.operationId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 transition hover:bg-amber-100 dark:hover:bg-amber-500/25 cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          Hoàn tác
                        </button>
                      )}
                    </div>
                  )}

                  {msg.role === "assistant" && !msg.isIntent && !msg.isUndoAction && (
                    <>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                        components={markdownComponents}
                      >
                        {fixMarkdown(msg.content)}
                      </ReactMarkdown>
                      {!msg.isError && !msg.isSystem && msg.modelUsed && (
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-normal">
                          Nova Money · {modelLabelMap[msg.modelUsed] || msg.modelLabel || msg.modelUsed}
                        </span>
                      )}
                    </>
                  )}

                  {msg.role === "assistant" && !msg.isIntent && !msg.isUndoAction && !msg.isError && !msg.isSystem && !isSending && msg.isLastResponse && (
                    <AIActionBar
                      onRetry={() => {
                        const correspondingUserMsg = visibleMessages.find(m => m.turnId === msg.turnId && m.role === "user");
                        if (correspondingUserMsg) {
                          onSendMessage(correspondingUserMsg.content);
                        }
                      }}
                      disabled={isSending}
                      currentBranch={msg.activeIdx}
                      totalBranches={msg.totalBranches}
                      onPrevBranch={() => setActiveBranches(prev => ({ ...prev, [msg.turnId]: msg.activeIdx - 1 }))}
                      onNextBranch={() => setActiveBranches(prev => ({ ...prev, [msg.turnId]: msg.activeIdx + 1 }))}
                    />
                  )}

                  {msg.role === "user" && (
                    <>
                      <p className="font-normal">{msg.content}</p>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => startEditing(msg)}
                          disabled={isSending}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Pencil size={11} />
                          Sửa & gửi lại
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            ))}
            {isSending && (
              <div className="flex gap-3 md:gap-4 items-start animate-msg-appear">
                <div className="w-8.5 h-8.5 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10 mt-1 shadow-sm">
                  <img src={aiIcon} alt="Nova Money" className="w-full h-full object-cover" />
                </div>
                <div className="bg-slate-50/40 dark:bg-white/[0.02] border border-slate-100/80 dark:border-white/[0.03] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5 min-w-[72px]">
                  <span className="w-2 h-2 rounded-full bg-violet-500 dark:bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-violet-500 dark:bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-violet-500 dark:bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area - Sticky Blur with Dynamic glow button */}
      <div className="px-3 md:px-6 pb-5 pt-3 border-t border-slate-100 dark:border-white/[0.04] bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md sticky bottom-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {editingTarget && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-violet-200/70 bg-violet-50/80 px-4 py-2 text-xs text-violet-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <span>Đang sửa một tin nhắn cũ. Gửi đi sẽ tạo lại cuộc hội thoại từ đoạn này.</span>
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition hover:bg-violet-100 dark:hover:bg-amber-500/10"
              >
                <X size={12} />
                Hủy
              </button>
            </div>
          )}

          {/* Main input box - pill shape with gorgeous focus glows */}
          <div className="relative flex items-end gap-2 bg-slate-100/80 hover:bg-slate-100 dark:bg-[#1e1f20]/90 dark:hover:bg-[#1e1f20] rounded-[28px]
            focus-within:bg-white dark:focus-within:bg-[#202124]
            border border-transparent focus-within:border-violet-500/40 dark:focus-within:border-amber-500/40
            focus-within:ring-4 focus-within:ring-violet-500/5 dark:focus-within:ring-amber-500/5
            focus-within:shadow-[0_0_25px_rgba(139,92,246,0.12)] dark:focus-within:shadow-[0_0_25px_rgba(245,158,11,0.12)]
            transition-all duration-300 pl-5 md:pl-6 pr-3.5 py-2.5 min-h-[54px] shadow-sm">

            <textarea
              ref={composerRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={editingTarget ? "Sửa nội dung rồi gửi lại..." : "Nhập câu hỏi hoặc yêu cầu Nova Money..."}
              rows={1}
              className="flex-1 bg-transparent text-[14px] md:text-[15px] text-slate-800 dark:text-[#e3e3e3] placeholder-slate-400 dark:placeholder-[#c4c7c5]
                resize-none outline-none py-2 max-h-[160px] leading-relaxed font-normal"
              style={{ scrollbarWidth: "thin" }}
            />

            <button
              type={isSending ? "button" : "submit"}
              onClick={isSending ? onStopGenerating : undefined}
              disabled={!input.trim() && !isSending}
              className={`p-2.5 rounded-full transition-all duration-300 shrink-0 cursor-pointer ${
                isSending
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : input.trim()
                    ? "bg-violet-600 dark:bg-amber-500 text-white hover:scale-105 hover:shadow-md hover:shadow-violet-600/20 dark:hover:shadow-amber-500/20"
                    : "text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5 opacity-50"
              }`}
            >
              {isSending ? <Square size={16} className="fill-current" /> : <ArrowUp size={16} className="stroke-[2.5]" />}
            </button>
          </div>



          <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center mt-2.5">
            Nova Money có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
