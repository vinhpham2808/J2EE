import { COLORS } from "../../constants/colors";

/**
 * Determine visual style (color, background, border, label)
 * for a goal based on its status and progress.
 */
export function getGoalVisual(goal) {
  const progressPercent = Number(goal?.progressPercent || 0);
  const status = String(goal?.status || "ACTIVE").toUpperCase();
  const isBehindSchedule = Boolean(goal?.isBehindSchedule);

  if (status === "COMPLETED") {
    return { color: COLORS.INCOME, bg: COLORS.INCOME_LIGHT, border: "#abefc6", label: "Hoàn thành" };
  }

  if (status === "CANCELLED") {
    return { color: COLORS.TEXT_SECONDARY, bg: COLORS.BG, border: COLORS.CARD_BORDER, label: "Đã hủy" };
  }

  if (isBehindSchedule) {
    return { color: COLORS.EXPENSE, bg: COLORS.EXPENSE_LIGHT, border: "#fecdca", label: "Chậm tiến độ" };
  }

  if (progressPercent >= 75) {
    return { color: COLORS.INCOME, bg: COLORS.INCOME_LIGHT, border: "#abefc6", label: "Đang thực hiện" };
  }

  if (progressPercent >= 40) {
    return { color: COLORS.WARNING, bg: COLORS.WARNING_LIGHT, border: "#fedf89", label: "Đang thực hiện" };
  }

  return { color: COLORS.INFO, bg: COLORS.INFO_LIGHT, border: "#b2ddff", label: "Đang thực hiện" };
}
