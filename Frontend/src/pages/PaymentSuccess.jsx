import { useContext, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BadgeCheck, CalendarClock, CreditCard,
  Hash, House, FileText, LoaderCircle, CheckCircle2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { safeOpenExternal } from "../util/safeNavigation.js";
import { AppContext } from "../context/AppContext.jsx";
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

const NEXT_STEPS = [
  "Gói dịch vụ đã được kích hoạt ngay lập tức",
  "Email xác nhận sẽ được gửi đến hộp thư của bạn",
  "Bạn có thể tải hóa đơn PDF bên dưới",
];

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  usePageTitle("Thanh toán thành công");
  const { setUser } = useContext(AppContext);
  const [payment, setPayment] = useState(null);
  const [arrivedAt] = useState(() => new Date().toISOString());
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!payment?.orderCode) return;
    setIsGeneratingInvoice(true);
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.GENERATE_INVOICE, {
        orderCode: payment.orderCode,
        amount: payment.amount,
        planName: payment.planName || payment.description,
        paidDate: payment.updatedAt || payment.createdAt || arrivedAt,
      });
      if (response.data?.presignedUrl && safeOpenExternal(response.data.presignedUrl)) {
        toast.success("Đã mở hóa đơn PDF");
      } else {
        toast.error("Không tìm thấy link tải hóa đơn");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi sinh hóa đơn. Vui lòng kiểm tra lại cấu hình AWS Lambda.");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const orderCode = useMemo(() => {
    const savedPayment = JSON.parse(localStorage.getItem(PAYMENT_STORAGE_KEY) || "null");
    return searchParams.get("orderCode") || savedPayment?.orderCode || "";
  }, [searchParams]);

  const transactionIdFromUrl = searchParams.get("id");

  useEffect(() => {
    const syncPaymentAndProfile = async () => {
      const savedPayment = localStorage.getItem(PAYMENT_STORAGE_KEY);
      const parsedSavedPayment = savedPayment ? JSON.parse(savedPayment) : null;
      const nextPayment = {
        ...parsedSavedPayment,
        orderCode: searchParams.get("orderCode") || parsedSavedPayment?.orderCode || "",
        paymentLinkId: transactionIdFromUrl || parsedSavedPayment?.paymentLinkId || "",
        // Do NOT trust URL status param — always use backend as source of truth
        status: parsedSavedPayment?.status || "PENDING",
      };
      setPayment(nextPayment);
      localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(nextPayment));
      if (!nextPayment.orderCode) return;
      try {
        const paymentResponse = await axiosConfig.get(API_ENDPOINTS.SYNC_PAYMENT_STATUS(nextPayment.orderCode));
        const mergedPayment = {
          ...nextPayment,
          ...paymentResponse.data,
          // Always use backend-confirmed status, never the URL parameter
          status: paymentResponse.data.status,
        };
        setPayment(mergedPayment);
        localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(mergedPayment));
        const profileResponse = await axiosConfig.get(API_ENDPOINTS.GET_USER_INFO);
        setUser(profileResponse.data);
      } catch (error) {
        console.error("Không thể đồng bộ trạng thái thanh toán thành công", error);
      }
    };
    syncPaymentAndProfile();
  }, [orderCode, searchParams, setUser, transactionIdFromUrl]);

  const displayStatus = payment?.status || "PENDING";
  const isPaid = displayStatus === "PAID";
  const transactionId = transactionIdFromUrl || payment?.paymentLinkId || "--";
  const amount = payment?.amount;
  const description = payment?.description || "Thanh toán PayOS";
  const displayedTime = payment?.updatedAt || payment?.createdAt || arrivedAt;

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
              bg-emerald-100 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/20
              text-emerald-500 dark:text-emerald-400 mb-5
              shadow-lg shadow-emerald-100/80 dark:shadow-emerald-900/20">
              <BadgeCheck size={38} strokeWidth={1.5} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
              Thanh toán thành công
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug mb-3">
              Giao dịch đã được xác nhận
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Cảm ơn bạn đã tin tưởng sử dụng dịch vụ. Gói của bạn đã được kích hoạt ngay lập tức.
            </p>
          </div>

          {/* Main card */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10
            bg-white dark:bg-[#0F172A] shadow-xl shadow-slate-200/60 dark:shadow-black/40 overflow-hidden mb-4">

            {/* Status banner */}
            <div className={`border-b px-5 py-4 ${
              isPaid
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/15"
                : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10"
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Trạng thái thanh toán</p>
                  <p className={`text-base font-bold ${
                    isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                  }`}>
                    {PAYMENT_STATUS_LABELS[displayStatus] || displayStatus}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                  isPaid
                    ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                }`}>
                  {displayStatus}
                </span>
              </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
              <DetailCard icon={Hash} label="Mã đơn hàng" value={payment?.orderCode || orderCode || "--"} />
              <DetailCard icon={CreditCard} label="Mã giao dịch" value={transactionId} />
              <DetailCard
                icon={BadgeCheck}
                label="Số tiền"
                value={amount ? `${Number(amount).toLocaleString("vi-VN")} VND` : "--"}
                highlight={isPaid}
              />
              <DetailCard icon={CalendarClock} label="Thời gian" value={formatDateTime(displayedTime)} />
              <div className="sm:col-span-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-4 py-3">
                <p className="text-xs text-slate-400 mb-0.5">Nội dung thanh toán</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{description}</p>
              </div>
            </div>
          </div>

          {/* Next steps */}
          {isPaid && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20
              bg-emerald-50 dark:bg-emerald-500/5 px-5 py-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500 dark:text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Các bước tiếp theo:</p>
                  <ul className="space-y-1">
                    {NEXT_STEPS.map((step) => (
                      <li key={step} className="text-xs text-emerald-700/80 dark:text-emerald-300/70 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl
                bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                px-5 py-3 text-sm font-semibold text-white
                transition transform-gpu active:scale-[0.98] shadow-md shadow-violet-500/20"
            >
              <House size={15} />
              Về trang chủ
            </Link>

            {isPaid && (
              <button
                onClick={handleDownloadInvoice}
                disabled={isGeneratingInvoice}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl
                  bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
                  px-5 py-3 text-sm font-semibold text-white
                  transition transform-gpu active:scale-[0.98] shadow-md shadow-emerald-500/20
                  disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGeneratingInvoice ? (
                  <><LoaderCircle size={15} className="animate-spin" />Đang tạo...</>
                ) : (
                  <><FileText size={15} />Tải hóa đơn PDF</>
                )}
              </button>
            )}

            <Link
              to="/payment"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl
                border border-slate-200 dark:border-white/10
                bg-white dark:bg-white/5
                hover:bg-slate-50 dark:hover:bg-white/10
                active:scale-[0.98]
                px-5 py-3 text-sm font-semibold
                text-slate-700 dark:text-slate-300
                transition"
            >
              Trang thanh toán<ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

const DetailCard = ({ icon: Icon, label, value, highlight = false }) => (
  <div className="rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 px-4 py-3">
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
      <Icon size={14} /><span>{label}</span>
    </div>
    <p className={`text-sm font-semibold break-all ${
      highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
    }`}>
      {value}
    </p>
  </div>
);

export default PaymentSuccess;
