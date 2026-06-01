import { useState, useEffect, useContext, useMemo, useRef, useCallback } from "react";
import axiosConfig from "../util/axiosConfig";
import toast from "react-hot-toast";
import { AlertTriangle, Lightbulb, Activity, Crown, Sparkles, CheckCircle2 } from "lucide-react";
import { API_ENDPOINTS } from "../util/apiEndpoints";
import { AppContext } from "../context/AppContext";
import Dashboard from "../components/Dashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTheme } from "../context/ThemeContext";

const getNearestMonths = (count) => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` });
    }
    return months;
};

const Forecast = () => {
    useUser();
    usePageTitle("Dự báo thông minh");
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const gridStroke = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const tickColor = isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";
    const tooltipBg = isDark ? "#0B0F19" : "#ffffff";
    const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    const tooltipColor = isDark ? "#ffffff" : "#1e293b";
    const tooltipCursor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
    const labelColor = isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";
    const { user } = useContext(AppContext);
    const [monthlyForecast, setMonthlyForecast] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [insights, setInsights] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const NEAREST_MONTHS = useMemo(() => getNearestMonths(6), []);
    const selectedMonth = NEAREST_MONTHS[selectedIdx].month;
    const selectedYear = NEAREST_MONTHS[selectedIdx].year;
    const navigate = useNavigate();
    const insightsFetchRef = useRef(0);

    // idx 0 = current month; idx 1-5 = future months
    const isCurrentMonth = selectedIdx === 0;

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

    const fetchInsights = useCallback(async (forecastData) => {
        const fetchId = ++insightsFetchRef.current;
        setIsInsightsLoading(true);
        setInsights(null);
        try {
            const res = await axiosConfig.post(API_ENDPOINTS.FORECAST_INSIGHTS, forecastData, { _skipGlobalLoading: true });
            if (fetchId === insightsFetchRef.current) {
                setInsights(res.data);
            }
        } catch (error) {
            console.error("Error fetching insights:", error);
        } finally {
            if (fetchId === insightsFetchRef.current) {
                setIsInsightsLoading(false);
            }
        }
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [forecastRes, anomaliesRes] = await Promise.all([
                axiosConfig.get(API_ENDPOINTS.FORECAST_MONTHLY(selectedYear, selectedMonth)),
                axiosConfig.get(API_ENDPOINTS.FORECAST_ANOMALIES)
            ]);

            setMonthlyForecast(forecastRes.data);
            setAnomalies(anomaliesRes.data);

            if (forecastRes.data && !isCurrentMonth) {
                void fetchInsights(forecastRes.data);
            }
        } catch (error) {
            console.error("Error fetching forecast:", error);
            toast.error("Không thể tải dữ liệu dự báo");
        } finally {
            setIsLoading(false);
        }
    }, [fetchInsights, isCurrentMonth, selectedMonth, selectedYear]);

    useEffect(() => {
        if (user && user.subscriptionPlan === "PREMIUM") {
            void fetchData();
        } else {
            setIsLoading(false);
        }
    }, [fetchData, user]);

    const chartData = useMemo(() =>
        monthlyForecast?.categories?.map(c => ({
            name: c.categoryName,
            predicted: c.predictedAmount,
            average: c.historicalAverage,
            trend: c.trend
        })) || [],
        [monthlyForecast]
    );

    if (user?.subscriptionPlan !== "PREMIUM") {
        return (
            <Dashboard activeMenu="Dự báo">
                <div className="flex items-center justify-center min-h-[75vh] px-4 relative overflow-hidden">
                    {/* Glowing background orbs */}
                    <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-72 h-72 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
                    
                    <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 text-white rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden animate-fade-in-up">
                        {/* Top Accent Gradient Border */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500" />
                        
                        <div className="text-center">
                            {/* Crown Glow Icon */}
                            <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-2xl
                                bg-gradient-to-tr from-purple-600 to-pink-500 shadow-xl shadow-purple-500/20">
                                <Crown className="w-8 h-8 text-white animate-pulse" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                            </div>

                            {/* Badge */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                                bg-purple-500/10 border border-purple-500/30 text-purple-300 mb-4 uppercase tracking-wider">
                                <Sparkles size={12} className="text-amber-400" />
                                Tính Năng Premium
                            </div>

                            <h2 className="text-2xl font-extrabold text-white leading-tight">
                                Dự báo tài chính & Cảnh báo chi tiêu thông minh (AI)
                            </h2>
                            
                            <p className="text-sm text-slate-300 mt-2 mb-6 leading-relaxed max-w-sm mx-auto">
                                Tận dụng sức mạnh của trí tuệ nhân tạo để làm chủ ngân sách và dự toán tương lai.
                            </p>

                            {/* Features list */}
                            <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4 md:p-5 text-left space-y-3.5 mb-7">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5 text-purple-400 flex-shrink-0">
                                        <CheckCircle2 size={13} className="stroke-[3]" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white">Dự báo dòng tiền tương lai</h4>
                                        <p className="text-xs text-slate-400 mt-0.5">AI tự động phân tích dữ liệu lịch sử để dự phóng chi tiêu 6 tháng tới.</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5 text-purple-400 flex-shrink-0">
                                        <CheckCircle2 size={13} className="stroke-[3]" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white">Cảnh báo bất thường (Anomalies)</h4>
                                        <p className="text-xs text-slate-400 mt-0.5">Phát hiện ngay lập tức các khoản chi tăng vọt, sai lệch so với quỹ đạo chi tiêu.</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5 text-purple-400 flex-shrink-0">
                                        <CheckCircle2 size={13} className="stroke-[3]" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white">Lời khuyên chiến lược tối ưu chi tiêu</h4>
                                        <p className="text-xs text-slate-400 mt-0.5">Lời khuyên hành động cụ thể từ Nova Money giúp bạn tiết kiệm thông minh hơn.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/dashboard")}
                                    className="w-full sm:order-1 px-5 py-3 rounded-2xl text-sm font-medium
                                        bg-slate-800 hover:bg-slate-700 active:scale-98 transition duration-150 text-slate-300 hover:text-white"
                                >
                                    Quay về trang chủ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate("/payment")}
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
            </Dashboard>
        );
    }

    return (
        <Dashboard activeMenu="Dự báo">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dự báo chi tiêu tháng {selectedMonth}/{selectedYear}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Dựa trên phân tích AI từ dữ liệu lịch sử của bạn</p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            aria-label="Chọn tháng dự báo"
                            value={selectedIdx}
                            onChange={(e) => setSelectedIdx(Number(e.target.value))}
                            className="border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        >
                            {NEAREST_MONTHS.map((m, idx) => (
                                <option key={idx} value={idx} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{m.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                        {/* Main Chart Area Skeleton */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm h-96 flex flex-col gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-slate-200 dark:bg-white/10" />
                                    <div className="h-5 w-44 bg-slate-200 dark:bg-white/10 rounded-lg" />
                                </div>
                                <div className="flex-1 w-full bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-xl flex items-end justify-between p-6">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="w-12 flex flex-col items-center gap-2">
                                            <div className="w-4 bg-slate-200 dark:bg-white/10 rounded-t" style={{ height: `${30 + i * 15}px` }} />
                                            <div className="h-3 w-10 bg-slate-200 dark:bg-white/10 rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar AI Insight Skeleton */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm h-96 flex flex-col gap-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-white/10" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded-lg" />
                                        <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-3.5 flex-1 pt-4">
                                    <div className="h-4 w-full bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                    <div className="h-4 w-5/6 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                    <div className="h-4 w-4/5 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                    <div className="h-4 w-full bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Main Chart Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F19] p-4 sm:p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Activity size={20} className="text-indigo-400 animate-pulse" />
                                        Dự báo các khoản chi chính
                                    </h3>
                                    <div className="flex gap-4 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        <span className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-[#475569]" />Trung bình
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-violet-400" />Dự báo
                                        </span>
                                    </div>
                                </div>
                                {chartData.length > 0 ? (
                                    <div className="h-[260px] sm:h-[320px] w-full min-h-0">
                                        <ResponsiveContainer key={theme} width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 15, right: 10, left: 15, bottom: 5 }}>
                                                <defs>
                                                    <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.8}/>
                                                        <stop offset="100%" stopColor="#64748B" stopOpacity={0.2}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#C084FC" stopOpacity={1}/>
                                                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={1}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: tickColor, fontWeight: 600 }}
                                                    dy={5}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={formatYAxis}
                                                    tick={{ fontSize: 10, fill: tickColor, fontWeight: 600 }}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: tooltipCursor }}
                                                    contentStyle={{
                                                        borderRadius: '16px',
                                                        border: `1px solid ${tooltipBorder}`,
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                        backgroundColor: tooltipBg,
                                                        color: tooltipColor,
                                                        fontSize: "11px",
                                                        padding: '12px 16px',
                                                    }}
                                                    itemStyle={{ padding: '2px 0', fontSize: '12px' }}
                                                    labelStyle={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px', color: labelColor }}
                                                    formatter={(value, name) => [new Intl.NumberFormat('vi-VN').format(value) + ' VND', name]}
                                                />
                                                <Bar dataKey="average" name="Trung bình" fill="url(#colorAverage)" radius={[6, 6, 0, 0]} barSize={16} className="cursor-pointer" />
                                                <Bar dataKey="predicted" name="Dự báo" fill="url(#colorPredicted)" radius={[6, 6, 0, 0]} barSize={16} className="cursor-pointer" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-80 flex flex-col items-center justify-center text-slate-500">
                                        <Activity size={48} className="opacity-20 mb-3" />
                                        <p className="text-sm">Chưa đủ dữ liệu lịch sử để dự báo</p>
                                    </div>
                                )}
                            </div>

                            {/* AI Insights - chỉ hiển thị cho tháng tương lai */}
                            {!isCurrentMonth && (
                                isInsightsLoading ? (
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Lightbulb size={120} />
                                        </div>
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                                            <Lightbulb size={20} className="text-amber-300" />
                                            Nova Money đang phân tích dữ liệu của bạn, vui lòng chờ nhé...
                                        </h3>
                                        <div className="space-y-3 relative z-10">
                                            <div className="h-3 bg-white/20 rounded-full w-full animate-pulse" />
                                            <div className="h-3 bg-white/20 rounded-full w-5/6 animate-pulse" style={{ animationDelay: "0.2s" }} />
                                            <div className="h-3 bg-white/20 rounded-full w-4/6 animate-pulse" style={{ animationDelay: "0.4s" }} />
                                            <div className="h-3 bg-white/20 rounded-full w-3/6 animate-pulse" style={{ animationDelay: "0.6s" }} />
                                        </div>
                                    </div>
                                ) : insights ? (
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Lightbulb size={120} />
                                        </div>
                                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2 relative z-10">
                                            <Lightbulb size={20} className="text-amber-300" />
                                            Phân tích từ Nova Money
                                        </h3>
                                        <div className="text-indigo-50 leading-relaxed relative z-10 text-sm space-y-2">
                                            {(insights.narrative ?? "")
                                                .replace(/([;:])\s*(\d+[)]\s)/g, "$1\n$2")
                                                .split("\n")
                                                .filter(line => line.trim())
                                                .map((line, i) => (
                                                    <p key={i}>{line.trim()}</p>
                                                ))
                                            }
                                        </div>
                                        <p className="mt-3 text-xs text-indigo-200/70 relative z-10 italic">
                                            Nova Money là AI có thể trả lời sai sót, vui lòng kiểm tra lại thông tin.
                                        </p>
                                    </div>
                                ) : null
                            )}
                        </div>

                        {/* Side Panel: Anomalies */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-rose-500" />
                                    Chi tiêu bất thường gần đây
                                </h3>
                                
                                <div className="space-y-4">
                                    {anomalies.length > 0 ? anomalies.map((anomaly, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-rose-100 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-semibold text-slate-800 dark:text-white text-sm">{anomaly.categoryName}</span>
                                                <span className="text-xs text-slate-500">{new Date(anomaly.date).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-lg font-bold text-rose-600">
                                                    {new Intl.NumberFormat('vi-VN').format(anomaly.amount)}đ
                                                </span>
                                            </div>
                                            <p className="text-xs text-rose-600/80 mt-2 bg-rose-100/50 dark:bg-rose-500/10 p-2 rounded-lg">
                                                Cao hơn <b>{((anomaly.amount - anomaly.meanAmount) / anomaly.meanAmount * 100).toFixed(0)}%</b> so với trung bình ({new Intl.NumberFormat('vi-VN').format(anomaly.meanAmount)}đ)
                                            </p>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-slate-500 text-sm">
                                            Không phát hiện chi tiêu bất thường nào gần đây.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default Forecast;
