import { ArrowLeft, CircleAlert, RefreshCcw } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E1A] px-6 py-12 flex flex-col">
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 dark:border-red-500/20
        bg-white dark:bg-[#0F172A] p-8 shadow-2xl shadow-red-100/40 dark:shadow-black/40 flex-1">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl
          bg-red-100 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 mb-6">
          <CircleAlert size={28} />
        </div>

        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">Thanh toán đã bị hủy</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Quá trình thanh toán đã bị hủy hoặc chưa được hoàn tất.
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Bạn có thể quay lại trang thanh toán để tạo liên kết mới, hoặc làm mới trạng thái đơn hàng hiện tại nếu việc thanh toán đã hoàn tất ở tab khác.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
            to="/payment"
          >
            <ArrowLeft size={15} />Quay lại trang thanh toán
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentCancel;
