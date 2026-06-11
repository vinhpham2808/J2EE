import { COLORS } from "../constants/colors";

export const DEFAULT_ALERT_TITLE = "Thông báo";
export const DEFAULT_ALERT_BUTTON_TEXT = "Đã hiểu";

export const APP_ALERT_VARIANTS = {
  success: {
    label: "Thành công",
    icon: "checkmark",
    accent: "#4ADE70",
    accentDark: "#22C55E",
    soft: COLORS.INCOME_LIGHT,
    glow: "rgba(34, 197, 94, 0.15)",
    title: COLORS.TEXT
  },
  error: {
    label: "Có lỗi",
    icon: "close",
    accent: "#EF3B3B",
    accentDark: "#DC2626",
    soft: COLORS.EXPENSE_LIGHT,
    glow: "rgba(239, 68, 68, 0.15)",
    title: COLORS.TEXT
  },
  warning: {
    label: "Cần chú ý",
    icon: "warning-outline",
    accent: COLORS.WARNING,
    accentDark: "#D97706",
    soft: COLORS.WARNING_LIGHT,
    glow: "rgba(255, 184, 77, 0.2)",
    title: COLORS.TEXT
  },
  confirm: {
    label: "Xác nhận",
    icon: "warning-outline",
    accent: COLORS.WARNING,
    accentDark: "#D97706",
    soft: COLORS.ROSE_MIST,
    glow: "rgba(255, 184, 77, 0.2)",
    title: COLORS.TEXT
  },
  info: {
    label: "Thông tin",
    icon: "information-circle-outline",
    accent: COLORS.INFO,
    accentDark: "#2563EB",
    soft: COLORS.INFO_LIGHT,
    glow: "rgba(107, 155, 210, 0.15)",
    title: COLORS.TEXT
  }
};

const ALERT_KEYWORDS = {
  success: ["thanh cong", "hoan tat", "da gui"],
  error: ["that bai", "loi", "khong the", "khong mo duoc", "bi tu choi"],
  warning: ["thieu", "sai", "khong hop le", "hop le", "yeu", "can"],
  confirm: ["xac nhan", "ban co chac"]
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasAnyKeyword(content, keywords) {
  return keywords.some((keyword) => content.includes(keyword));
}

export function resolveAlertVariant(title, message, buttons) {
  const content = `${normalizeText(title)} ${normalizeText(message)}`;
  const hasDestructiveAction = buttons?.some((button) => button?.style === "destructive");

  if (hasDestructiveAction || hasAnyKeyword(content, ALERT_KEYWORDS.confirm)) {
    return "confirm";
  }

  if (hasAnyKeyword(content, ALERT_KEYWORDS.error)) {
    return "error";
  }

  if (hasAnyKeyword(content, ALERT_KEYWORDS.warning)) {
    return "warning";
  }

  if (hasAnyKeyword(content, ALERT_KEYWORDS.success)) {
    return "success";
  }

  return "info";
}
