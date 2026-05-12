import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosConfig from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints";
import toast from "react-hot-toast";

const NotificationDropdown = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.GET_UNREAD_COUNT);
      if (res.status === 200) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      console.error("Lỗi lấy số lượng thông báo chưa đọc", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.GET_NOTIFICATIONS);
      if (res.status === 200) {
        // Chỉ lấy top 5 để hiển thị trong dropdown
        setNotifications(res.data.slice(0, 5));
        
        // Tính lại số lượng chưa đọc dựa trên dữ liệu lấy về cho chắc
        const unread = res.data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách thông báo", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await axiosConfig.put(API_ENDPOINTS.MARK_NOTIFICATION_READ(id));
      if (res.status === 200) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái thông báo");
    }
  };

  const markAllAsRead = async (e) => {
    if (e) e.stopPropagation();
    try {
      const res = await axiosConfig.put(API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ);
      if (res.status === 200) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("Đã đánh dấu tất cả là đã đọc");
      }
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái thông báo");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    fetchUnreadCount();
    // Refresh count periodically
    const intervalId = setInterval(fetchUnreadCount, 30000); // 30s
    return () => clearInterval(intervalId);
  }, []);

  const handleToggleDropdown = () => {
    if (!showDropdown) {
      fetchNotifications();
    }
    setShowDropdown(!showDropdown);
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

  const getIconForType = (type) => {
    switch (type) {
      case "EXPENSE": return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
      case "INCOME": return <div className="w-2 h-2 rounded-full bg-emerald-500"></div>;
      case "BUDGET_ALERT": return <div className="w-2 h-2 rounded-full bg-amber-600"></div>;
      case "BUDGET_WARNING": return <div className="w-2 h-2 rounded-full bg-amber-500"></div>;
      case "BUDGET_EXCEEDED": return <div className="w-2 h-2 rounded-full bg-red-600"></div>;
      case "SPENDING_ALERT": return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
      case "GOAL_PROGRESS": return <div className="w-2 h-2 rounded-full bg-emerald-500"></div>;
      case "SAVING_STREAK": return <div className="w-2 h-2 rounded-full bg-violet-500"></div>;
      case "MONTHLY_REPORT": return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      case "PAYMENT": return <div className="w-2 h-2 rounded-full bg-violet-500"></div>;
      case "ADMIN": return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      default: return <div className="w-2 h-2 rounded-full bg-slate-400"></div>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className="relative items-center justify-center w-9 h-9 rounded-xl flex
          bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15
          text-slate-500 dark:text-slate-400 transition-colors"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white dark:border-[#0F172A]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden
          bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 flex flex-col max-h-[500px]">
          
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-800 dark:text-white">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-8 flex justify-center items-center">
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-violet-600 animate-spin"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                      !notif.isRead ? "bg-slate-50/50 dark:bg-white/[0.02]" : ""
                    }`}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id);
                    }}
                  >
                    <div className="pt-1.5 shrink-0">
                      {getIconForType(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-1 line-clamp-2 ${!notif.isRead ? "font-semibold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <div className="shrink-0 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                  <Bell size={20} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Chưa có thông báo nào</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bạn đã cập nhật tất cả thông tin mới nhất.</p>
              </div>
            )}
          </div>

          <div className="p-2 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-[#1E293B]">
            <button
              onClick={() => {
                setShowDropdown(false);
                navigate("/notifications");
              }}
              className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              Xem tất cả <ArrowRight size={14} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
