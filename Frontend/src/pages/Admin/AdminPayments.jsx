import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  Wallet,
  ChevronDown,
  Eye,
  Trash2,
  X,
  AlertTriangle,
  LoaderCircle,
  Receipt,
  User,
  CreditCard,
  Calendar,
  Tag,
  Clock,
  Hash,
  FileText,
} from "lucide-react";
import axiosConfig from "../../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../../util/apiEndpoints.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import toast from "react-hot-toast";

const ADMIN_SETTINGS_KEY = "admin_settings";

const defaultSettings = {
  autoRefresh: false,
  defaultPaymentStatus: "ALL",
  paymentPageSize: 20,
  compactTable: false,
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

const statusDotClass = (status) => {
  switch ((status || "").toUpperCase()) {
    case "PAID":
      return "bg-emerald-500";
    case "PENDING":
    case "PROCESSING":
    case "UNDERPAID":
      return "bg-amber-500";
    case "FAILED":
    case "CANCELLED":
    case "EXPIRED":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
};

const formatMoney = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

// ─── Confirm Delete Modal ──────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ payment, onConfirm, onClose, isLoading }) => {
  if (!payment) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />

        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-red-100 dark:bg-red-500/10 text-red-500">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Xóa hóa đơn
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Bạn có chắc muốn xóa hóa đơn{" "}
              <span className="font-bold text-slate-800 dark:text-white">#{payment.orderCode}</span>?
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 text-xs text-red-700 dark:text-red-400 font-medium">
          {payment.payerName || payment.payerEmail} — {formatMoney(payment.amount)} ({payment.status})
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 shadow-md transition-all duration-300 disabled:opacity-50 bg-red-600 hover:bg-red-500 shadow-red-600/15 hover:shadow-red-600/30 cursor-pointer"
          >
            {isLoading ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Xóa hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Detail Info Row ──────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, highlight }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/3 transition-colors group">
    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
      <Icon size={14} />
    </div>
    <div className="min-w-0 flex-1">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
        {label}
      </span>
      <span
        className={`text-sm font-semibold break-all ${
          highlight
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-800 dark:text-slate-200"
        }`}
      >
        {value || "-"}
      </span>
    </div>
  </div>
);

// ─── Payment Detail Modal ─────────────────────────────────────────────────────
const PaymentDetailModal = ({ orderCode, onClose, onDelete }) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosConfig.get(API_ENDPOINTS.ADMIN_PAYMENT_DETAIL(orderCode));
        setPayment(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Không thể tải chi tiết hóa đơn");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [orderCode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
        {/* Header gradient bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-600" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Receipt size={18} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                Chi tiết hóa đơn
              </h2>
              {payment && (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  #{payment.orderCode}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 py-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <LoaderCircle size={32} className="animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Đang tải chi tiết...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          ) : payment ? (
            <div className="space-y-4">
              {/* Status banner */}
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${statusBadgeClass(payment.status)} border-current/10`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusDotClass(payment.status)} shrink-0`} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Trạng thái: {payment.status || "UNKNOWN"}
                  </span>
                </div>
                <span className="text-lg font-extrabold">{formatMoney(payment.amount)}</span>
              </div>

              {/* Order info */}
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Thông tin đơn hàng
                  </span>
                </div>
                <InfoRow icon={Hash} label="Mã đơn hàng" value={`#${payment.orderCode}`} />
                <InfoRow icon={Tag} label="Gói cước" value={payment.planName || payment.planId} />
                <InfoRow
                  icon={Clock}
                  label="Chu kỳ"
                  value={payment.cycleMonths ? `${payment.cycleMonths} tháng` : null}
                />
                <InfoRow icon={FileText} label="Mô tả" value={payment.description} />
              </div>

              {/* Payer info */}
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Người thanh toán
                  </span>
                </div>
                <InfoRow icon={User} label="Họ tên" value={payment.payerName} />
                <InfoRow icon={CreditCard} label="Email" value={payment.payerEmail} />
              </div>

              {/* Timestamp info */}
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Thời gian
                  </span>
                </div>
                <InfoRow icon={Calendar} label="Ngày tạo" value={formatDateTime(payment.createdAt)} />
                <InfoRow icon={Clock} label="Cập nhật lần cuối" value={formatDateTime(payment.updatedAt)} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        {payment && !loading && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={() => onDelete(payment)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/5 font-semibold text-sm transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              Xóa hóa đơn
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminPayments = () => {
  const settings = useMemo(() => loadAdminSettings(), []);
  usePageTitle("Quản lý thanh toán", "Money Manager Admin");

  const [status, setStatus] = useState(settings.defaultPaymentStatus || "ALL");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Detail modal
  const [detailOrderCode, setDetailOrderCode] = useState(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null); // payment object
  const [deleting, setDeleting] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_PAYMENTS, {
        params: {
          status,
          search: appliedSearch || undefined,
          limit: settings.paymentPageSize,
        },
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

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosConfig.delete(API_ENDPOINTS.ADMIN_PAYMENT_DELETE(deleteTarget.orderCode));
      toast.success(`Đã xóa hóa đơn #${deleteTarget.orderCode}`);
      setDeleteTarget(null);
      setDetailOrderCode(null);
      fetchPayments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể xóa hóa đơn");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Quản lý thanh toán
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi và quản lý lịch sử giao dịch toàn hệ thống.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
        >
          <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      <div className="bg-white dark:bg-[#0F172A] p-4 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <form onSubmit={onSearchSubmit} className="flex items-center gap-2 w-full md:max-w-xl">
            <div className="relative flex-1 group">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo order code, email, mô tả..."
                className="search-input pl-10 w-full"
              />
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 text-white font-bold text-sm shadow-md transition-all cursor-pointer shrink-0"
            >
              Tìm kiếm
            </button>
          </form>

          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full md:w-48 px-4 py-3 pr-10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] text-sm font-semibold text-slate-950 dark:text-white focus:outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="UNDERPAID">UNDERPAID</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 dark:text-slate-400">
            <RefreshCcw size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Đang tải dữ liệu thanh toán...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500 dark:text-red-400 font-medium">{error}</div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
            <Wallet size={48} className="text-slate-300 dark:text-slate-600 opacity-40" />
            <p className="text-sm font-medium">Không có dữ liệu thanh toán</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10">
                  <tr>
                    <th className="text-left px-5 py-4 font-bold text-xs uppercase tracking-wider">
                      Mã đơn hàng
                    </th>
                    <th className="text-left px-5 py-4 font-bold text-xs uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="text-left px-5 py-4 font-bold text-xs uppercase tracking-wider">
                      Gói
                    </th>
                    <th className="text-left px-5 py-4 font-bold text-xs uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="text-left px-5 py-4 font-bold text-xs uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="text-left px-5 py-4 font-bold text-xs uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="text-right px-5 py-4 font-bold text-xs uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {payments.map((payment) => (
                    <tr
                      key={payment.orderCode}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors group"
                    >
                      <td
                        className={`px-5 ${settings.compactTable ? "py-2.5" : "py-4"} font-bold text-slate-900 dark:text-white`}
                      >
                        #{payment.orderCode}
                      </td>
                      <td className={`px-5 ${settings.compactTable ? "py-2.5" : "py-4"}`}>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {payment.payerName || "-"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {payment.payerEmail || "-"}
                        </p>
                      </td>
                      <td
                        className={`px-5 ${settings.compactTable ? "py-2.5" : "py-4"} font-semibold text-slate-700 dark:text-slate-300`}
                      >
                        {payment.planName || payment.planId || "-"}
                      </td>
                      <td
                        className={`px-5 ${settings.compactTable ? "py-2.5" : "py-4"} font-bold text-slate-900 dark:text-white`}
                      >
                        {formatMoney(payment.amount)}
                      </td>
                      <td className={`px-5 ${settings.compactTable ? "py-2.5" : "py-4"}`}>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass(payment.status)}`}
                        >
                          {payment.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td
                        className={`px-5 ${settings.compactTable ? "py-2.5" : "py-4"} text-xs font-medium text-slate-500 dark:text-slate-400`}
                      >
                        {formatDateTime(payment.createdAt)}
                      </td>
                      <td className={`px-5 ${settings.compactTable ? "py-2.5" : "py-4"} text-right`}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setDetailOrderCode(payment.orderCode)}
                            title="Xem chi tiết"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(payment)}
                            title="Xóa hóa đơn"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card Grid View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
              {payments.map((payment) => (
                <div
                  key={payment.orderCode}
                  className={`p-5 flex flex-col gap-4 hover:bg-slate-50/30 dark:hover:bg-white/2 transition-colors ${
                    settings.compactTable ? "py-3.5" : "py-5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 uppercase block">
                        Mã đơn hàng
                      </span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base mt-0.5">
                        #{payment.orderCode}
                      </h4>
                    </div>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(payment.status)}`}
                    >
                      {payment.status || "UNKNOWN"}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-450 uppercase block">
                      Người thanh toán
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200">
                      {payment.payerName || "-"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-450 truncate">
                      {payment.payerEmail || "-"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-3.5 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block mb-0.5">Gói cước</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {payment.planName || payment.planId || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block mb-0.5">Số tiền</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                        {formatMoney(payment.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/5 pt-3.5 flex items-center justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-450">
                      <span className="font-medium">Ngày giao dịch: </span>
                      <span className="font-bold text-slate-700 dark:text-slate-350">
                        {formatDateTime(payment.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailOrderCode(payment.orderCode)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(payment)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {detailOrderCode !== null && (
        <PaymentDetailModal
          orderCode={detailOrderCode}
          onClose={() => setDetailOrderCode(null)}
          onDelete={(payment) => {
            setDetailOrderCode(null);
            setDeleteTarget(payment);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          payment={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={deleting}
        />
      )}
    </div>
  );
};

export default AdminPayments;
