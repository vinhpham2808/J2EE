import { COLORS } from "../constants/colors";

// ─── Trend Labels ────────────────────────────────────────────
export const TREND_CONFIG = {
  UP: {
    label: "Tăng",
    color: COLORS.EXPENSE,
    icon: "🔺",
  },
  DOWN: {
    label: "Giảm",
    color: COLORS.INCOME,
    icon: "🔻",
  },
  STABLE: {
    label: "Ổn định",
    color: COLORS.INFO,
    icon: "➖",
  },
};

// ─── Month Labels ────────────────────────────────────────────
export const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

export const SHORT_MONTHS = [
  "T1", "T2", "T3", "T4", "T5", "T6",
  "T7", "T8", "T9", "T10", "T11", "T12",
];

// ─── Category Chip Colors ────────────────────────────────────
export const CATEGORY_COLORS = [
  COLORS.PRIMARY, COLORS.GOLD, COLORS.INFO, COLORS.INCOME,
  COLORS.EXPENSE, COLORS.WARNING, COLORS.PRIMARY_DARK, COLORS.PRIMARY_LIGHT,
];

// ─── BarChart Config ─────────────────────────────────────────
export const barChartConfig = {
  backgroundColor: COLORS.CARD,
  backgroundGradientFrom: COLORS.CARD,
  backgroundGradientTo: COLORS.CARD,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(232, 89, 122, ${opacity})`,
  labelColor: () => COLORS.TEXT_SECONDARY,
  barPercentage: 0.5,
  propsForLabels: {
    fontSize: 10,
  },
  propsForBackgroundLines: {
    strokeDasharray: "4 4",
    stroke: COLORS.CARD_BORDER,
    strokeWidth: 1,
  },
};

// ─── LineChart Config ────────────────────────────────────────
export const lineChartConfig = {
  backgroundColor: COLORS.CARD,
  backgroundGradientFrom: COLORS.CARD,
  backgroundGradientTo: COLORS.CARD,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(232, 89, 122, ${opacity})`,
  labelColor: () => COLORS.TEXT_SECONDARY,
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: COLORS.PRIMARY,
  },
  propsForLabels: {
    fontSize: 10,
  },
  propsForBackgroundLines: {
    strokeDasharray: "4 4",
    stroke: COLORS.CARD_BORDER,
    strokeWidth: 1,
  },
};

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Extract valid {year, month} from navigation route params.
 * Returns null if params are missing or invalid.
 */
export function getRouteForecastMonth(params) {
  const year = Number(params?.year);
  const month = Number(params?.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

/**
 * Build forecast object from a cached AI draft.
 */
export function buildForecastFromDraft(draft) {
  return {
    year: draft.year,
    month: draft.month,
    categories: Array.isArray(draft.categories) ? draft.categories : [],
  };
}

/**
 * Build insight object from a cached AI draft.
 * Returns null if draft has no narrative.
 */
export function buildInsightFromDraft(draft) {
  if (!draft?.narrative) return null;
  return {
    narrative: draft.narrative,
    generatedAt: draft.generatedAt,
    year: draft.year,
    month: draft.month,
  };
}
