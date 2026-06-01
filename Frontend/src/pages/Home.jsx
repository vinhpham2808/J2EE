import Dashboard from "../components/Dashboard.jsx";
import { useUser } from "../hooks/useUser.jsx";
import InfoCard from "../components/InfoCard.jsx";
import {
  Coins, PiggyBank, Target, Wallet, WalletCards, Sparkles,
  ChevronDown, ChevronUp, TrendingUp, AlertTriangle, PieChart,
  Settings2, Lightbulb, X, Crown, CheckCircle2,
} from "lucide-react";
import { addThousandsSeparator } from "../util/util.js";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { AppContext } from "../context/AppContext.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import RecentTransactions from "../components/RecentTransactions.jsx";
import FinanceOverview from "../components/FinanceOverview.jsx";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import { useWidgetConfig } from "../hooks/useWidgetConfig.js";
import WidgetWrapper from "../components/dashboard/WidgetWrapper.jsx";
import WidgetSettingsPanel from "../components/dashboard/WidgetSettingsPanel.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../context/ThemeContext.jsx";

const Home = () => {
  useUser();
  const { theme } = useTheme();
  usePageTitle("Tổng quan");
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showDetailedInsight, setShowDetailedInsight] = useState(false);
  const [detailedInsight, setDetailedInsight] = useState(null);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { user } = useContext(AppContext);

  // Widget customization
  const { widgetConfig, sortedWidgetIds, toggleWidget, reorderWidgets, resetConfig } = useWidgetConfig(user?.id);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const chartData = useMemo(() => {
    if (!dashboardData?.monthlyHistory) return [];
    return dashboardData.monthlyHistory.map((item) => ({
      name: item.month,
      income: Number(item.income || 0),
      expense: Number(item.expense || 0),
    }));
  }, [dashboardData?.monthlyHistory]);

  const formatYAxis = useCallback((value) => {
    if (value === 0) return "0";
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (abs >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      if (over && active.id !== over.id) {
        const oldIdx = sortedWidgetIds.indexOf(active.id);
        const newIdx = sortedWidgetIds.indexOf(over.id);
        reorderWidgets(arrayMove(sortedWidgetIds, oldIdx, newIdx));
      }
    },
    [sortedWidgetIds, reorderWidgets]
  );

  const AI_INSIGHT_ENDPOINT = "/dashboard/ai-insight";
  const AI_DETAILED_INSIGHT_ENDPOINT = "/dashboard/ai-insight/detailed";

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.DASHBOARD_DATA);
      if (response.status === 200) setDashboardData(response.data);
    } catch (error) {
      console.error("Something went wrong while fetching dashboard data:", error);
      if (!error.response && error.request) {
        // Network connection error is already handled by useUser
        return;
      }
      toast.error("Không thể tải dữ liệu thống kê!", { id: "dashboard-data-error" });
    }
  }, []);

  const fetchAiInsight = useCallback(async () => {
    setAiLoading(true);
    try {
      const response = await axiosConfig.get(AI_INSIGHT_ENDPOINT, { _skipGlobalLoading: true });
      if (response.status === 200) {
        if (response.data.error) {
          setAiInsight(response.data.insight || "Đang cập nhật dữ liệu...");
        } else if (response.data.insight) {
          setAiInsight(response.data.insight);
        } else {
          setAiInsight("Chưa có dữ liệu để phân tích. Hãy thêm giao dịch đầu tiên!");
        }
      }
    } catch (error) {
      console.error("Something went wrong while fetching AI insight:", error);
      if (error.response?.status === 401) {
        setAiInsight("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
      } else if (error.response?.status === 400) {
        setAiInsight(error.response?.data?.message || "Dữ liệu không hợp lệ");
      } else {
        setAiInsight("Hệ thống AI đang bảo trì hoặc chưa có đủ dữ liệu, bạn quay lại sau nhé.");
      }
    } finally {
      setAiLoading(false);
    }
  }, []);

  const fetchDetailedInsight = async () => {
    if (detailedLoading) return;
    setDetailedLoading(true);
    try {
      const response = await axiosConfig.get(AI_DETAILED_INSIGHT_ENDPOINT, { _skipGlobalLoading: true });
      if (response.status === 200) {
        if (response.data.error) {
          toast.error(response.data.message || "Không thể tải phân tích chi tiết");
          setDetailedInsight(null);
        } else if (response.data.status === "insufficient_data") {
          toast.custom(() => (
            <div className="bg-amber-100 text-amber-800 p-4 rounded-xl shadow-lg max-w-md">
              <p className="font-semibold">⚠️ Chưa đủ dữ liệu</p>
              <p className="text-sm mt-1">{response.data.message || "Hãy thêm nhiều giao dịch hơn!"}</p>
            </div>
          ));
          setDetailedInsight(null);
        } else {
          setDetailedInsight(response.data);
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn!");
        setDetailedInsight(null);
      } else if (error.response?.status === 403) {
        toast.error("Bạn không có quyền truy cập tính năng này!");
        setDetailedInsight(null);
      } else {
        toast.error("Không thể tải phân tích chi tiết!");
        setDetailedInsight(null);
      }
    } finally {
      setDetailedLoading(false);
    }
  };

  const toggleDetailedInsight = () => {
    if (!showDetailedInsight) {
      if (user?.canUseDetailedAi === false) {
        setShowPremiumModal(true);
        return;
      }
      if (!detailedInsight && !detailedLoading) fetchDetailedInsight();
    }
    setShowDetailedInsight(!showDetailedInsight);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAiInsight();
  }, [fetchAiInsight, fetchDashboardData]);

  const formatCurrency = useCallback((amount) => {
    if (!amount && amount !== 0) return "0 VND";
    const num = typeof amount === "object" ? 0 : Number(amount);
    if (isNaN(num)) return "0 VND";
    return addThousandsSeparator(Math.floor(num)) + " VND";
  }, []);

  const formatCompact = useCallback((amount) => {
    if (!amount && amount !== 0) return "0 VND";
    const num = typeof amount === "object" ? 0 : Number(amount);
    if (isNaN(num)) return "0 VND";
    const abs = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    if (abs >= 1_000_000_000) {
      const val = (abs / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
      return `${sign}${val} tỷ VND`;
    }
    if (abs >= 1_000_000) {
      const val = (abs / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
      return `${sign}${val} tr VND`;
    }
    return `${sign}${addThousandsSeparator(Math.floor(abs))} VND`;
  }, []);

  const safeNumber = useCallback((value) => (!value && value !== 0 ? 0 : value), []);

  // ─── Widget Renderers ──────────────────────────────────────
  const WIDGET_RENDERERS = useMemo(
    () => ({
      kpi_cards: () => (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <InfoCard onClick={() => navigate("/income")} icon={<WalletCards size={22} />} label="Số dư" value={formatCompact(safeNumber(dashboardData?.totalBalance))} color="bg-blue-500/10 text-blue-400" />
          <InfoCard onClick={() => navigate("/income")} icon={<TrendingUp size={22} />} label="Thu nhập" value={formatCompact(safeNumber(dashboardData?.totalIncome))} color="bg-emerald-500/10 text-emerald-400" />
          <InfoCard onClick={() => navigate("/expense")} icon={<AlertTriangle size={22} />} label="Chi tiêu" value={formatCompact(safeNumber(dashboardData?.totalExpense))} color="bg-red-500/10 text-red-400" />
          <InfoCard onClick={() => navigate("/saving-goals")} icon={<Target size={22} />} label="Đang thực hiện" value={safeNumber(dashboardData?.savingGoalActiveCount)} color="bg-violet-500/10 text-violet-400" />
          <InfoCard onClick={() => navigate("/saving-goals")} icon={<PiggyBank size={22} />} label="Tích lũy" value={formatCompact(safeNumber(dashboardData?.savingGoalTotalSaved))} color="bg-amber-500/10 text-amber-400" />
          <InfoCard onClick={() => navigate("/saving-goals")} icon={<PieChart size={22} />} label="Hoàn thành" value={safeNumber(dashboardData?.savingGoalCompletedCount)} color="bg-emerald-500/10 text-emerald-400" />
        </section>
      ),
      monthly_history: () => {
        const isDark = theme === "dark";
        const gridStroke = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
        const tickColor = isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";
        const tooltipBg = isDark ? "#0B0F19" : "#ffffff";
        const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
        const tooltipColor = isDark ? "#ffffff" : "#1e293b";
        const tooltipCursor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Card 1: Expenses */}
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F19] p-4 sm:p-6 shadow-sm flex flex-col justify-between h-[260px] sm:h-[300px]">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div>
                  <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Biểu đồ</h3>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white">Chi tiêu</h4>
                </div>
                <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#FA5C5C] shadow-[0_0_8px_rgba(250,92,92,0.5)]" />
              </div>
              
              <div className="flex-1 w-full min-h-0">
                {(!dashboardData?.monthlyHistory || dashboardData.monthlyHistory.length === 0) ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                    Đang tổng hợp dữ liệu...
                  </div>
                ) : (
                  <ResponsiveContainer key={theme} width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF7575" stopOpacity={1} />
                          <stop offset="100%" stopColor="#E33C3C" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
                        dy={5}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatYAxis}
                        tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          borderColor: tooltipBorder,
                          borderRadius: "12px",
                          color: tooltipColor,
                          fontSize: "11px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value) => [formatCurrency(Number(value)), "Chi tiêu"]}
                        labelFormatter={(label) => `Tháng: ${label}`}
                        cursor={{ fill: tooltipCursor }}
                      />
                      <Bar
                        dataKey="expense"
                        fill="url(#expenseGrad)"
                        radius={[6, 6, 0, 0]}
                        barSize={18}
                        className="cursor-pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Card 2: Income */}
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F19] p-4 sm:p-6 shadow-sm flex flex-col justify-between h-[260px] sm:h-[300px]">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div>
                  <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Biểu đồ</h3>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white">Thu nhập</h4>
                </div>
                <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>

              <div className="flex-1 w-full min-h-0">
                {(!dashboardData?.monthlyHistory || dashboardData.monthlyHistory.length === 0) ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                    Đang tổng hợp dữ liệu...
                  </div>
                ) : (
                  <ResponsiveContainer key={theme} width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4EFAAF" stopOpacity={1} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
                        dy={5}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatYAxis}
                        tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          borderColor: tooltipBorder,
                          borderRadius: "12px",
                          color: tooltipColor,
                          fontSize: "11px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value) => [formatCurrency(Number(value)), "Thu nhập"]}
                        labelFormatter={(label) => `Tháng: ${label}`}
                        cursor={{ fill: tooltipCursor }}
                      />
                      <Bar
                        dataKey="income"
                        fill="url(#incomeGrad)"
                        radius={[6, 6, 0, 0]}
                        barSize={18}
                        className="cursor-pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        );
      },
      recent_transactions: () => (
        <RecentTransactions transactions={dashboardData?.recentTransactions || []} onMore={() => navigate("/expense")} />
      ),
      finance_overview: () => (
        <FinanceOverview
          totalBalance={safeNumber(dashboardData?.totalBalance)}
          totalIncome={safeNumber(dashboardData?.totalIncome)}
          totalExpense={safeNumber(dashboardData?.totalExpense)}
        />
      ),
      budget_progress: () => (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Ngân sách tháng này</h3>
            <button onClick={() => navigate("/budget")} className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
              Cài đặt
            </button>
          </div>
          <div className="space-y-5">
            {dashboardData?.budgets && dashboardData.budgets.length > 0 ? (
              dashboardData.budgets.slice(0, 3).map((budget, idx) => {
                const ratio = (Number(budget.totalSpent) / Number(budget.amountLimit)) * 100;
                const isWarning = ratio >= 80 && ratio < 100;
                const isExceeded = ratio >= 100;
                const statusText = isExceeded ? "Vượt hạn mức!" : isWarning ? "Sắp chạm hạn mức" : "Ổn định";
                const statusColor = isExceeded ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-500";
                const barColor = isExceeded ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500";
                return (
                  <div key={budget.id || idx}>
                    <div className="flex justify-between items-end mb-1.5">
                      <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{budget.categoryName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {addThousandsSeparator(Math.floor(budget.totalSpent))} / {addThousandsSeparator(Math.floor(budget.amountLimit))}
                        </p>
                      </div>
                      <p className={`text-xs font-semibold ${statusColor}`}>{statusText}</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-[width] duration-700`} style={{ width: `${Math.min(ratio, 100)}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-slate-400 mb-2">Chưa thiết lập ngân sách</p>
                <button onClick={() => navigate("/budget")} className="text-xs font-bold text-amber-500 hover:underline">
                  Thiết lập ngay
                </button>
              </div>
            )}
          </div>
        </div>
      ),
      priority_goal: () =>
        dashboardData?.priorityGoal ? (
          <div className="rounded-2xl p-6 relative overflow-hidden text-white
            bg-linear-to-br from-[#0F172A] to-[#1E1040] border border-violet-500/20">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-violet-600 rounded-full blur-2xl opacity-40" />
            <div className="relative">
              <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1">Mục tiêu ưu tiên</p>
              <div className="flex justify-between items-start mb-5">
                <h3 className="text-lg font-bold truncate pr-3">{dashboardData.priorityGoal.name}</h3>
                <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                  {new Date(dashboardData.priorityGoal.targetDate).getFullYear()}
                </span>
              </div>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400">{Math.floor(dashboardData.priorityGoal.progressPercent)}%</span>
                <span className="text-[10px] text-white/40">
                  {addThousandsSeparator(Math.floor(dashboardData.priorityGoal.currentAmount))} / {addThousandsSeparator(Math.floor(dashboardData.priorityGoal.targetAmount))} VND
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-5">
                <div className="h-full bg-amber-400 rounded-full transition-[width] duration-700" style={{ width: `${dashboardData.priorityGoal.progressPercent}%` }} />
              </div>
              <button
                onClick={() => navigate(`/saving-goals`)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition"
              >
                Xem lộ trình tiết kiệm
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-6 text-white text-center
            bg-linear-to-br from-[#0F172A] to-[#1E1040] border border-violet-500/20">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 mx-auto">
              <Target size={22} className="text-violet-400" />
            </div>
            <h3 className="text-base font-bold mb-1">Chưa có mục tiêu</h3>
            <p className="text-xs text-white/50 mb-4">Hãy thiết lập mục tiêu đầu tiên để theo dõi lộ trình tài chính.</p>
            <button
              onClick={() => navigate("/saving-goals")}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition"
            >
              Tạo mục tiêu ngay
            </button>
          </div>
        ),
    }),
    [dashboardData, navigate, formatCurrency, formatCompact, safeNumber, chartData, formatYAxis, theme]
  );

  return (
    <Dashboard activeMenu="Tổng quan">
      {/* Header với nút Tùy chỉnh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tổng quan</h2>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
            bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300
            hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10
            transition"
        >
          <Settings2 size={15} />
          Tùy chỉnh
        </button>
      </div>

      {/* AI Assistant Banner — thiết kế mới rõ ràng & trực quan */}
      {widgetConfig.ai_assistant?.visible !== false && (
        <section className="relative overflow-hidden rounded-3xl mb-6
          bg-white dark:bg-white/[0.03]
          border border-slate-200 dark:border-white/10
          shadow-sm dark:shadow-none">
          
          {/* Header strip */}
          <div className="relative overflow-hidden
            bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600
            dark:from-violet-800 dark:via-purple-800 dark:to-indigo-800
            px-6 py-4">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 10% 90%, #F59E0B 0%, transparent 40%), radial-gradient(circle at 90% 10%, #A78BFA 0%, transparent 40%)" }} />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className={`w-5 h-5 ${aiLoading ? "animate-spin" : ""} text-amber-300`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Nova Money - Trợ lý AI</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-xs text-white/70">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${aiLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                      {aiLoading ? "Đang phân tích..." : "Sẵn sàng"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleDetailedInsight}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                  bg-white/15 border border-white/20 text-white hover:bg-white/25
                  transition whitespace-nowrap active:scale-95"
              >
                {showDetailedInsight ? (
                  <>
                    <ChevronUp size={16} />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Phân tích chi tiết
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Insight content */}
          <div className="p-6">
            {aiLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-full w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-full w-1/2" />
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-full w-5/6" />
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                    <Lightbulb size={16} className="text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Nhận định của AI</p>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {aiInsight || "Hãy thêm vài giao dịch để AI có thể đưa ra nhận xét cho bạn!"}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 italic">
                    Nova Money là AI có thể trả lời sai sót, vui lòng kiểm tra lại thông tin.
                  </p>
                </div>
              </div>
            )}

            {/* Detailed insight expandable */}
            <div className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${
              showDetailedInsight ? "max-h-[800px] opacity-100 mt-6" : "max-h-0 opacity-0 mt-0"
            }`}>
              <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                {detailedLoading ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 bg-violet-500/[0.04] border border-violet-500/10 rounded-2xl p-4 animate-pulse">
                      <div className="w-5 h-5 rounded-full border-2 border-violet-200 dark:border-violet-500/30 border-t-violet-600 dark:border-t-violet-400 animate-spin shrink-0" />
                      <p className="text-[13px] font-semibold text-violet-600 dark:text-violet-400">
                        Nova Money đang phân tích chuyên sâu dữ liệu của bạn, vui lòng chờ giây lát...
                      </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
                      {/* Left Card Skeleton */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] p-5 sm:p-6 flex flex-col justify-between min-h-[280px]">
                        <div>
                          <div className="flex items-center gap-2.5 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
                            <div className="space-y-1.5 w-1/3">
                              <div className="h-3.5 bg-slate-200 dark:bg-white/10 rounded-md w-full" />
                              <div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-md w-2/3" />
                            </div>
                          </div>
                          <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-full w-24 mb-5" />
                          <div className="space-y-2 mb-6">
                            <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-full" />
                            <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-5/6" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
                          <div className="bg-white/90 dark:bg-[#0f172a]/60 rounded-2xl p-4 border border-slate-200/60 dark:border-white/5 space-y-2">
                            <div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-md w-1/2" />
                            <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-md w-3/4" />
                          </div>
                          <div className="bg-white/90 dark:bg-[#0f172a]/60 rounded-2xl p-4 border border-slate-200/60 dark:border-white/5 space-y-2">
                            <div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-md w-1/2" />
                            <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-md w-3/4" />
                          </div>
                        </div>
                      </div>

                      {/* Right Card Skeleton */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] p-5 sm:p-6 flex flex-col justify-between min-h-[280px]">
                        <div>
                          <div className="flex items-center gap-2.5 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
                            <div className="space-y-1.5 w-1/3">
                              <div className="h-3.5 bg-slate-200 dark:bg-white/10 rounded-md w-full" />
                              <div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-md w-2/3" />
                            </div>
                          </div>
                          <div className="bg-slate-100/50 dark:bg-[#0f172a]/45 border border-slate-200/40 dark:border-white/5 rounded-2xl p-4 space-y-3 mt-2 min-h-[160px]">
                            <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-full" />
                            <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-5/6" />
                            <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-11/12" />
                            <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-4/5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : detailedInsight ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {detailedInsight.forecast && (
                      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-violet-500/20 dark:hover:border-violet-500/30 transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                              <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Dự báo dòng tiền</h4>
                              <p className="text-xs text-slate-400">Tháng tiếp theo</p>
                            </div>
                          </div>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-4 border ${
                            detailedInsight.forecast.riskLevel === "CAO"
                              ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]"
                              : detailedInsight.forecast.riskLevel === "TRUNG_BÌNH"
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                          }`}>
                            <AlertTriangle size={11} />
                            {detailedInsight.forecast.riskLevel === "CAO" ? "Rủi ro cao" : detailedInsight.forecast.riskLevel === "TRUNG_BÌNH" ? "Rủi ro trung bình" : "Rủi ro thấp"}
                          </div>
                          <p className="text-[13.5px] text-slate-650 dark:text-slate-350 mb-6 leading-relaxed font-medium">{detailedInsight.forecast.riskMessage}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
                          <div className="bg-white/90 dark:bg-[#0f172a]/60 rounded-2xl p-4 border border-slate-200/60 dark:border-white/5 shadow-xs hover:translate-y-[-1px] transition-all duration-200">
                            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Thu nhập dự kiến</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[15px] sm:text-[17px] tracking-tight">{formatCurrency(detailedInsight.forecast.predictedNextMonthIncome)}</p>
                          </div>
                          <div className="bg-white/90 dark:bg-[#0f172a]/60 rounded-2xl p-4 border border-slate-200/60 dark:border-white/5 shadow-xs hover:translate-y-[-1px] transition-all duration-200">
                            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Chi tiêu dự kiến</p>
                            <p className="text-red-500 font-extrabold text-[15px] sm:text-[17px] tracking-tight">{formatCurrency(detailedInsight.forecast.predictedNextMonthExpense)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {detailedInsight.detailedAdvice && (
                      <div className={`rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-violet-500/20 dark:hover:border-violet-500/30 transition-all duration-300 flex flex-col justify-between ${detailedInsight.forecast ? "" : "lg:col-span-2"}`}>
                        <div>
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                              <Sparkles size={18} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Lời khuyên chiến lược</h4>
                              <p className="text-xs text-slate-400">Từ phân tích AI</p>
                            </div>
                          </div>
                          
                          <div className="bg-slate-100/50 dark:bg-[#0f172a]/45 border border-slate-200/40 dark:border-white/5 rounded-2xl p-4 max-h-[220px] overflow-y-auto custom-scrollbar shadow-inner mt-2">
                            <div className="text-[13.5px] font-medium leading-relaxed text-slate-650 dark:text-slate-350 whitespace-pre-wrap">
                              {detailedInsight.detailedAdvice}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="col-span-full mt-1 text-xs text-slate-400 dark:text-slate-500 italic">
                      Nova Money là AI có thể trả lời sai sót, vui lòng kiểm tra lại thông tin.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <Sparkles size={20} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <p className="text-sm text-slate-400">Chưa có phân tích chi tiết cho thời điểm này</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DnD Zone — 6 widget có thể kéo thả */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedWidgetIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-6">
            {sortedWidgetIds
              .filter((id) => widgetConfig[id]?.visible !== false)
              .map((id) => {
                const Renderer = WIDGET_RENDERERS[id];
                return Renderer ? (
                  <SortableWidget key={id} id={id} editMode={settingsOpen}>
                    <Renderer />
                  </SortableWidget>
                ) : null;
              })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Widget Settings Panel */}
      <WidgetSettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        widgetConfig={widgetConfig}
        sortedWidgetIds={sortedWidgetIds}
        onToggle={toggleWidget}
        onReset={resetConfig}
      />

      {/* Paywall Modal Premium */}
      {showPremiumModal && (
        <div 
          onClick={() => setShowPremiumModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md transition-all duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative p-6 w-full max-w-lg mx-4 rounded-3xl shadow-2xl overflow-hidden
              bg-slate-900 border border-purple-500/30 text-white animate-fade-in-up"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-600/25 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
            
            {/* Elegant Top Border Line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500" />
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowPremiumModal(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer
                text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 hover:scale-105 active:scale-95"
            >
              <X size={18} />
            </button>
            
            {/* Content */}
            <div className="text-center mt-4">
              {/* Icon Container with beautiful animations */}
              <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-2xl
                bg-gradient-to-tr from-purple-600 to-pink-500 shadow-xl shadow-purple-500/20">
                <Crown className="w-8 h-8 text-white animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              </div>
              
              {/* Badges */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                bg-purple-500/10 border border-purple-500/30 text-purple-300 mb-3 uppercase tracking-wider">
                <Sparkles size={12} className="text-amber-400" />
                Tính Năng Premium
              </div>
              
              <h3 className="text-2xl font-extrabold text-white leading-tight">
                Mở khóa Phân tích Chuyên sâu (AI)
              </h3>
              
              <p className="text-sm text-slate-300 mt-2 mb-6 leading-relaxed max-w-sm mx-auto">
                Nhận các nhận định tài chính chuyên nghiệp, cá nhân hóa dòng tiền của bạn từ Trợ lý AI nâng cao.
              </p>
              
              {/* Premium Features Checklist */}
              <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4 text-left space-y-3.5 mb-7">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5 text-purple-400 flex-shrink-0">
                    <CheckCircle2 size={13} className="stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Phân tích xu hướng chi tiêu</h4>
                    <p className="text-xs text-slate-400 mt-0.5">AI tự động bóc tách các thói quen tiêu dùng và đề xuất tối ưu thông minh.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5 text-purple-400 flex-shrink-0">
                    <CheckCircle2 size={13} className="stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Dự toán dòng tiền thông minh</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Dự báo ngân sách tháng tới giúp bạn luôn chủ động trước mọi chi phí phát sinh.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5 text-purple-400 flex-shrink-0">
                    <CheckCircle2 size={13} className="stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Cảnh báo rủi ro & Lời khuyên chiến lược</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Nhận biết thâm hụt sớm và nhận lời khuyên tài chính từ chuyên gia ảo.</p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowPremiumModal(false)}
                  className="w-full sm:order-1 px-5 py-3 rounded-2xl text-sm font-medium
                    bg-slate-800 hover:bg-slate-750 active:scale-98 transition duration-150 text-slate-300 hover:text-white"
                >
                  Trải nghiệm sau
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPremiumModal(false);
                    navigate("/payment");
                  }}
                  className="w-full sm:order-2 px-5 py-3 rounded-2xl text-sm font-bold text-white
                    bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:via-pink-500 hover:to-amber-400
                    shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150
                    flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={16} />
                  Nâng cấp Premium ngay
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </Dashboard>
  );
};

// SortableWidget component — must be defined outside Home to properly use useSortable hook
const SortableWidget = ({ id, editMode, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <WidgetWrapper editMode={editMode} isDragging={isDragging} dragHandleProps={{ ...attributes, ...listeners }}>
        {children}
      </WidgetWrapper>
    </div>
  );
};

export default Home;
