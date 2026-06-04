import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ICON_PREFIX = "mdi:";

export const DEFAULT_CATEGORY_ICON = `${ICON_PREFIX}folder-outline`;

export const CATEGORY_ICON_PRESETS = {
  income: [
    { value: `${ICON_PREFIX}cash-multiple`, iconName: "cash-multiple", color: "#16a34a", label: "Tiền mặt" },
    { value: `${ICON_PREFIX}briefcase`, iconName: "briefcase", color: "#2563eb", label: "Công việc" },
    { value: `${ICON_PREFIX}gift`, iconName: "gift", color: "#db2777", label: "Quà tặng" },
    { value: `${ICON_PREFIX}bank`, iconName: "bank", color: "#0f766e", label: "Ngân hàng" },
    { value: `${ICON_PREFIX}trending-up`, iconName: "trending-up", color: "#7c3aed", label: "Tăng trưởng" },
    { value: `${ICON_PREFIX}wallet-plus`, iconName: "wallet-plus", color: "#15803d", label: "Ví tiền" },
    { value: `${ICON_PREFIX}account-cash`, iconName: "account-cash", color: "#0284c7", label: "Thu từ cá nhân" },
    { value: `${ICON_PREFIX}cash-refund`, iconName: "cash-refund", color: "#0ea5e9", label: "Hoàn tiền" },
    { value: `${ICON_PREFIX}piggy-bank`, iconName: "piggy-bank", color: "#ca8a04", label: "Tiết kiệm" },
    { value: `${ICON_PREFIX}hand-coin`, iconName: "hand-coin", color: "#8b5cf6", label: "Lãi suất" },
    { value: `${ICON_PREFIX}chart-line`, iconName: "chart-line", color: "#4338ca", label: "Đầu tư" },
    { value: `${ICON_PREFIX}cash-check`, iconName: "cash-check", color: "#16a34a", label: "Thu nợ" }
  ],
  expense: [
    { value: `${ICON_PREFIX}noodles`, iconName: "noodles", color: "#d97706", label: "Ăn uống" },
    { value: `${ICON_PREFIX}cart`, iconName: "cart", color: "#0ea5e9", label: "Mua sắm" },
    { value: `${ICON_PREFIX}car`, iconName: "car", color: "#475467", label: "Di chuyển" },
    { value: `${ICON_PREFIX}home`, iconName: "home", color: "#3b82f6", label: "Nhà ở" },
    { value: `${ICON_PREFIX}pill`, iconName: "pill", color: "#ef4444", label: "Sức khỏe" },
    { value: `${ICON_PREFIX}lightning-bolt`, iconName: "lightning-bolt", color: "#eab308", label: "Tiền điện" },
    { value: `${ICON_PREFIX}water`, iconName: "water", color: "#0284c7", label: "Tiền nước" },
    { value: `${ICON_PREFIX}wifi`, iconName: "wifi", color: "#6366f1", label: "Internet" },
    { value: `${ICON_PREFIX}phone`, iconName: "phone", color: "#06b6d4", label: "Điện thoại" },
    { value: `${ICON_PREFIX}movie-open`, iconName: "movie-open", color: "#7c3aed", label: "Giải trí" },
    { value: `${ICON_PREFIX}school`, iconName: "school", color: "#2563eb", label: "Học tập" },
    { value: `${ICON_PREFIX}airplane`, iconName: "airplane", color: "#0ea5e9", label: "Du lịch" },
    { value: `${ICON_PREFIX}dog`, iconName: "dog", color: "#f59e0b", label: "Thú cưng" },
    { value: `${ICON_PREFIX}charity`, iconName: "charity", color: "#ec4899", label: "Từ thiện" },
    { value: `${ICON_PREFIX}credit-card-minus`, iconName: "credit-card-minus", color: "#ef4444", label: "Trả nợ thẻ" }
  ]
};

const LEGACY_EMOJI_TO_ICON = {
  "💵": "cash-multiple",
  "💼": "briefcase",
  "🎁": "gift",
  "🏦": "bank",
  "📈": "trending-up",
  "💳": "credit-card-minus",
  "🐷": "piggy-bank",
  "⚡": "lightning-bolt",
  "💡": "lightning-bolt",
  "💧": "water",
  "📶": "wifi",
  "📱": "phone",
  "🎬": "movie-open",
  "🎓": "school",
  "✈️": "airplane",
  "🐶": "dog",
  "❤️": "charity",
  "🍜": "noodles",
  "🛒": "cart",
  "🚗": "car",
  "🏠": "home",
  "💊": "pill",
  "📁": "folder-outline"
};

const PRESET_BY_VALUE = [...CATEGORY_ICON_PRESETS.income, ...CATEGORY_ICON_PRESETS.expense].reduce((acc, preset) => {
  acc[preset.value] = preset;
  return acc;
}, {});

export function getCategoryIconPresets(type) {
  return CATEGORY_ICON_PRESETS[type] || CATEGORY_ICON_PRESETS.expense;
}

export function getFirstCategoryIcon(type) {
  const presets = getCategoryIconPresets(type);
  return presets[0]?.value || DEFAULT_CATEGORY_ICON;
}

export function getIconLabel(iconValue) {
  const normalized = String(iconValue || "").trim();
  if (PRESET_BY_VALUE[normalized]?.label) {
    return PRESET_BY_VALUE[normalized].label;
  }
  return "Chọn icon";
}

export function getIconColor(iconValue) {
  const normalized = String(iconValue || "").trim();
  return PRESET_BY_VALUE[normalized]?.color || "#344054";
}

function resolveIconName(iconValue) {
  const normalized = String(iconValue || "").trim();

  if (normalized.startsWith(ICON_PREFIX)) {
    const directName = normalized.slice(ICON_PREFIX.length);
    return directName || "folder-outline";
  }

  if (LEGACY_EMOJI_TO_ICON[normalized]) {
    return LEGACY_EMOJI_TO_ICON[normalized];
  }

  return "folder-outline";
}

function resolveIconColor(iconValue, defaultColor) {
  const normalized = String(iconValue || "").trim();
  return PRESET_BY_VALUE[normalized]?.color || defaultColor;
}

export function CategoryVectorIcon({
  iconValue,
  size = 20,
  color = "#344054",
  style
}) {
  const iconName = resolveIconName(iconValue);
  const iconColor = resolveIconColor(iconValue, color);

  return (
    <MaterialCommunityIcons
      name={iconName}
      size={size}
      color={iconColor}
      style={style}
    />
  );
}
