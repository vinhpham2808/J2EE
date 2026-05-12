import Dashboard from "../components/Dashboard.jsx";
import { useUser } from "../hooks/useUser.jsx";
import InfoCard from "../components/InfoCard.jsx";
import {
  Coins, PiggyBank, Target, Wallet, WalletCards, Sparkles,
  ChevronDown, ChevronUp, TrendingUp, AlertTriangle, PieChart,
  Settings2,
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

const Home = () => {
  useUser();
  usePageTitle("Tổng quan");
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showDetailedInsight, setShowDetailedInsight] = useState(false);
  const [detailedInsight, setDetailedInsight] = useState(null);
  const [detailedLoading, setDetailedLoading] = useState(false);

  const { user } = useContext(AppContext);

  // Widget customization
  const { widgetConfig, sortedWidgetIds, toggleWidget, reorderWidgets, resetConfig } = useWidgetConfig(user?.id);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  const fetchDashboardData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.DASHBOARD_DATA);
      if (response.status === 200) setDashboardData(response.data);
    } catch (error) {
      console.error("Something went wrong while fetching dashboard data:", error);
      toast.error("Không thể tải dữ liệu thống kê!");
    } finally {
      setLoading(false);
    }
  };

  const fetchAiInsight = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const response = await axiosConfig.get(AI_INSIGHT_ENDPOINT);
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
  };

  const fetchDetailedInsight = async () => {
    if (detailedLoading) return;
    setDetailedLoading(true);
    try {
      const response = await axiosConfig.get(AI_DETAILED_INSIGHT_ENDPOINT);
      if (response.status === 200) {
        if (response.data.error) {
          toast.error(response.data.message || "Không thể tải phân tích chi tiết");
          setDetailedInsight(null);
        } else if (response.data.status === "insufficient_data") {
          toast.custom((t) => (
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
        toast.error("Tính năng phân tích chuyên sâu chỉ dành cho hội viên. Vui lòng nâng cấp tài khoản!");
        return;
      }
      if (!detailedInsight && !detailedLoading) fetchDetailedInsight();
    }
    setShowDetailedInsight(!showDetailedInsight);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAiInsight("Vui lòng đăng nhập để sử dụng tính năng AI!");
    } else {
      fetchDashboardData();
      fetchAiInsight();
    }
  }, []);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0 VND";
    const num = typeof amount === "object" ? 0 : Number(amount);
    if (isNaN(num)) return "0 VND";
    return addThousandsSeparator(Math.floor(num)) + " VND";
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "CAO": return "text-red-400 bg-red-500/10 border border-red-500/30";
      case "TRUNG_BÌNH": return "text-amber-400 bg-amber-500/10 border border-amber-500/30";
      default: return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30";
    }
  };

  const safeNumber = (value) => (!value && value !== 0 ? 0 : value);

  // ─── Widget Renderers ──────────────────────────────────────
  const WIDGET_RENDERERS = useMemo(
    () => ({
      kpi_cards: () => (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <InfoCard onClick={() => navigate("/income")} icon={<WalletCards size={22} />} label="Số dư" value={formatCurrency(safeNumber(dashboardData?.totalBalance))} color="bg-blue-500/10 text-blue-400" />
          <InfoCard onClick={() => navigate("/income")} icon={<TrendingUp size={22} />} label="Thu nhập" value={formatCurrency(safeNumber(dashboardData?.totalIncome))} color="bg-emerald-500/10 text-emerald-400" />
          <InfoCard onClick={() => navigate("/expense")} icon={<AlertTriangle size={22} />} label="Chi tiêu" value={formatCurrency(safeNumber(dashboardData?.totalExpense))} color="bg-red-500/10 text-red-400" />
          <InfoCard onClick={() => navigate("/saving-goals")} icon={<Target size={22} />} label="Đang thực hiện" value={safeNumber(dashboardData?.savingGoalActiveCount)} color="bg-violet-500/10 text-violet-400" />
          <InfoCard onClick={() => navigate("/saving-goals")} icon={<PiggyBank size={22} />} label="Tích lũy" value={formatCurrency(safeNumber(dashboardData?.savingGoalTotalSaved))} color="bg-amber-500/10 text-amber-400" />
          <InfoCard onClick={() => navigate("/saving-goals")} icon={<PieChart size={22} />} label="Hoàn thành" value={safeNumber(dashboardData?.savingGoalCompletedCount)} color="bg-emerald-500/10 text-emerald-400" />
        </section>
      ),
      monthly_history: () => (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 h-95 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Tổng quan thu chi</h3>
            <div className="flex gap-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />Thu nhập
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />Chi tiêu
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-end justify-between px-4 pb-2 min-w-[340px] h-full">
              {dashboardData?.monthlyHistory?.map((h, i) => {
                const maxVal = Math.max(...dashboardData.monthlyHistory.map((m) => Math.max(Number(m.income), Number(m.expense))), 1);
                const incomeH = (Number(h.income) / maxVal) * 100;
                const expenseH = (Number(h.expense) / maxVal) * 100;
                return (
                  <div key={i} className="w-16 h-full flex items-end gap-1.5 justify-center relative group">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white/90 dark:text-slate-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap text-center shadow-lg">
                      Thu: {formatCurrency(h.income)}<br />Chi: {formatCurrency(h.expense)}
                    </div>
                    <div className="w-5 bg-emerald-400/30 dark:bg-emerald-400/20 rounded-t-md hover:bg-emerald-400 transition-all" style={{ height: `${Math.max(incomeH, 2)}%` }} />
                    <div className="w-5 bg-red-400/30 dark:bg-red-400/20 rounded-t-md hover:bg-red-400 transition-all" style={{ height: `${Math.max(expenseH, 2)}%` }} />
                    <span className="absolute -bottom-6 text-[10px] text-slate-400 font-semibold">{h.month}</span>
                  </div>
                );
              })}
              {(!dashboardData?.monthlyHistory || dashboardData.monthlyHistory.length === 0) && (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  Đang tổng hợp dữ liệu lịch sử...
                </div>
              )}
            </div>
          </div>
        </div>
      ),
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
                      <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${Math.min(ratio, 100)}%` }} />
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
                <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${dashboardData.priorityGoal.progressPercent}%` }} />
              </div>
              <button
                onClick={() => navigate(`/saving-goals`)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all"
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-all"
            >
              Tạo mục tiêu ngay
            </button>
          </div>
        ),
    }),
    [dashboardData, navigate, formatCurrency, safeNumber]
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
            transition-all"
        >
          <Settings2 size={15} />
          Tùy chỉnh
        </button>
      </div>

      {/* AI Assistant Banner — ghim cố định */}
      {widgetConfig.ai_assistant?.visible !== false && (
        <section className="relative overflow-hidden rounded-2xl p-6 lg:p-8 mb-6
          bg-linear-to-br from-violet-900 via-slate-900 to-[#0F172A]
          border border-violet-500/20">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #8B5CF6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #F59E0B 0%, transparent 50%)" }} />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer" onClick={toggleDetailedInsight}>
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
                    <Sparkles className={`w-5 h-5 ${aiLoading ? "animate-spin text-amber-400" : "text-amber-400"}`} />
                  </div>
                  <h2 className="text-white text-xl font-bold">Trợ lý AI Tiền Trí</h2>
                </div>
                {aiLoading ? (
                  <p className="text-white/60 leading-relaxed animate-pulse">Đang phân tích thói quen chi tiêu của bạn...</p>
                ) : (
                  <p className="text-white/90 leading-relaxed line-clamp-2">
                    {aiInsight || "Hãy thêm vài giao dịch để AI có thể đưa ra nhận xét cho bạn!"}
                  </p>
                )}
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all whitespace-nowrap">
                {showDetailedInsight ? "Thu gọn" : "Phân tích chi tiết"}
                {showDetailedInsight ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${showDetailedInsight ? "max-h-500 opacity-100 mt-6" : "max-h-0 opacity-0 mt-0"}`}>
              <div className="border-t border-white/10 pt-6">
                {detailedLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin mb-4" />
                    <p className="text-white/60 text-sm">Đang trích xuất dữ liệu tài chính sâu hơn...</p>
                  </div>
                ) : detailedInsight ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailedInsight.forecast && (
                      <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp size={18} className="text-emerald-400" />
                          <h4 className="font-semibold text-white">Dự báo dòng tiền</h4>
                        </div>
                        <div className={`px-3 py-1 rounded-full inline-flex text-xs font-bold uppercase tracking-wide mb-3 ${getRiskColor(detailedInsight.forecast.riskLevel)}`}>
                          Rủi ro: {detailedInsight.forecast.riskLevel === "CAO" ? "Cao" : detailedInsight.forecast.riskLevel === "TRUNG_BÌNH" ? "Trung bình" : "Thấp"}
                        </div>
                        <p className="text-white/70 text-sm mb-4">{detailedInsight.forecast.riskMessage}</p>
                        <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
                          <div>
                            <p className="text-white/40 text-xs mb-1">Thu nhập dự kiến</p>
                            <p className="text-emerald-400 font-semibold text-sm">{formatCurrency(detailedInsight.forecast.predictedNextMonthIncome)}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-1">Chi tiêu dự kiến</p>
                            <p className="text-red-400 font-semibold text-sm">{formatCurrency(detailedInsight.forecast.predictedNextMonthExpense)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {detailedInsight.detailedAdvice && (
                      <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-5 border border-white/10 md:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles size={18} className="text-violet-400" />
                          <h4 className="font-semibold text-white">Lời khuyên chiến lược</h4>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed italic border-l-2 border-violet-400 pl-4">
                          "{detailedInsight.detailedAdvice}"
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-white/50 text-center py-4 text-sm">Không có dữ liệu phân tích chi tiết khả dụng.</p>
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
