import { ArrowLeft, RefreshCcw, XCircle, Hash, CalendarClock, AlertTriangle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import Footer from "../components/Footer.jsx";

const PAYMENT_STORAGE_KEY = "latestPayment";

const PAYMENT_STATUS_LABELS = {
  PAID: "Đã thanh toán thành công",
  PENDING: "Đang chờ thanh toán",
  PROCESSING: "Đang xử lý",
  FAILED: "Thanh toán thất bại",
  CANCELLED: "Đã hủy",
  EXPIRED: "Đã hết hạn",
  UNDERPAID: "Thanh toán chưa đủ",
};

const CANCEL_REASONS = [
  "Bạn đã chủ động hủy giao dịch",
  "Phiên thanh toán hết hạn",
  "Lỗi kết nối khi xử lý",
];

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  usePageTitle("Thanh toán bị hủy");
  const [isSyncing, setIsSyncing] = useState(false);

  const orderCode = useMemo(() => {
    return (
      searchParams.get("orderCode") ||
      JSON.parse(localStorage.getItem(PAYMENT_STORAGE_KEY) || "null")?.orderCode ||
      ""
    );
  }, [searchParams]);

  const cancelledAt = useMemo(() => {
    return new Date().toISOString();
  }, []);

  const savedPayment = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(PAYMENT_STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }, []);

  const handleSyncStatus = async () => {
    if (!orderCode) { toast.error("Không tìm thấy mã đơn hàng."); return; }
    setIsSyncing(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.SYNC_PAYMENT_STATUS(orderCode));
      localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(response.data));
      toast.success(`Trạng thái thanh toán: ${PAYMENT_STATUS_LABELS[response.data.status] || response.data.status}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể đồng bộ trạng thái thanh toán.");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "medium" }).format(date);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E1A] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-lg">

          {/* Icon + header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl
              bg-red-100 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/20
              text-red-500 dark:text-red-400 mb-5 shadow-lg shadow-red-100/60 dark:shadow-red-900/20">
              <XCircle size={38} strokeWidth={1.5} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-500 dark:text-red-400 mb-2">
              Thanh toán đã bị hủy
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug mb-3">
              Giao dịch chưa hoàn tất
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Quá trình thanh toán đã bị hủy hoặc gián đoạn. Đơn hàng của bạn vẫn được lưu lại và có thể thanh toán lại bất kỳ lúc nào.
            </p>
          </div>

          {/* Main card */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10
            bg-white dark:bg-[#0F172A] shadow-xl shadow-slate-200/60 dark:shadow-black/40 overflow-hidden mb-4">

            {/* Status banner */}
            <div className="bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/15 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Trạng thái</p>
                  <p className="text-base font-bold text-red-600 dark:text-red-400">Đã hủy / Chưa hoàn tất</p>
                </div>
                <span className="shrink-0 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30
                  px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  CANCELLED
                </span>
              </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
              <DetailCard
                icon={Hash}
                label="Mã đơn hàng"
                value={orderCode || "--"}
              />
              <DetailCard
                icon={CalendarClock}
                label="Thời gian hủy"
                value={formatDateTime(cancelledAt)}
              />
              {savedPayment?.description && (
                <div className="sm:col-span-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">Nội dung thanh toán</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{savedPayment.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reasons info */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20
            bg-amber-50 dark:bg-amber-500/5 px-5 py-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Lý do phổ biến dẫn đến hủy giao dịch:</p>
                <ul className="space-y-1">
                  {CANCEL_REASONS.map((reason) => (
                    <li key={reason} className="text-xs text-amber-700/80 dark:text-amber-300/70 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/payment"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl
                bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                px-5 py-3 text-sm font-semibold text-white
                transition-all active:scale-[0.98] shadow-md shadow-violet-500/20"
            >
              <ArrowLeft size={15} />
              Quay lại trang thanh toán
            </Link>
            <button
              className="flex-1 flex items-center justify-center gap-2 rounded-xl
                border border-slate-200 dark:border-white/10
                bg-white dark:bg-white/5
                hover:bg-slate-50 dark:hover:bg-white/10
                active:scale-[0.98]
                px-5 py-3 text-sm font-semibold
                text-slate-700 dark:text-slate-300
                transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!orderCode || isSyncing}
              onClick={handleSyncStatus}
              type="button"
            >
              <RefreshCcw size={15} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Đang kiểm tra..." : "Kiểm tra lại trạng thái"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const DetailCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 px-4 py-3">
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
      <Icon size={14} /><span>{label}</span>
    </div>
    <p className="text-sm font-semibold text-slate-900 dark:text-white break-all">{value}</p>
  </div>
);

export default PaymentCancel;
