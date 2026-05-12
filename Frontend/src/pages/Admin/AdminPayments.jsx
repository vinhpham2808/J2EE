import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, Wallet, ChevronDown } from "lucide-react";
import axiosConfig from "../../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../../util/apiEndpoints.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const ADMIN_SETTINGS_KEY = "admin_settings";

const defaultSettings = {
  autoRefresh: false,
  defaultPaymentStatus: "ALL",
  paymentPageSize: 20,
  compactTable: false
};

const loadAdminSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY) || "{}");
    return { ...defaultSettings, ...saved };
  } catch {
    return defaultSettings;
  }
};

const statusBadgeClass = (status) => {
  switch ((status || "").toUpperCase()) {
    case "PAID":
      return "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "PENDING":
    case "PROCESSING":
    case "UNDERPAID":
      return "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "FAILED":
    case "CANCELLED":
    case "EXPIRED":
      return "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400";
    default:
      return "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-400";
  }
};

const formatMoney = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

const AdminPayments = () => {
  const settings = useMemo(() => loadAdminSettings(), []);
  usePageTitle("Quản lý thanh toán");

  const [status, setStatus] = useState(settings.defaultPaymentStatus || "ALL");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_PAYMENTS, {
        params: {
          status,
          search: appliedSearch || undefined,
          limit: settings.paymentPageSize
        }
      });
      setPayments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, settings.paymentPageSize, status]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (!settings.autoRefresh) return;
    const timer = setInterval(fetchPayments, 20000);
    return () => clearInterval(timer);
  }, [fetchPayments, settings.autoRefresh]);

  const onSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Payment Management</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Theo dõi và quản lý giao dịch từ cơ sở dữ liệu.</p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <form onSubmit={onSearchSubmit} className="flex items-center gap-2 w-full md:max-w-xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo order code, email, mô tả..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/30"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
            >
              Search
            </button>
          </form>

          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none appearance-none"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">All Status</option>
              <option value="PAID" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">PAID</option>
              <option value="PENDING" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">PENDING</option>
              <option value="PROCESSING" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">PROCESSING</option>
              <option value="UNDERPAID" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">UNDERPAID</option>
              <option value="FAILED" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">FAILED</option>
              <option value="CANCELLED" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">CANCELLED</option>
              <option value="EXPIRED" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">EXPIRED</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading payments...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 dark:text-red-400">{error}</div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
            <Wallet size={36} className="text-slate-300 dark:text-slate-600" />
            <p>Không có dữ liệu thanh toán</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Order Code</th>
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.orderCode} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50/70 dark:hover:bg-white/3">
                    <td className={`px-4 ${settings.compactTable ? "py-2" : "py-3"} font-medium text-slate-800 dark:text-white`}>#{payment.orderCode}</td>
                    <td className={`px-4 ${settings.compactTable ? "py-2" : "py-3"}`}>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{payment.payerName || "-"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{payment.payerEmail || "-"}</p>
                    </td>
                    <td className={`px-4 ${settings.compactTable ? "py-2" : "py-3"} text-slate-700 dark:text-slate-300`}>{payment.planName || payment.planId || "-"}</td>
                    <td className={`px-4 ${settings.compactTable ? "py-2" : "py-3"} text-slate-700 dark:text-slate-300`}>{formatMoney(payment.amount)}</td>
                    <td className={`px-4 ${settings.compactTable ? "py-2" : "py-3"}`}>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(payment.status)}`}>
                        {payment.status || "UNKNOWN"}
                      </span>
                    </td>
                    <td className={`px-4 ${settings.compactTable ? "py-2" : "py-3"} text-slate-600 dark:text-slate-400`}>{formatDateTime(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
