import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CreditCard, Wallet, Activity, ArrowRight, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import axiosConfig from "../../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../../util/apiEndpoints.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const formatMoney = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, gradientClass }) => (
  <div className="relative group overflow-hidden bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
    {/* Background Decorative Elements */}
    <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 bg-gradient-to-br ${gradientClass} transition-transform duration-700 group-hover:scale-[2.5] ease-out`} />
    <div className={`absolute -left-8 -bottom-8 w-24 h-24 rounded-full opacity-5 bg-gradient-to-tr ${gradientClass} transition-transform duration-700 group-hover:scale-[2] ease-out`} />
    
    <div className="relative z-10 p-6 sm:p-8">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</h3>
          <div>
            <p className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="mt-2 text-sm font-medium text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                <TrendingUp size={16} />
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientClass} text-white shadow-lg shadow-${colorClass.split('-')[1]}-500/30 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  usePageTitle("Bảng điều khiển quản trị", "Money Manager Admin");
  const [overview, setOverview] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalPayments: 0,
    paidPayments: 0,
    systemStatus: "Online"
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [overviewResponse, paymentsResponse] = await Promise.all([
          axiosConfig.get(API_ENDPOINTS.ADMIN_OVERVIEW),
          axiosConfig.get(API_ENDPOINTS.ADMIN_PAYMENTS, {
            params: {
              status: "ALL",
              limit: 5
            }
          })
        ]);

        setOverview((prev) => ({ ...prev, ...(overviewResponse.data || {}) }));
        setRecentPayments(Array.isArray(paymentsResponse.data) ? paymentsResponse.data : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Không thể tải dữ liệu dashboard");
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 sm:p-10 shadow-2xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Chào mừng, Quản Trị Viên! 👋
            </h1>
            <p className="mt-2 text-blue-100 max-w-xl text-lg font-medium">
              Trung tâm kiểm soát Money Manager. Theo dõi người dùng, cấu hình hệ thống và quản lý doanh thu theo thời gian thực.
            </p>
            {error && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-white backdrop-blur-md border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng người dùng"
          value={overview.totalUsers?.toLocaleString("vi-VN") || "0"}
          subtitle="+12% tháng này"
          icon={Users}
          colorClass="text-blue-500"
          gradientClass="from-blue-500 to-cyan-400"
        />
        <StatCard
          title="Gói cước hoạt động"
          value={overview.activeSubscriptions?.toLocaleString("vi-VN") || "0"}
          subtitle="+5% tháng này"
          icon={Activity}
          colorClass="text-indigo-500"
          gradientClass="from-indigo-500 to-purple-500"
        />
        <StatCard
          title="Tổng doanh thu"
          value={overview.totalPayments?.toLocaleString("vi-VN") || "0"}
          icon={Wallet}
          colorClass="text-amber-500"
          gradientClass="from-amber-500 to-orange-400"
        />
        <StatCard
          title="Giao dịch thành công"
          value={overview.paidPayments?.toLocaleString("vi-VN") || "0"}
          icon={CreditCard}
          colorClass="text-emerald-500"
          gradientClass="from-emerald-500 to-teal-400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Giao dịch gần đây</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Các khoản thanh toán mới nhất từ người dùng</p>
            </div>
            <button
              onClick={() => navigate("/admin/payments")}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              Xem tất cả
              <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="flex-1 p-6 sm:p-8">
            {recentPayments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10">
                <div className="p-4 rounded-full bg-white dark:bg-[#0F172A] shadow-sm mb-4">
                  <Wallet size={32} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Chưa có giao dịch nào</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs">Giao dịch mới sẽ xuất hiện tại đây khi người dùng thanh toán.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => {
                  const isSuccess = payment.status === "PAID" || payment.status === "SUCCESS";
                  return (
                    <div 
                      key={payment.orderCode} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-500/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                          ${isSuccess ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                        >
                          {payment.payerEmail ? payment.payerEmail.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {payment.planName || payment.planId || "Gói cước"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{payment.payerEmail || "Ẩn danh"}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(payment.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-1 pl-16 sm:pl-0">
                        <p className="text-lg font-extrabold text-slate-800 dark:text-white">
                          {formatMoney(payment.amount)}
                        </p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase
                          ${isSuccess 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}
                        >
                          {payment.status || "PENDING"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 dark:border-white/5 sm:hidden">
            <button
              onClick={() => navigate("/admin/payments")}
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Xem tất cả giao dịch
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20">
                <Zap className="text-amber-400" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Quản lý Thanh toán</h3>
              <p className="text-indigo-200 text-sm mb-6 line-clamp-2">Theo dõi, kiểm tra và xác nhận các giao dịch thanh toán từ người dùng.</p>
              <button
                onClick={() => navigate("/admin/payments")}
                className="w-full py-3 px-4 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                Mở Quản lý
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-8 border border-slate-200/60 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl -mr-10 -mb-10 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-500/20">
                <ShieldCheck className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Cài đặt Hệ thống</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Cấu hình các tham số, tính năng và bảo mật cho ứng dụng của bạn.</p>
              <button
                onClick={() => navigate("/admin/settings")}
                className="w-full py-3 px-4 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10"
              >
                Tới Cài đặt
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
