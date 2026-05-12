import { useMemo } from "react";
import InfoCard from "./InfoCard";
import CustomPieChart from "./CustomPieChart";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Award,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Flame,
  ShieldCheck,
  ChartBar
} from "lucide-react";

const GRADE_COLORS = {
  A: { bg: "bg-emerald-100 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500" },
  B: { bg: "bg-blue-100 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500" },
  C: { bg: "bg-amber-100 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500" },
  D: { bg: "bg-orange-100 dark:bg-orange-500/20", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500" },
  F: { bg: "bg-red-100 dark:bg-red-500/20", text: "text-red-600 dark:text-red-400", border: "border-red-500" },
};

const formatCurrency = (value) => {
  if (!value) return "0";
  return new Intl.NumberFormat("vi-VN").format(value) + " VNĐ";
};

const MonthlyReportCard = ({ report }) => {
  const gradeColor = GRADE_COLORS[report.grade] || GRADE_COLORS.F;

  const spendingChangeInfo = useMemo(() => {
    if (report.spendingChangePercent === 0) return { icon: Minus, color: "text-slate-500", text: "Không đổi" };
    if (report.spendingChangePercent < 0) return { icon: ArrowDown, color: "text-emerald-500", text: `Giảm ${Math.abs(report.spendingChangePercent).toFixed(1)}%` };
    return { icon: ArrowUp, color: "text-red-500", text: `Tăng ${report.spendingChangePercent.toFixed(1)}%` };
  }, [report.spendingChangePercent]);

  const SpendingChangeIcon = spendingChangeInfo.icon;

  // Transform category data for pie chart
  const pieData = useMemo(() => {
    if (!report.categoryBreakdown || report.categoryBreakdown.length === 0) return [];
    return report.categoryBreakdown.map((item) => ({
      name: item.name,
      amount: item.amount,
      percent: item.percent,
      color: item.color || "#94A3B8",
      icon: item.icon || "📦",
    }));
  }, [report.categoryBreakdown]);

  // Extract colors from pieData for CustomPieChart
  const PIE_FALLBACK_COLORS = ["#F59E0B", "#8B5CF6", "#10B981", "#3B82F6", "#EF4444", "#EC4899", "#06B6D4", "#84CC16"];
  const pieColors = pieData.length > 0
    ? pieData.map((item, i) => item.color || PIE_FALLBACK_COLORS[i % PIE_FALLBACK_COLORS.length])
    : PIE_FALLBACK_COLORS;

  return (
    <div className="space-y-6">
      {/* Grade Badge */}
      <div className={`relative overflow-hidden p-8 rounded-2xl border-2 ${gradeColor.border} ${gradeColor.bg} text-center`}>
        <div className="text-8xl font-black tracking-tighter mb-2 ${gradeColor.text}">
          <span className={gradeColor.text}>{report.grade}</span>
        </div>
        <p className={`text-xl font-bold ${gradeColor.text}`}>{report.gradeLabel}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bảng điểm tháng {report.monthName}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={<TrendingUp size={22} />}
          label="Tổng thu nhập"
          value={formatCurrency(report.totalIncome)}
          color="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
        />
        <InfoCard
          icon={<TrendingDown size={22} />}
          label="Tổng chi tiêu"
          value={formatCurrency(report.totalExpense)}
          color="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
        />
        <InfoCard
          icon={<PiggyBank size={22} />}
          label="Tiết kiệm"
          value={formatCurrency(report.savings)}
          color="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
        />
        <InfoCard
          icon={<SpendingChangeIcon size={22} />}
          label="So với tháng trước"
          value={spendingChangeInfo.text}
          color="bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400"
        />
      </div>

      {/* Savings Rate */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Percent size={18} className="text-violet-500" />
            Tỷ lệ tiết kiệm
          </h3>
          <span className={`text-lg font-bold ${gradeColor.text}`}>{report.savingsRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              report.savingsRate >= 30 ? "bg-emerald-500" :
              report.savingsRate >= 20 ? "bg-blue-500" :
              report.savingsRate >= 10 ? "bg-amber-500" :
              report.savingsRate >= 0 ? "bg-orange-500" : "bg-red-500"
            }`}
            style={{ width: `${Math.min(Math.max(report.savingsRate, 0), 100)}%` }}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      {pieData.length > 0 && (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <ChartBar size={18} className="text-violet-500" />
            Phân bổ chi tiêu theo danh mục
          </h3>
          <CustomPieChart data={pieData} colors={pieColors} />
        </div>
      )}

      {/* Month-over-Month Comparison */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-violet-500" />
          So sánh với tháng trước
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">Chỉ tiêu</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">Tháng này</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">Tháng trước</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">Thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Thu nhập</td>
                <td className="py-3 px-4 text-right text-slate-900 dark:text-white">{formatCurrency(report.totalIncome)}</td>
                <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">{formatCurrency(report.prevMonthIncome)}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`inline-flex items-center gap-1 font-medium ${
                    report.totalIncome >= report.prevMonthIncome ? "text-emerald-500" : "text-red-500"
                  }`}>
                    {report.totalIncome >= report.prevMonthIncome ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {report.prevMonthIncome > 0
                      ? `${((report.totalIncome - report.prevMonthIncome) / report.prevMonthIncome * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Chi tiêu</td>
                <td className="py-3 px-4 text-right text-slate-900 dark:text-white">{formatCurrency(report.totalExpense)}</td>
                <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">{formatCurrency(report.prevMonthExpense)}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`inline-flex items-center gap-1 font-medium ${
                    report.totalExpense <= report.prevMonthExpense ? "text-emerald-500" : "text-red-500"
                  }`}>
                    {report.totalExpense <= report.prevMonthExpense ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                    {report.prevMonthExpense > 0
                      ? `${((report.totalExpense - report.prevMonthExpense) / report.prevMonthExpense * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Tiết kiệm</td>
                <td className="py-3 px-4 text-right text-slate-900 dark:text-white">{formatCurrency(report.savings)}</td>
                <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">{formatCurrency(report.prevMonthSavings)}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`inline-flex items-center gap-1 font-medium ${
                    report.savings >= report.prevMonthSavings ? "text-emerald-500" : "text-red-500"
                  }`}>
                    {report.savings >= report.prevMonthSavings ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {report.prevMonthSavings > 0
                      ? `${((report.savings - report.prevMonthSavings) / report.prevMonthSavings * 100).toFixed(1)}%`
                      : report.savings > 0 ? "+Mới" : "N/A"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Badges */}
      {report.badges && report.badges.length > 0 && (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Award size={18} className="text-amber-500" />
            Thành tích đạt được
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.badges.map((badge, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Budget & Goal Status */}
      {report.totalBudgets > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <ShieldCheck size={18} className="text-blue-500" />
              Ngân sách
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {report.budgetsOnTrack}/{report.totalBudgets} ngân sách đang trong hạn mức
            </p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Target size={18} className="text-emerald-500" />
              Mục tiêu tiết kiệm
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {report.completedGoalsThisMonth > 0
                ? `Đã hoàn thành ${report.completedGoalsThisMonth} mục tiêu trong tháng`
                : `Đang theo dõi ${report.totalActiveGoals} mục tiêu`}
            </p>
          </div>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.strengths && report.strengths.length > 0 && (
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3">
              <CheckCircle2 size={18} />
              Điểm mạnh
            </h3>
            <ul className="space-y-2">
              {report.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✅</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.improvements && report.improvements.length > 0 && (
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-3">
              <Flame size={18} />
              Cần cải thiện
            </h3>
            <ul className="space-y-2">
              {report.improvements.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-amber-500 mt-0.5 shrink-0">💡</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyReportCard;
