import { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext.jsx";
import axiosConfig from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints";
import {
  Pencil,
  Search,
  Trash2,
  Check,
  X,
  Settings,
  Sparkles,
  MessageSquare,
  User,
  LogOut,
  Sun,
  Moon,
  ArrowLeft
} from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import favicon from "../assets/logo/AI_favicon.png";

const groupSessions = (sessions) => {
  const now = new Date();
  const today = [];
  const yesterday = [];
  const last7 = [];
  const last30 = [];

  sessions.forEach(s => {
    const d = new Date(s.updatedAt);
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) today.push(s);
    else if (diffDays === 1) yesterday.push(s);
    else if (diffDays <= 7) last7.push(s);
    else last30.push(s);
  });

  const groups = [];
  if (today.length) groups.push({ label: "Hôm nay", items: today });
  if (yesterday.length) groups.push({ label: "Hôm qua", items: yesterday });
  if (last7.length) groups.push({ label: "7 ngày trước", items: last7 });
  if (last30.length) groups.push({ label: "Gần đây", items: last30 });
  return groups;
};

const ChatSidebar = ({
  sessions,
  activeSessionId,
  isLoading,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  showMobile,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const { user, clearUser } = useContext(AppContext);
  const { theme, toggleTheme } = useTheme();

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axiosConfig.post(API_ENDPOINTS.LOGOUT);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearUser();
      navigate("/login");
    }
  };

  const filteredSessions = searchQuery.trim()
    ? sessions.filter(s => s.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : sessions;

  const grouped = groupSessions(filteredSessions);

  const startRename = (session) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const confirmRename = () => {
    if (editTitle.trim() && editingId) {
      onRenameSession(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleDelete = (sessionId) => {
    onDeleteSession(sessionId);
    setConfirmDelete(null);
  };

  const userName = user?.fullName || "Người dùng";
  const userPlan = user?.subscriptionPlan || "FREE";
  const userInitial = (userName || "U").charAt(0).toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* New chat button */}
      <div className="p-3 pt-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-full
            bg-slate-100 dark:bg-[#1a1b1c]
            hover:bg-slate-200 dark:hover:bg-white/10
            text-sm font-medium text-slate-700 dark:text-slate-200
            transition-all duration-200 group"
        >
          <span className="flex items-center gap-3">
            <Pencil size={18} className="text-slate-500 dark:text-slate-400" />
            Cuộc trò chuyện mới
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 mt-2 mb-2">
        <div className="relative group">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100/50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/8
              border border-slate-200 dark:border-white/10
              text-[14px] text-slate-800 dark:text-[#e3e3e3]
              rounded-full py-2.5 pl-[42px] pr-10 outline-none transition-all duration-300
              placeholder-slate-400 dark:placeholder-slate-500 font-medium
              focus:bg-white dark:focus:bg-slate-900/60 focus:border-violet-500 dark:focus:border-amber-500
              focus:ring-1 focus:ring-violet-500/20 dark:focus:ring-amber-500/20
              focus:shadow-[0_0_15px_rgba(139,92,246,0.1)] dark:focus:shadow-[0_0_15px_rgba(245,158,11,0.1)]"
          />
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 dark:group-focus-within:text-amber-500 transition-colors pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors active:scale-90"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 mt-4 space-y-5"
        style={{ scrollbarWidth: "thin" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 dark:text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin mr-2" />
            Đang tải...
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500 text-sm px-4 text-center">
            {searchQuery ? (
              <>
                <Search size={24} className="mb-2 opacity-40" />
                Không tìm thấy cuộc trò chuyện nào
              </>
            ) : (
              <>
                <MessageSquare size={24} className="mb-2 opacity-40" />
                Chưa có cuộc trò chuyện nào
              </>
            )}
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="sticky top-0 bg-slate-50/90 dark:bg-[#1e1f20]/90 backdrop-blur-sm z-10 py-1">
                <h3 className="text-[13px] font-medium text-slate-500 dark:text-[#c4c7c5] px-4">
                  {group.label}
                </h3>
              </div>
              <div className="space-y-0.5 mt-1">
                {group.items.map((session) => (
                  <div key={session.id} className="group relative">
                    {editingId === session.id ? (
                      <div className="flex items-center gap-1 px-2 py-1.5 mx-2">
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.isComposing) confirmRename();
                            if (e.key === "Escape") cancelRename();
                          }}
                          className="flex-1 bg-slate-200 dark:bg-white/10 rounded-full px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200
                            border-none focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                        <button onClick={confirmRename} className="p-1.5 text-green-600 dark:text-green-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelRename} className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => onSelectSession(session.id)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer
                          text-[14px] transition-all duration-150 mx-2
                          ${activeSessionId === session.id
                            ? "bg-slate-200 dark:bg-[#282a2c] text-slate-900 dark:text-[#e3e3e3]"
                            : "text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c]/50"}`}
                      >
                        <MessageSquare size={16} className="shrink-0 opacity-50" />
                        <span className="flex-1 truncate">{session.title}</span>

                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); startRename(session); }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(session.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* User profile footer */}
      <div className="p-3 relative mt-auto border-t border-slate-100 dark:border-white/5" ref={menuRef}>
        <div
          onClick={() => setShowMenu((s) => !s)}
          className={`flex items-center gap-3 px-3 py-2 rounded-full transition-colors cursor-pointer ${
            showMenu ? "bg-slate-200 dark:bg-white/10" : "hover:bg-slate-100 dark:hover:bg-white/5"
          }`}
        >
          <div className="relative shrink-0">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-white/10" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{userInitial}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-700 dark:text-[#e3e3e3] truncate">{userName}</p>
            <span className={`text-[11px] font-medium tracking-wide ${
              userPlan === "PREMIUM" ? "text-amber-500 dark:text-amber-400" : userPlan === "BASIC" ? "text-violet-500 dark:text-violet-400 font-semibold" : "text-slate-400 dark:text-[#c4c7c5]"
            }`}>
              {userPlan === "PREMIUM" ? "Premium" : userPlan === "BASIC" ? "Basic" : "Free"}
            </span>
          </div>

          <Settings size={16} className={`text-slate-400 transition-transform duration-300 ${showMenu ? "rotate-90" : ""}`} />
        </div>

        {showMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2.5 mx-0 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
            <button
              onClick={() => { setShowMenu(false); navigate("/profile"); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
            >
              <User size={16} className="text-slate-400" />
              Hồ sơ của tôi
            </button>

            <div className="border-t border-slate-100 dark:border-white/5" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTheme();
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
            >
              <span className="flex items-center gap-3">
                {theme === "dark" ? <Sun size={16} className="text-slate-400" /> : <Moon size={16} className="text-slate-400" />}
                Chế độ {theme === "dark" ? "Sáng" : "Tối"}
              </span>
            </button>

            <div className="border-t border-slate-100 dark:border-white/5" />

            {userPlan !== "PREMIUM" && (
              <>
                <button
                  onClick={() => { setShowMenu(false); navigate("/payment"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                >
                  <Sparkles size={16} className="shrink-0" />
                  Nâng cấp Premium
                </button>
                <div className="border-t border-slate-100 dark:border-white/5" />
              </>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {showMobile && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onCloseMobile}
        >
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-[#282a2c] rounded-[24px] p-6 mx-4 shadow-2xl max-w-[480px] w-full">
            <p className="text-[22px] text-slate-900 dark:text-[#e3e3e3] font-normal mb-3">Bạn muốn xoá cuộc trò chuyện?</p>
            <p className="text-[14px] text-slate-600 dark:text-[#c4c7c5] mb-6 leading-relaxed">
              Thao tác này sẽ xoá toàn bộ tin nhắn, câu trả lời và nội dung trao đổi khỏi lịch sử trò chuyện của bạn với trợ lý Nova Money. Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-6 py-2.5 rounded-full text-[14px] font-medium text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-6 py-2.5 rounded-full text-[14px] font-medium text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64
        bg-slate-50 dark:bg-[#1e1f20] border-r border-slate-200 dark:border-none
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${showMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center justify-between px-5 py-4 mt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-transparent">
              <img src={favicon} alt="Logo" className="w-8 h-8 max-w-none object-cover scale-110 drop-shadow-sm" />
            </div>
            <span className="text-xl font-medium text-slate-800 dark:text-[#e3e3e3] tracking-tight">
              Nova Money
            </span>
          </div>
          {/* Mobile close button remains visible on small screens too */}
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 relative flex flex-col">
          {/* Dashboard button */}
          <div className="px-3 pt-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-full
                text-sm font-medium text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <ArrowLeft size={18} className="text-slate-500 dark:text-slate-400" />
              Quay lại Dashboard
            </button>
          </div>
          {sidebarContent}
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
