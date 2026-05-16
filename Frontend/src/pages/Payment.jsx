import { useContext, useEffect, useMemo, useState } from "react";
import { BadgeCheck, CreditCard, House, Settings2, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Dashboard from "../components/Dashboard.jsx";
import { AppContext } from "../context/AppContext.jsx";
import { useUser } from "../hooks/useUser.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

const PAYMENT_STORAGE_KEY = "latestPayment";
const ICON_MAP = { ShieldCheck, Sparkles, Star, Zap };

const Payment = () => {
  useUser();
  usePageTitle("Thanh toán nâng cấp");
  const { user, setUser } = useContext(AppContext);
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
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Set default selected plan after plans load
  useEffect(() => {
    if (PAYMENT_PLANS.length > 0 && !selectedPlanId) {
      setSelectedPlanId(PAYMENT_PLANS[0].planId);
    }
  }, [PAYMENT_PLANS]);

  useEffect(() => {
    const savedPayment = localStorage.getItem(PAYMENT_STORAGE_KEY);
    if (!savedPayment) return;
    try {
      const parsedPayment = JSON.parse(savedPayment);
      setLatestPayment(parsedPayment);
      setAutoRenew(Boolean(parsedPayment.autoRenew));
      if (parsedPayment.planId) setSelectedPlanId(parsedPayment.planId);
    } catch (error) {
      console.error("Không thể đọc dữ liệu thanh toán đã lưu", error);
      localStorage.removeItem(PAYMENT_STORAGE_KEY);
    }
  }, []);

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
      const paymentData = { ...response.data, planId: selectedPlan.planId, planName: selectedPlan.displayName, cycleLabel: selectedPlan.cycleLabel, cycleMonths: selectedPlan.cycleMonths, autoRenew };
      savePayment(paymentData);
      window.location.href = response.data.checkoutUrl;
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể khởi tạo thanh toán.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    const nextValue = !autoRenew;
    setAutoRenew(nextValue);
    if (latestPayment) savePayment({ ...latestPayment, autoRenew: nextValue });
    try {
      const response = await axiosConfig.put(API_ENDPOINTS.UPDATE_AUTO_RENEW, { enabled: nextValue });
      setUser(response.data);
    } catch (error) {
      setAutoRenew(!nextValue);
      toast.error(error.response?.data?.message || "Không thể cập nhật tùy chọn tự gia hạn.");
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
                  <button onClick={handleUpgradePlan} type="button" className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-all">
                    <Zap size={15} />Nâng cấp gói
                  </button>
                  <button onClick={() => setShowManagePanel((v) => !v)} type="button" className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-all">
                    <Settings2 size={15} />Quản lý gói
                  </button>
                  <Link to="/dashboard" className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-all">
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
                  <SubscriptionRow label="Tự gia hạn" value={autoRenew ? "Bật" : "Tắt"} />
                  <SubscriptionRow label="Mã đơn hàng" value={activeSubscription.orderCode || "--"} />
                </div>
                {showManagePanel && (
                  <div className="mt-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">Tự gia hạn</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Điều chỉnh cách gói được duy trì sau khi hết hạn.</p>
                      </div>
                      <button className={`relative h-7 w-12 rounded-full transition-all ${autoRenew ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"}`} onClick={handleToggleAutoRenew} type="button">
                        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${autoRenew ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {autoRenew ? "Tự gia hạn đang bật. Hệ thống sẽ giữ gói liền mạch." : "Tự gia hạn đang tắt. Bạn có thể gia hạn hoặc nâng cấp bất cứ lúc nào."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-6">
            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {activeSubscription ? "Nâng cấp gói của bạn" : "Chọn gói dịch vụ"}
                </h2>
                {activeSubscription && <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Chọn gói mới để nâng cấp hoặc gia hạn tài khoản.</p>}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {PAYMENT_PLANS.map((plan) => {
                    const isSelected = plan.planId === selectedPlanId;
                    const isCurrentPlan = activeSubscription?.planId === plan.planId;
                    const Icon = plan.icon;
                    return (
                      <button
                        key={plan.planId}
                        className={`rounded-2xl border p-5 text-left transition-all ${
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
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isCreating}
                  type="submit"
                >
                  <CreditCard size={16} />
                  {isCreating ? "Đang chuyển..." : activeSubscription ? selectedPlan.planId === activeSubscription.planId ? "Gia hạn gói" : "Nâng cấp gói" : "Thanh toán"}
                </button>
              </form>
            </div>
          </section>
        )}
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
