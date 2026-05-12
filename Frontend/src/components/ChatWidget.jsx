import { useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, SendHorizontal, Sparkles, X } from "lucide-react";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { AppContext } from "../context/AppContext.jsx";

const SPENDING_TIPS_LABEL = "💡 Gợi ý tiết kiệm cho tôi";

const QUICK_PROMPTS = [
  "Hãy giới thiệu ngắn gọn về chức năng của bạn",
  "Gợi ý cách quản lý chi tiêu hiệu quả",
  "Tôi nên bắt đầu theo dõi tài chính cá nhân từ đâu?"
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

const ChatWidget = () => {
  const { user } = useContext(AppContext);
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "assistant-welcome",
      role: "assistant",
      content: "Xin chào. Tôi là trợ lý AI của Money Manager, có thể trò chuyện và hỗ trợ bạn về quản lý chi tiêu."
    }
  ]);

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const shouldHideWidget = !token || PUBLIC_PATHS.has(location.pathname);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  if (shouldHideWidget) return null;

  const sendMessage = async (promptText) => {
    const trimmedMessage = promptText.trim();
    if (!trimmedMessage || isSending) return;

    const userMessage = { id: `user-${Date.now()}`, role: "user", content: trimmedMessage };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsSending(true);

    try {
      const response = await axiosConfig.post(API_ENDPOINTS.GEMINI_CHAT, { message: trimmedMessage });
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.data?.reply || "Tôi đã nhận câu hỏi nhưng hiện chưa tạo được câu trả lời phù hợp."
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: error.response?.data?.message || "Hiện tại tôi chưa phản hồi được. Bạn thử lại sau giúp mình nhé.",
          isError: true
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const sendSpendingTips = async () => {
    if (isSending) return;

    const userMessage = { id: `user-${Date.now()}`, role: "user", content: SPENDING_TIPS_LABEL };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await axiosConfig.post(API_ENDPOINTS.GEMINI_SPENDING_TIPS);
      const data = response.data;
      const tips = data?.tips || [];
      const disclaimer = data?.disclaimer || "";

      const content = tips.length > 0
        ? tips.map((tip) => `💰 ${tip}`).join("\n") + (disclaimer ? "\n\n" + disclaimer : "")
        : "Tôi chưa có đủ dữ liệu chi tiêu để đưa ra gợi ý. Hãy thêm transaction trước nhé!";

      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: "assistant", content }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: error.response?.data?.message || "Hiện tại tôi chưa phản hồi được. Bạn thử lại sau giúp mình nhé.",
          isError: true
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(message);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex h-[min(32rem,80dvh)] w-88 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl shadow-slate-900/20">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 bg-linear-to-br from-amber-500 via-amber-400 to-yellow-500 px-5 py-4 text-white">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/80">
                <Sparkles size={16} />
                Trợ lý AI
              </div>
              <h3 className="mt-2 text-lg font-semibold">
                {user?.fullName ? `Chào ${user.fullName}` : "Xin chào"}
              </h3>
              <p className="mt-1 text-sm text-white/85">
                Hỏi về quản lý chi tiêu, tiết kiệm và cách sử dụng Money Manager.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
              aria-label="Đóng hộp chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 dark:bg-[#0A0E1A] px-4 py-4">
            <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-300">
              Bạn có thể bắt đầu bằng một trong các gợi ý bên dưới hoặc nhập câu hỏi của riêng mình.
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sendSpendingTips}
                disabled={isSending}
                className="rounded-full border border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-left text-xs font-semibold text-amber-700 dark:text-amber-400 transition hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {SPENDING_TIPS_LABEL}
              </button>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={isSending}
                  className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:border-amber-300 dark:hover:border-amber-500/50 hover:text-amber-700 dark:hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {messages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                className={`flex ${chatMessage.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    chatMessage.role === "user"
                      ? "bg-slate-900 dark:bg-amber-500 text-white"
                      : chatMessage.isError
                        ? "border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-900 dark:text-rose-300"
                        : "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {chatMessage.role === "assistant" ? (
                    <div className="space-y-2 wrap-break-word">
                      {formatAssistantMessage(chatMessage.content).map((line, index) => (
                        <p key={`${chatMessage.id}-${index}`}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    chatMessage.content
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
                  Trợ lý đang trả lời...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-3">
            <label htmlFor="chat-message" className="sr-only">Nhập tin nhắn</label>
            <div className="flex items-end gap-2">
              <textarea
                id="chat-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                rows={2}
                className="min-h-13 flex-1 resize-none rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition focus:border-amber-400 dark:focus:border-amber-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
              />
              <button
                type="submit"
                disabled={isSending || !message.trim()}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-white/10"
                aria-label="Gửi tin nhắn"
              >
                <SendHorizontal size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

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
