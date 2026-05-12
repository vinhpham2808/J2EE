export const DEFAULT_PAYMENT_PLANS = [
  {
    id: "basic",
    subscriptionPlan: "BASIC",
    displayName: "Gói Cơ Bản",
    amount: 2000,
    description: "Gói dành cho người dùng mới",
    badge: "Phổ biến",
    cycleLabel: "1 tháng",
    cycleMonths: 1,
    icon: "ShieldCheck",
    accent: "from-slate-900 via-slate-800 to-slate-700",
    features: [
      "Theo dõi giao dịch hằng ngày",
      "Phân tích tài chính cơ bản bằng AI",
      "Báo cáo thu chi hàng tháng",
      "Nhắc nhở thanh toán định kỳ"
    ]
  },
  {
    id: "premium",
    subscriptionPlan: "PREMIUM",
    displayName: "Gói Premium",
    amount: 299000,
    description: "Gói mở rộng với nhiều tính năng nâng cao",
    badge: "Nâng cao",
    cycleLabel: "12 tháng",
    cycleMonths: 12,
    icon: "Sparkles",
    accent: "from-amber-500 via-orange-500 to-rose-500",
    features: [
      "Không giới hạn lịch sử giao dịch",
      "Phân tích tài chính chuyên sâu bằng AI",
      "Import hóa đơn bằng ảnh tự động",
      "Xuất báo cáo Excel & PDF",
      "Ưu tiên hỗ trợ kỹ thuật"
    ]
  }
];

export const getPaymentPlans = () => {
  const saved = localStorage.getItem("payment_plans");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const isStale = parsed.some(p => !p.features || p.features.length === 0);
      if (isStale) {
        return parsed.map(p => {
          const def = DEFAULT_PAYMENT_PLANS.find(d => d.id === p.id);
          return { ...def, ...p, features: p.features?.length ? p.features : (def?.features ?? []) };
        });
      }
      return parsed;
    } catch (e) {
      console.error("Không thể tải danh sách gói dịch vụ", e);
    }
  }
  return DEFAULT_PAYMENT_PLANS;
};

export const savePaymentPlans = (plans) => {
  localStorage.setItem("payment_plans", JSON.stringify(plans));
};
