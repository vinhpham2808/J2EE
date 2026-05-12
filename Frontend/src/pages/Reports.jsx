import { useState, useEffect, useCallback } from "react";
import Dashboard from "../components/Dashboard";
import MonthlyReportCard from "../components/MonthlyReportCard";
import { ChevronLeft, ChevronRight, RefreshCw, BarChart3 } from "lucide-react";
import axiosConfig from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints";
import toast from "react-hot-toast";
import { usePageTitle } from "../hooks/usePageTitle.js";

const Reports = () => {
  usePageTitle("Báo cáo tài chính");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.MONTHLY_REPORT_BY_MONTH(year, month));
      if (res.status === 200 && res.data.success) {
        setReport(res.data.data);
      } else {
        throw new Error(res.data.message || "Không thể tải báo cáo");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Không thể tải báo cáo";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear(y => y - 1);
      setMonth(12);
    } else {
      setMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    const nowDate = new Date();
    const currentYear = nowDate.getFullYear();
    const currentMonth = nowDate.getMonth() + 1;
    
    // Can't go to future months
    if (year >= currentYear && month >= currentMonth) return;
    
    if (month === 12) {
      setYear(y => y + 1);
      setMonth(1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const goToCurrentMonth = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  return (
    <Dashboard activeMenu="Báo cáo">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="text-violet-500" />
              Bảng điểm tài chính
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Đánh giá tình hình tài chính hàng tháng của bạn
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToCurrentMonth}
              disabled={isCurrentMonth}
              className="px-3 py-2 text-sm font-medium rounded-xl
                bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15
                text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors border border-slate-200 dark:border-white/5"
            >
              Tháng này
            </button>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="p-2 rounded-xl
                bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15
                text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-white/5"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={goToPrevMonth}
            className="p-2.5 rounded-xl
              bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
              hover:bg-slate-50 dark:hover:bg-white/10
              text-slate-600 dark:text-slate-400 transition-colors shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="px-6 py-2.5 rounded-xl
            bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm
            font-bold text-lg text-slate-900 dark:text-white min-w-[180px] text-center">
            {monthNames[month - 1]} / {year}
          </div>

          <button
            onClick={goToNextMonth}
            disabled={isFuture}
            className="p-2.5 rounded-xl
              bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
              hover:bg-slate-50 dark:hover:bg-white/10
              text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-violet-600 animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Đang tạo báo cáo...</p>
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4">
              <BarChart3 size={28} className="text-red-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">Chưa có dữ liệu</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">{error}</p>
            <button
              onClick={goToPrevMonth}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Xem tháng trước
            </button>
          </div>
        ) : report ? (
          <MonthlyReportCard report={report} />
        ) : null}
      </div>
    </Dashboard>
  );
};

export default Reports;
