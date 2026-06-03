import { COLORS } from "../../constants/colors";

export function formatInsightMoney(value) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  } catch {
    return `${value || 0} VND`;
  }
}

export function getTrendText(trend) {
  if (trend === "UP") return "🔺 Tăng";
  if (trend === "DOWN") return "🔻 Giảm";
  return "➖ Ổn định";
}

export function getTrendColor(trend) {
  if (trend === "UP") return COLORS.EXPENSE;
  if (trend === "DOWN") return COLORS.INCOME;
  return COLORS.INFO;
}
