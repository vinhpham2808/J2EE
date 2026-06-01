import { useContext, useEffect, useMemo, useState } from "react";
import { BadgeCheck, CreditCard, House, ShieldCheck, Sparkles, Star, Zap, Clock, RefreshCw, FileText, Trash2, Eye, X, LoaderCircle, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Dashboard from "../components/Dashboard.jsx";
import { AppContext } from "../context/AppContext.jsx";
import { useUser } from "../hooks/useUser.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { safeRedirect, safeOpenExternal } from "../util/safeNavigation.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import Modal from "../components/Modal.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";

const PAYMENT_STORAGE_KEY = "latestPayment";
const ICON_MAP = { ShieldCheck, Sparkles, Star, Zap };

const STATUS_DETAILS = {
  PAID: { label: "Đã thanh toán", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10", icon: CheckCircle2 },
  PENDING: { label: "Chờ thanh toán", color: "text-amber-500 bg-amber-500/10 border-amber-500/10", icon: Clock },
  PROCESSING: { label: "Đang xử lý", color: "text-blue-500 bg-blue-500/10 border-blue-500/10", icon: Clock },
  FAILED: { label: "Thất bại", color: "text-red-500 bg-red-500/10 border-red-500/10", icon: AlertCircle },
  CANCELLED: { label: "Đã hủy", color: "text-slate-400 bg-slate-500/10 border-slate-500/10", icon: XCircle },
  EXPIRED: { label: "Đã hết hạn", color: "text-slate-400 bg-slate-500/10 border-slate-500/10", icon: XCircle },
  UNDERPAID: { label: "Chưa đủ số tiền", color: "text-amber-500 bg-amber-500/10 border-amber-500/10", icon: AlertCircle }
};

const Payment = () => {
  useUser();
  usePageTitle("Thanh toán nâng cấp");
  const { user } = useContext(AppContext);
  const [rawPlans, setRawPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Fetch plans from API
  useEffect(() => {
    axiosConfig.get(API_ENDPOINTS.GET_SUBSCRIPTION_PLANS)
      .then((res) => setRawPlans(res.data || []))
      .catch(() => toast.error("Không thể tải danh sách gói dịch vụ."))
      .finally(() => setPlansLoading(false));
  }, []);

  const PAYMENT_PLANS = useMemo(() => {
    return rawPlans.map((plan) => ({ ...plan, icon: ICON_MAP[plan.icon] || ShieldCheck }));
  }, [rawPlans]);

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [latestPayment, setLatestPayment] = useState(null);
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [payments, setPayments] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedDetailPayment, setSelectedDetailPayment] = useState(null);
  const [generatingInvoiceCode, setGeneratingInvoiceCode] = useState(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({ show: false, orderCode: null });

  // Set default selected plan after plans load
  useEffect(() => {
    if (PAYMENT_PLANS.length > 0 && !selectedPlanId) {
      setSelectedPlanId(PAYMENT_PLANS[0].planId);
    }
  }, [PAYMENT_PLANS, selectedPlanId]);

  useEffect(() => {
    const savedPayment = localStorage.getItem(PAYMENT_STORAGE_KEY);
    if (!savedPayment) return;
    try {
      const parsedPayment = JSON.parse(savedPayment);
      setLatestPayment(parsedPayment);
      if (parsedPayment.planId) setSelectedPlanId(parsedPayment.planId);
    } catch (error) {
      console.error("Không thể đọc dữ liệu thanh toán đã lưu", error);
      localStorage.removeItem(PAYMENT_STORAGE_KEY);
    }
  }, []);

  const fetchUserPayments = async () => {
    setHistoryLoading(true);
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.USER_PAYMENTS);
      setPayments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch user payments", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPayments();
  }, []);

  const handleDeletePayment = async (orderCode) => {
    try {
      await axiosConfig.delete(API_ENDPOINTS.USER_PAYMENT_DELETE(orderCode));
      toast.success("Xóa hóa đơn thành công!");
      setPayments((prev) => prev.filter((p) => p.orderCode !== orderCode));
      if (selectedDetailPayment?.orderCode === orderCode) {
        setSelectedDetailPayment(null);
      }
      setOpenDeleteAlert({ show: false, orderCode: null });
    } catch {
      toast.error("Không thể xóa hóa đơn này.");
    }
  };

  const handleSyncPayment = async (orderCode) => {
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.SYNC_PAYMENT_STATUS(orderCode));
      toast.success("Đồng bộ trạng thái thành công!");
      setPayments((prev) =>
        prev.map((p) => (p.orderCode === orderCode ? { ...p, status: res.data.status } : p))
      );
      if (selectedDetailPayment?.orderCode === orderCode) {
        setSelectedDetailPayment((prev) => ({ ...prev, status: res.data.status }));
      }
    } catch {
      toast.error("Không thể đồng bộ trạng thái.");
    }
  };

  const handleDownloadInvoice = async (p) => {
    setGeneratingInvoiceCode(p.orderCode);
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.GENERATE_INVOICE, {
        orderCode: p.orderCode,
        amount: p.amount,
        planName: p.planName || p.description,
        paidDate: p.updatedAt || p.createdAt,
      });
      if (response.data?.presignedUrl && safeOpenExternal(response.data.presignedUrl)) {
        toast.success("Đã mở hóa đơn PDF");
      } else {
        toast.error("Không tìm thấy link tải hóa đơn");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi sinh hóa đơn.");
    } finally {
      setGeneratingInvoiceCode(null);
    }
  };

  const selectedPlan = PAYMENT_PLANS.find((plan) => plan.planId === selectedPlanId) ?? PAYMENT_PLANS[0];

  const activeSubscription = useMemo(() => {
    if (user?.subscriptionStatus === "ACTIVE" && user?.subscriptionPlan) {
      const matchedPlan = PAYMENT_PLANS.find((plan) => plan.subscriptionPlan === user.subscriptionPlan) ?? PAYMENT_PLANS[0];
      return { ...matchedPlan, activatedAt: user.subscriptionActivatedAt, expiresAt: user.subscriptionExpiresAt, autoRenew: Boolean(user.autoRenew), orderCode: latestPayment?.orderCode || "--" };
    }
    if (latestPayment?.status === "PAID") {
      const matchedPlan = PAYMENT_PLANS.find((plan) => plan.planId === latestPayment.planId) ?? PAYMENT_PLANS[0];
      return { ...matchedPlan, activatedAt: latestPayment.updatedAt || latestPayment.createdAt, expiresAt: addMonths(latestPayment.updatedAt || latestPayment.createdAt, matchedPlan.cycleMonths), autoRenew: Boolean(latestPayment.autoRenew), orderCode: latestPayment.orderCode };
    }
    return null;
  }, [latestPayment, PAYMENT_PLANS, user]);

  const savePayment = (payment) => { setLatestPayment(payment); localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payment)); };

  const handleCreatePayment = async (event) => {
    event.preventDefault();
    setIsCreating(true);
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.CREATE_PAYMENT, { planId: selectedPlan.planId });
      const paymentData = { ...response.data, planId: selectedPlan.planId, planName: selectedPlan.displayName, cycleLabel: selectedPlan.cycleLabel, cycleMonths: selectedPlan.cycleMonths };
      savePayment(paymentData);
      safeRedirect(response.data.checkoutUrl);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể khởi tạo thanh toán.");
    } finally {
      setIsCreating(false);
    }
  };



  const handleUpgradePlan = () => {
    setShowUpgradeOptions(true);
    if (activeSubscription?.planId === "basic") setSelectedPlanId("premium");
  };

  if (plansLoading) {
    return (
      <Dashboard activeMenu="Thanh toán">
        <div className="mx-auto my-6 max-w-5xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-slate-200 dark:bg-white/10 rounded-lg" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-64 bg-slate-200 dark:bg-white/10 rounded-2xl" />
              <div className="h-64 bg-slate-200 dark:bg-white/10 rounded-2xl" />
            </div>
          </div>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard activeMenu="Thanh toán">
      <div className="mx-auto my-6 max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thanh toán</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {activeSubscription
              ? "Gói của bạn đang hoạt động. Bạn có thể quản lý hoặc nâng cấp bất cứ lúc nào."
              : "Chọn gói dịch vụ phù hợp và thanh toán nhanh qua PayOS."}
          </p>
        </div>

        {activeSubscription && !showUpgradeOptions ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A]">
            <div className="grid xl:grid-cols-[1.15fr_0.85fr]">
              {/* Left gradient panel */}
              <div className="p-7 bg-linear-to-br from-violet-700 to-violet-900 text-white">
                <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-white/60 mb-5">
                  <Star size={15} /><span>Gói đang hoạt động</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">{activeSubscription.displayName} đang hoạt động</h2>
                <p className="text-white/70 text-sm leading-relaxed mb-7">
                  Bạn đã sở hữu gói này và đang dùng đầy đủ các quyền lợi của tài khoản nâng cấp.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 mb-7">
                  {activeSubscription.features.map((feature) => (
                    <div key={feature} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium flex items-center gap-2">
                      <BadgeCheck size={15} className="text-emerald-300" />{feature}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleUpgradePlan} type="button" className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition">
                    <Zap size={15} />{activeSubscription.subscriptionPlan === "PREMIUM" ? "Chuyển đổi gói" : "Nâng cấp gói"}
                  </button>
                  <Link to="/dashboard" className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition">
                    <House size={15} />Về tổng quan
                  </Link>
                </div>
              </div>

              {/* Right info panel */}
              <div className="p-7 bg-slate-50 dark:bg-white/3">
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Gói hiện tại</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{activeSubscription.displayName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                  Tài khoản của bạn đang ở trạng thái sở hữu gói nên không cần thanh toán lại.
                </p>
                <div className="space-y-2">
                  <SubscriptionRow label="Trạng thái" value="Đang hoạt động" />
                  <SubscriptionRow label="Ngày kích hoạt" value={formatDate(activeSubscription.activatedAt)} />
                  <SubscriptionRow label="Ngày hết hạn" value={formatDate(activeSubscription.expiresAt)} />
                  <SubscriptionRow label="Mã đơn hàng" value={activeSubscription.orderCode || "--"} />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-6">
            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {activeSubscription ? (activeSubscription.subscriptionPlan === "PREMIUM" ? "Chuyển đổi gói của bạn" : "Nâng cấp gói của bạn") : "Chọn gói dịch vụ"}
                </h2>
                {activeSubscription && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                    {activeSubscription.subscriptionPlan === "PREMIUM"
                      ? "Chọn gói mới để chuyển đổi hoặc gia hạn tài khoản."
                      : "Chọn gói mới để nâng cấp hoặc gia hạn tài khoản."}
                  </p>
                )}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {PAYMENT_PLANS.map((plan) => {
                    const isSelected = plan.planId === selectedPlanId;
                    const isCurrentPlan = activeSubscription?.planId === plan.planId;
                    const Icon = plan.icon;
                    return (
                      <button
                        key={plan.planId}
                        className={`rounded-2xl border p-5 text-left transition ${
                          isSelected
                            ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                            : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white hover:border-violet-500/50"
                        }`}
                        onClick={() => setSelectedPlanId(plan.planId)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className={`rounded-xl p-2.5 ${isSelected ? "bg-white/15" : "bg-violet-600 text-white"}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {isCurrentPlan && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isSelected ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"}`}>Đang dùng</span>}
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isSelected ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400"}`}>{plan.badge}</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold mb-1">{plan.displayName}</h3>
                        <p className={`text-sm mb-4 ${isSelected ? "text-white/70" : "text-slate-500 dark:text-slate-400"}`}>{plan.features[0]}</p>
                        <p className="text-2xl font-bold mb-4">{Number(plan.amount).toLocaleString("vi-VN")} VND</p>
                        <div className="space-y-1.5">
                          {plan.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm">
                              <BadgeCheck size={14} className={isSelected ? "text-emerald-300" : "text-emerald-500"} />{feature}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6" onSubmit={handleCreatePayment}>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">
                  {activeSubscription ? "Gói chuẩn bị cập nhật" : "Gói đã chọn"}
                </p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{selectedPlan.displayName}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                  {activeSubscription ? "Sau khi thanh toán, gói hiện tại sẽ được cập nhật." : "Bạn sẽ được chuyển đến cổng thanh toán PayOS."}
                </p>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 mb-5">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-3 mb-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Tổng thanh toán</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{Number(selectedPlan.amount).toLocaleString("vi-VN")} VND</span>
                  </div>
                  <div className="space-y-2">
                    <SubscriptionRow label="Tên gói" value={selectedPlan.displayName} />
                    <SubscriptionRow label="Mô tả" value={selectedPlan.description} />
                    <SubscriptionRow label="Chu kỳ" value={selectedPlan.cycleLabel} />
                  </div>
                </div>
                <button
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition transform-gpu active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isCreating}
                  type="submit"
                >
                  <CreditCard size={16} />
                  {isCreating ? "Đang chuyển..." : activeSubscription ? selectedPlan.planId === activeSubscription.planId ? "Gia hạn gói" : activeSubscription.subscriptionPlan === "PREMIUM" ? "Chuyển đổi gói" : "Nâng cấp gói" : "Thanh toán"}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* ─── Lịch sử hóa đơn / Thanh toán ─── */}
        <section className="bg-white dark:bg-[#0F172A] border border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lịch sử hóa đơn & Thanh toán</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Danh sách các hóa đơn thanh toán của tài khoản nâng cấp.</p>
          </div>

          {historyLoading ? (
            <div className="overflow-x-auto animate-pulse">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Mã đơn hàng</th>
                    <th className="py-3 px-4">Gói dịch vụ</th>
                    <th className="py-3 px-4">Số tiền</th>
                    <th className="py-3 px-4">Ngày giao dịch</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {[1, 2, 3, 4].map((i) => (
                    <tr key={i}>
                      <td className="py-3.5 px-4">
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700/50 rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700/50 rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700/50 rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700/50 rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700/50 rounded-full" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
                          <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Mã đơn hàng</th>
                    <th className="py-3 px-4">Gói dịch vụ</th>
                    <th className="py-3 px-4">Số tiền</th>
                    <th className="py-3 px-4">Ngày giao dịch</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-650 dark:text-slate-350">
                  {payments.map((p) => {
                    const statusInfo = STATUS_DETAILS[p.status] || STATUS_DETAILS.PENDING;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <tr key={p.orderCode} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">#{p.orderCode}</td>
                        <td className="py-3.5 px-4 font-semibold">{p.planName}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{p.amount.toLocaleString("vi-VN")} VND</td>
                        <td className="py-3.5 px-4 font-medium">{new Date(p.createdAt).toLocaleString("vi-VN")}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                            <StatusIcon size={10} />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedDetailPayment(p)}
                              className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye size={13} />
                            </button>
                            {p.status === "PAID" && (
                              <button
                                onClick={() => handleDownloadInvoice(p)}
                                disabled={generatingInvoiceCode === p.orderCode}
                                className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition cursor-pointer disabled:opacity-50"
                                title="Tải hóa đơn PDF"
                              >
                                {generatingInvoiceCode === p.orderCode ? (
                                  <LoaderCircle size={13} className="animate-spin" />
                                ) : (
                                  <FileText size={13} />
                                )}
                              </button>
                            )}
                            {p.status !== "PAID" && (
                              <button
                                onClick={() => handleSyncPayment(p.orderCode)}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition cursor-pointer"
                                title="Đồng bộ trạng thái"
                              >
                                <RefreshCw size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => setOpenDeleteAlert({ show: true, orderCode: p.orderCode })}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-655 dark:text-red-400 transition cursor-pointer"
                              title="Xóa hóa đơn"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/20 dark:bg-white/[0.01]">
              <FileText size={32} className="mx-auto mb-3 text-slate-350" />
              <p className="text-xs font-semibold">Chưa có lịch sử giao dịch hoặc hóa đơn nào.</p>
            </div>
          )}
        </section>

        {/* ─── Detail Modal ─── */}
        {selectedDetailPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 to-indigo-600"></div>
              
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Chi tiết hóa đơn</h3>
                <button
                  onClick={() => setSelectedDetailPayment(null)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15 transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-white/3 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Mã đơn hàng</p>
                    <p className="font-extrabold text-slate-900 dark:text-white text-sm">#{selectedDetailPayment.orderCode}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/3 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Trạng thái</p>
                    {(() => {
                      const statusInfo = STATUS_DETAILS[selectedDetailPayment.status] || STATUS_DETAILS.PENDING;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${statusInfo.color}`}>
                          <StatusIcon size={9} />
                          {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <SubscriptionRow label="Gói đăng ký" value={selectedDetailPayment.planName} />
                  <SubscriptionRow label="Số tiền thanh toán" value={`${selectedDetailPayment.amount.toLocaleString("vi-VN")} VND`} />
                  <SubscriptionRow label="Nội dung chuyển khoản" value={selectedDetailPayment.description} />
                  <SubscriptionRow label="Mã liên kết PayOS" value={selectedDetailPayment.paymentLinkId || "Chưa có"} />
                  <SubscriptionRow label="Thời gian tạo hóa đơn" value={new Date(selectedDetailPayment.createdAt).toLocaleString("vi-VN")} />
                  <SubscriptionRow label="Cập nhật trạng thái lúc" value={new Date(selectedDetailPayment.updatedAt).toLocaleString("vi-VN")} />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-900/20">
                {selectedDetailPayment.status === "PAID" && (
                  <button
                    onClick={() => handleDownloadInvoice(selectedDetailPayment)}
                    disabled={generatingInvoiceCode === selectedDetailPayment.orderCode}
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition disabled:opacity-50 text-xs shadow-md cursor-pointer"
                  >
                    {generatingInvoiceCode === selectedDetailPayment.orderCode ? (
                      <LoaderCircle size={13} className="animate-spin" />
                    ) : (
                      <><FileText size={13} /> Tải hóa đơn PDF</>
                    )}
                  </button>
                )}
                {selectedDetailPayment.status !== "PAID" && (
                  <button
                    onClick={() => handleSyncPayment(selectedDetailPayment.orderCode)}
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold transition text-xs shadow-md cursor-pointer"
                  >
                    <RefreshCw size={13} /> Đồng bộ lại
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedDetailPayment(null);
                    setOpenDeleteAlert({ show: true, orderCode: selectedDetailPayment.orderCode });
                  }}
                  className="inline-flex items-center gap-1.5 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition text-xs shadow-md cursor-pointer"
                >
                  <Trash2 size={13} /> Xóa hóa đơn
                </button>
                <button
                  onClick={() => setSelectedDetailPayment(null)}
                  className="py-2 px-4 bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Delete Confirmation Modal ─── */}
        <Modal
          isOpen={openDeleteAlert.show}
          onClose={() => setOpenDeleteAlert({ show: false, orderCode: null })}
          title="Xóa hóa đơn"
        >
          <DeleteAlert
            content="Bạn có chắc chắn muốn xóa hóa đơn này khỏi lịch sử giao dịch không?"
            onDelete={() => handleDeletePayment(openDeleteAlert.orderCode)}
            onCancel={() => setOpenDeleteAlert({ show: false, orderCode: null })}
          />
        </Modal>
      </div>
    </Dashboard>
  );
};

const SubscriptionRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5">
    <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    <span className="max-w-[60%] wrap-break-word text-right text-xs font-semibold text-slate-900 dark:text-white">{value}</span>
  </div>
);

const addMonths = (dateValue, months) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
};

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
};

export default Payment;
