export const JAR_CATEGORY_COLORS = [
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#EC4899",
  "#F97316",
  "#14B8A6"
];

export const JAR_COLORS = [
  { value: "#8B5CF6", label: "Tím" },
  { value: "#10B981", label: "Xanh lá" },
  { value: "#F59E0B", label: "Vàng" },
  { value: "#EF4444", label: "Đỏ" },
  { value: "#3B82F6", label: "Xanh dương" },
  { value: "#EC4899", label: "Hồng" },
  { value: "#F97316", label: "Cam" },
  { value: "#06B6D4", label: "Xanh ngọc" },
  { value: "#6366F1", label: "Chàm" },
  { value: "#84CC16", label: "Xanh chuối" }
];

export const JAR_EMOJI_CATEGORIES = [
  {
    title: "💰 Tài chính & Tiết kiệm",
    emojis: ["🏺", "🐖", "💰", "💵", "💳", "🏦", "📈", "📉", "💸", "🪙", "💎", "🔑"]
  },
  {
    title: "🏠 Đời sống & Đi lại",
    emojis: ["🏠", "🚗", "🛵", "✈️", "🛒", "🛍️", "👕", "👠", "🔌", "📦", "🏥", "🎓"]
  },
  {
    title: "🍔 Ăn uống & Giải trí",
    emojis: ["🍔", "🍕", "🍜", "🍣", "☕", "🍿", "🍰", "🍺", "🎮", "🎬", "🎤", "🎧"]
  },
  {
    title: "🎪 Khác",
    emojis: ["🏋️‍♂️", "🎫", "🎪", "🎨", "🎁", "👶", "👵", "🔒", "💼", "📊", "🚨", "✨"]
  }
];

export const formatJarMoney = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value ?? 0);

export function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export function describeDonutArc(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const sweep = Math.min(endAngle - startAngle, 359.999);
  const end = startAngle + sweep;
  const largeArc = sweep > 180 ? 1 : 0;

  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, end);
  const innerStart = polarToCartesian(cx, cy, innerRadius, end);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z"
  ].join(" ");
}

export function getJarActualPercent(currentBalance, totalBalance) {
  return totalBalance > 0 ? ((currentBalance / totalBalance) * 100).toFixed(1) : "0.0";
}

export function getJarProgressWidth(currentBalance, totalBalance) {
  return Math.min((Math.abs(currentBalance) / (totalBalance > 0 ? totalBalance : 1)) * 100, 100);
}
