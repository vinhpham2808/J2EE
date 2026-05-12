import { useState, useEffect, useContext } from "react";
import axiosConfig from "../util/axiosConfig";
import toast from "react-hot-toast";
import { AlertTriangle, Lightbulb, Activity, Crown } from "lucide-react";
import { API_ENDPOINTS } from "../util/apiEndpoints";
import { AppContext } from "../context/AppContext";
import Dashboard from "../components/Dashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTheme } from "../context/ThemeContext";

const Forecast = () => {
    useUser();
    usePageTitle("Dự báo thông minh");
    const { user } = useContext(AppContext);
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [monthlyForecast, setMonthlyForecast] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [insights, setInsights] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.subscriptionPlan === "PREMIUM") {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [user, selectedMonth, selectedYear]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [forecastRes, anomaliesRes] = await Promise.all([
                axiosConfig.get(API_ENDPOINTS.FORECAST_MONTHLY(selectedYear, selectedMonth)),
                axiosConfig.get(API_ENDPOINTS.FORECAST_ANOMALIES)
            ]);

            setMonthlyForecast(forecastRes.data);
            setAnomalies(anomaliesRes.data);

            if (forecastRes.data) {
                fetchInsights(forecastRes.data);
            }
        } catch (error) {
            console.error("Error fetching forecast:", error);
            toast.error("Không thể tải dữ liệu dự báo");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInsights = async (forecastData) => {
        try {
            const res = await axiosConfig.post(API_ENDPOINTS.FORECAST_INSIGHTS, forecastData);
            setInsights(res.data);
        } catch (error) {
            console.error("Error fetching insights:", error);
        }
    };

    if (user?.subscriptionPlan !== "PREMIUM") {
        return (
            <Dashboard activeMenu="Dự báo">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200 dark:border-white/10">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Crown size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Tính năng Premium</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Tính năng dự báo thông minh và cảnh báo chi tiêu bất thường bằng AI chỉ dành cho gói Premium.
                        </p>
                        <button
                            onClick={() => navigate("/payment")}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-medium shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                        >
                            Nâng cấp ngay
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const chartData = monthlyForecast?.categories?.map(c => ({
        name: c.categoryName,
        predicted: c.predictedAmount,
        average: c.historicalAverage,
        trend: c.trend
    })) || [];

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
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        >
                            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                <option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">Tháng {m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        >
                            {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                                <option key={y} value={y} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">Năm {y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Main Chart Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <Activity size={20} className="text-indigo-500" />
                                    Dự báo các khoản chi chính
                                </h3>
                                {chartData.length > 0 ? (
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} tickFormatter={(val) => `${val/1000}k`} />
                                                <Tooltip
                                                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                                        color: isDark ? '#f1f5f9' : '#1e293b'
                                                    }}
                                                    formatter={(value) => new Intl.NumberFormat('vi-VN').format(value) + ' đ'}
                                                />
                                                <Bar dataKey="average" name="Trung bình" fill={isDark ? '#334155' : '#cbd5e1'} radius={[4, 4, 0, 0]} barSize={20} />
                                                <Bar dataKey="predicted" name="Dự báo" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                                        <Activity size={48} className="opacity-20 mb-3" />
                                        <p>Chưa đủ dữ liệu lịch sử để dự báo</p>
                                    </div>
                                )}
                            </div>

                            {/* Gemini Insights */}
                            {insights && (
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Lightbulb size={120} />
                                    </div>
                                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2 relative z-10">
                                        <Lightbulb size={20} className="text-amber-300" />
                                        Phân tích từ chuyên gia AI
                                    </h3>
                                    <p className="text-indigo-50 leading-relaxed relative z-10 text-sm whitespace-pre-wrap">
                                        {insights.narrative}
                                    </p>
                                </div>
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
