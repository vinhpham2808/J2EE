import { useState, useEffect } from "react";
import Dashboard from "../components/Dashboard";
import { Bell, CheckCircle2, Filter, AlertCircle, TrendingUp, TrendingDown, Clock, ShieldCheck, Mail, FileBarChart, Target, Flame, ShieldAlert } from "lucide-react";
import axiosConfig from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints";
import toast from "react-hot-toast";
import { usePageTitle } from "../hooks/usePageTitle.js";

const Notifications = () => {
  usePageTitle("Thông báo");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL"); // ALL, UNREAD

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.GET_NOTIFICATIONS);
      if (res.status === 200) {
        setNotifications(res.data);
      }
    } catch (error) {
      toast.error("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await axiosConfig.put(API_ENDPOINTS.MARK_NOTIFICATION_READ(id));
      if (res.status === 200) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
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
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
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
        return <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500"><TrendingDown size={20} /></div>;
      case "INCOME": 
        return <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500"><TrendingUp size={20} /></div>;
      case "BUDGET_WARNING": 
        return <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-500"><AlertCircle size={20} /></div>;
      case "BUDGET_EXCEEDED": 
        return <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600"><AlertCircle size={20} /></div>;
      case "BUDGET_ALERT": 
        return <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600"><ShieldAlert size={20} /></div>;
      case "SPENDING_ALERT": 
        return <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500"><TrendingUp size={20} /></div>;
      case "GOAL_PROGRESS": 
        return <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Target size={20} /></div>;
      case "SAVING_STREAK": 
        return <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-500"><Flame size={20} /></div>;
      case "MONTHLY_REPORT": 
        return <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-500"><FileBarChart size={20} /></div>;
      case "PAYMENT": 
        return <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-500"><ShieldCheck size={20} /></div>;
      case "ADMIN": 
        return <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-500"><Mail size={20} /></div>;
      default: 
        return <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"><Bell size={20} /></div>;
    }
  };

  const filteredNotifications = notifications.filter(n => filter === "ALL" || (filter === "UNREAD" && !n.isRead));

  return (
    <Dashboard activeMenu="Thông báo">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="text-violet-500" />
              Thông báo của bạn
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cập nhật mọi biến động tài chính mới nhất</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-slate-100 dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-white/5">
              <button 
                onClick={() => setFilter("ALL")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === "ALL" ? "bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setFilter("UNREAD")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === "UNREAD" ? "bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
              >
                Chưa đọc
              </button>
            </div>
            
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2 bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2A3750] text-violet-600 dark:text-violet-400 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 border border-slate-200 dark:border-white/5"
            >
              <CheckCircle2 size={16} />
              Đã đọc tất cả
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-violet-600 animate-spin mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Đang tải thông báo...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                  className={`p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 transition-colors cursor-pointer group ${!notif.isRead ? 'bg-violet-50/50 dark:bg-violet-500/[0.03]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="shrink-0 mt-1">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div>
                      <h3 className={`text-base mb-1 ${!notif.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                        {notif.title}
                      </h3>
                      <p className={`text-sm leading-relaxed mb-3 ${!notif.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Clock size={14} />
                        {formatRelativeTime(notif.createdAt)}
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                        <span className="hidden sm:inline">{new Date(notif.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center sm:justify-end pl-14 sm:pl-0 shrink-0">
                    {!notif.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-4">
                <Bell size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Bạn đã đọc hết thông báo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Hiện tại không có thông báo mới nào. Hãy tiếp tục sử dụng Money Manager và chúng tôi sẽ cập nhật cho bạn.</p>
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  );
};

export default Notifications;
