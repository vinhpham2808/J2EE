import { useState, useEffect } from "react";
import Dashboard from "../components/Dashboard";
import { Bell, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Clock, ShieldCheck, Mail, FileBarChart, Target, Flame, ShieldAlert, Trash2, Sparkles } from "lucide-react";
import axiosConfig from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints";
import toast from "react-hot-toast";
import { usePageTitle } from "../hooks/usePageTitle.js";

const NOTIFICATION_TYPES = {
  ADMIN: {
    label: "Quản trị viên",
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-500/15"
  },
  SYSTEM: {
    label: "Hệ thống / Gói",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-500/15"
  },
  BUDGET_ALERT: {
    label: "Cảnh báo ngân sách",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/15"
  },
  BUDGET_WARNING: {
    label: "Cảnh báo ngân sách",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/15"
  },
  BUDGET_EXCEEDED: {
    label: "Cảnh báo ngân sách",
    color: "bg-red-50 text-red-650 dark:bg-red-500/20 dark:text-red-400 border-red-500/15"
  },
  SPENDING_ALERT: {
    label: "Cảnh báo chi tiêu",
    color: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-500/15"
  },
  PAYMENT: {
    label: "Thanh toán",
    color: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border-violet-500/15"
  },
  GOAL_PROGRESS: {
    label: "Mục tiêu",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/15"
  },
  EXPENSE: {
    label: "Chi tiêu",
    color: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-500/15"
  },
  INCOME: {
    label: "Thu nhập",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/15"
  },
  SAVING_STREAK: {
    label: "Tiết kiệm",
    color: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border-violet-500/15"
  },
  MONTHLY_REPORT: {
    label: "Báo cáo",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-500/15"
  }
};

const Notifications = () => {
  usePageTitle("Thông báo");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL"); // ALL, UNREAD
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // ALL, FINANCIAL, BUDGET, SYSTEM
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.GET_NOTIFICATIONS);
      if (res.status === 200) {
        setNotifications(res.data);
      }
    } catch {
      toast.error("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNewNotifications = (e) => {
      setNotifications(e.detail);
    };

    window.addEventListener("new-notifications", handleNewNotifications);
    return () => {
      window.removeEventListener("new-notifications", handleNewNotifications);
    };
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filter, categoryFilter]);

  const markAsRead = async (id) => {
    try {
      const res = await axiosConfig.put(API_ENDPOINTS.MARK_NOTIFICATION_READ(id));
      if (res.status === 200) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await axiosConfig.put(API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ);
      if (res.status === 200) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success("Đã đánh dấu tất cả là đã đọc");
      }
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài làm đánh dấu đã đọc
    try {
      const res = await axiosConfig.delete(API_ENDPOINTS.DELETE_NOTIFICATION(id));
      if (res.status === 200) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success("Đã xóa thông báo");
      }
    } catch {
      toast.error("Không thể xóa thông báo");
    }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const listIds = Array.from(selectedIds);
    try {
      const res = await axiosConfig.post(API_ENDPOINTS.DELETE_NOTIFICATIONS_BULK, listIds);
      if (res.status === 200) {
        setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
        setSelectedIds(new Set());
        toast.success(`Đã xóa ${listIds.length} thông báo đã chọn`);
      }
    } catch {
      toast.error("Không thể xóa các thông báo đã chọn");
    }
  };


  const formatRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    return `${diffDays} ngày trước`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "EXPENSE": 
        return <div className="w-10 h-10 rounded-full bg-red-155 dark:bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"><TrendingDown size={20} /></div>;
      case "INCOME": 
        return <div className="w-10 h-10 rounded-full bg-emerald-155 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><TrendingUp size={20} /></div>;
      case "BUDGET_WARNING": 
        return <div className="w-10 h-10 rounded-full bg-amber-155 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0"><AlertCircle size={20} /></div>;
      case "BUDGET_EXCEEDED": 
        return <div className="w-10 h-10 rounded-full bg-red-155 dark:bg-red-500/20 flex items-center justify-center text-red-655 shrink-0"><AlertCircle size={20} /></div>;
      case "BUDGET_ALERT": 
        return <div className="w-10 h-10 rounded-full bg-amber-155 dark:bg-amber-500/10 flex items-center justify-center text-amber-655 shrink-0"><ShieldAlert size={20} /></div>;
      case "SPENDING_ALERT": 
        return <div className="w-10 h-10 rounded-full bg-red-155 dark:bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"><TrendingDown size={20} /></div>;
      case "GOAL_PROGRESS": 
        return <div className="w-10 h-10 rounded-full bg-emerald-155 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><Target size={20} /></div>;
      case "SAVING_STREAK": 
        return <div className="w-10 h-10 rounded-full bg-violet-155 dark:bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0"><Flame size={20} /></div>;
      case "MONTHLY_REPORT": 
        return <div className="w-10 h-10 rounded-full bg-blue-155 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0"><FileBarChart size={20} /></div>;
      case "PAYMENT": 
        return <div className="w-10 h-10 rounded-full bg-violet-155 dark:bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0"><ShieldCheck size={20} /></div>;
      case "ADMIN": 
        return <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-650 shrink-0"><Mail size={20} /></div>;
      case "SYSTEM":
        return <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0"><Sparkles size={20} /></div>;
      default: 
        return <div className="w-10 h-10 rounded-full bg-slate-155 dark:bg-white/10 flex items-center justify-center text-slate-500 shrink-0"><Bell size={20} /></div>;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    // 1. Lọc theo trạng thái đọc
    const matchesRead = filter === "ALL" || (filter === "UNREAD" && !n.isRead);
    if (!matchesRead) return false;

    // 2. Lọc theo danh mục phân loại
    if (categoryFilter === "ALL") return true;
    if (categoryFilter === "FINANCIAL") {
      return ["EXPENSE", "INCOME", "SPENDING_ALERT"].includes(n.type);
    }
    if (categoryFilter === "BUDGET") {
      return ["BUDGET_WARNING", "BUDGET_EXCEEDED", "BUDGET_ALERT"].includes(n.type);
    }
    if (categoryFilter === "SYSTEM") {
      return !["EXPENSE", "INCOME", "SPENDING_ALERT", "BUDGET_WARNING", "BUDGET_EXCEEDED", "BUDGET_ALERT"].includes(n.type);
    }
    return true;
  });

  return (
    <Dashboard activeMenu="Thông báo">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 border border-violet-500/10">
                <Bell size={17} />
              </span>
              Thông báo của bạn
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pl-11">
              Cập nhật mọi biến động tài chính và cảnh báo tài khoản mới nhất
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 pl-11 md:pl-0">
            {/* Bộ lọc trạng thái Đọc/Chưa đọc */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-inner shrink-0">
              <button 
                onClick={() => setFilter("ALL")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${filter === "ALL" ? "bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setFilter("UNREAD")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${filter === "UNREAD" ? "bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                Chưa đọc
              </button>
            </div>
            
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2.5 bg-slate-50 dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-white/5 text-violet-600 dark:text-violet-400 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm cursor-pointer"
            >
              <CheckCircle2 size={14} />
              Đọc tất cả
            </button>
          </div>
        </div>

        {/* ── Tabs Phân loại thông báo ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          {[
            { id: "ALL", label: "Tất cả", icon: Bell },
            { id: "FINANCIAL", label: "Biến động số dư", icon: TrendingUp },
            { id: "BUDGET", label: "Ngân sách", icon: ShieldAlert },
            { id: "SYSTEM", label: "Hệ thống / Gói", icon: Sparkles },
          ].map((cat) => {
            const IconComp = cat.icon;
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20"
                    : "border-slate-200 dark:border-white/8 bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/12 hover:bg-slate-50 dark:hover:bg-white/3"
                }`}
              >
                <IconComp size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Danh sách thông báo ── */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/60 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[450px]">
          {loading ? (
            <div className="divide-y divide-slate-100 dark:divide-white/5 flex-1 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 sm:p-6 flex gap-4 relative">
                  {/* Left checkbox skeleton */}
                  <div className="shrink-0 flex items-start mt-1">
                    <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700/50" />
                  </div>

                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Icon placeholder */}
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700/50 shrink-0 mt-0.5" />
                    
                    <div className="flex-1 min-w-0">
                      {/* Title & Badge skeleton */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700/50 rounded" />
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700/50 rounded-full" />
                      </div>
                      {/* Body texts */}
                      <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700/50 rounded mb-2" />
                      <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700/50 rounded mb-3" />
                      {/* Date details */}
                      <div className="h-2.5 w-1/4 bg-slate-200 dark:bg-slate-700/50 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="flex flex-col flex-1 divide-y divide-slate-100 dark:divide-white/5">
              {/* Thanh chọn tất cả & Xóa hàng loạt */}
              <div className="px-5 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20 gap-4 flex-wrap border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    checked={filteredNotifications.length > 0 && selectedIds.size === filteredNotifications.length}
                    ref={el => {
                      if (el) {
                        el.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredNotifications.length;
                      }
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-350 dark:border-white/10 text-violet-650 focus:ring-violet-500/20 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-650 dark:text-slate-400 select-none">
                    {selectedIds.size > 0 ? `Đã chọn ${selectedIds.size} mục` : "Chọn tất cả"}
                  </span>
                </div>

                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    <button
                      onClick={handleDeleteSelected}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-650 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-red-200/50 dark:border-red-500/10 shadow-sm cursor-pointer"
                    >
                      <Trash2 size={13} />
                      Xóa đã chọn
                    </button>
                  </div>
                )}
              </div>

              {/* Danh sách thông báo */}
              <div className="divide-y divide-slate-100 dark:divide-white/5 flex-1">
                {filteredNotifications.map((notif) => {
                  const isSelected = selectedIds.has(notif.id);
                  return (
                    <div 
                      key={notif.id} 
                      onClick={() => !notif.isRead && markAsRead(notif.id)}
                      className={`p-5 sm:p-6 flex gap-4 transition-all duration-200 cursor-pointer group relative ${!notif.isRead ? 'bg-violet-500/[0.02] dark:bg-violet-500/[0.02]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.01]'} ${isSelected ? 'bg-violet-500/[0.04] dark:bg-violet-500/[0.04]' : ''}`}
                    >
                      {/* Đường chỉ đỏ/xanh biểu thị chưa đọc */}
                      <span className={`absolute left-0 top-0 h-full w-[3px] transition-colors ${!notif.isRead ? 'bg-violet-500' : 'bg-transparent'}`} />

                      {/* Checkbox chọn riêng lẻ */}
                      <div className="shrink-0 flex items-start mt-1" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelect(notif.id, e)}
                          className="w-4 h-4 rounded border-slate-350 dark:border-white/10 text-violet-650 focus:ring-violet-500/20 bg-transparent cursor-pointer"
                        />
                      </div>

                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="shrink-0 mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className={`text-sm mb-1 break-words pr-2 flex items-center gap-2 flex-wrap ${!notif.isRead ? 'font-extrabold text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-350'}`}>
                              {notif.title}
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${NOTIFICATION_TYPES[notif.type]?.color || "bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200/50 dark:border-white/10"}`}>
                                {NOTIFICATION_TYPES[notif.type]?.label || notif.type}
                              </span>
                            </h3>
                          </div>
                          <p className={`text-sm leading-relaxed mb-3 break-words ${!notif.isRead ? 'text-slate-600 dark:text-slate-300 font-semibold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                            <Clock size={11} />
                            {formatRelativeTime(notif.createdAt)}
                            <span>•</span>
                            <span>{new Date(notif.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Khu vực nút xóa và dấu chưa đọc */}
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 block group-hover:scale-0 transition-transform duration-200"></span>
                        )}
                        
                        <button 
                          onClick={(e) => handleDeleteNotification(e, notif.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 shrink-0 cursor-pointer"
                          title="Xóa thông báo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center px-4 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-4 border border-slate-200/50 dark:border-white/10 shadow-inner">
                <Bell size={26} className="text-slate-400" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-2">Hộp thư thông báo trống</h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm font-medium">
                {categoryFilter !== "ALL" 
                  ? "Không tìm thấy thông báo nào trong danh mục này." 
                  : "Hiện tại bạn không có thông báo mới nào từ Money Manager."}
              </p>
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  );
};

export default Notifications;
