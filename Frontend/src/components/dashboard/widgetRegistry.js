import {
  Sparkles,
  WalletCards,
  BarChart2,
  ArrowLeftRight,
  PieChart,
  Coins,
  Target,
} from "lucide-react";

export const WIDGET_REGISTRY = {
  ai_assistant: {
    label: "Nova Money - Trợ lý AI",
    description: "Gợi ý thông minh từ Nova Money - Trợ lý AI",
    icon: Sparkles,
    pinned: true,
  },
  kpi_cards: {
    label: "Thẻ số liệu",
    description: "6 chỉ số tài chính tổng quan",
    icon: WalletCards,
    pinned: false,
  },
  monthly_history: {
    label: "Tổng quan thu chi",
    description: "Biểu đồ thu chi theo tháng",
    icon: BarChart2,
    pinned: false,
  },
  recent_transactions: {
    label: "Giao dịch gần đây",
    description: "5 giao dịch mới nhất",
    icon: ArrowLeftRight,
    pinned: false,
  },
  finance_overview: {
    label: "Cơ cấu tài chính",
    description: "Biểu đồ tròn phân bổ tài chính",
    icon: PieChart,
    pinned: false,
  },
  budget_progress: {
    label: "Ngân sách tháng",
    description: "Tiến độ ngân sách các danh mục",
    icon: Coins,
    pinned: false,
  },
  priority_goal: {
    label: "Mục tiêu ưu tiên",
    description: "Mục tiêu tiết kiệm quan trọng nhất",
    icon: Target,
    pinned: false,
  },
};
