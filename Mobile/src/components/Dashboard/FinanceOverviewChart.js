import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import Svg, { Path, G, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { buildRecentMonthKeys, formatMonthKeyLabel, formatMonthShortLabel, toMonthKey } from "../../utils/financeStats";
import { formatMoney } from "../../utils/format";
import { COLORS, useAppColors } from "../../constants/colors";

const screenWidth = Dimensions.get("window").width;

const SLICE_COLORS = {
  income: COLORS.INCOME,
  expense: COLORS.EXPENSE,
  balance: COLORS.PRIMARY,
};

const VALUE_COLORS = {
  income: COLORS.INCOME,
  expense: COLORS.EXPENSE,
  balance: COLORS.PRIMARY_DARK,
};

const SLICE_GRADIENTS = {
  income: ["#4DB6AC", "#2A9D8F"],
  expense: ["#F4A261", "#E76F51"],
  balance: ["#FF8FA3", "#E8597A"],
};

const VALUE_GRADIENTS = {
  income: ["#4DB6AC", "#2A9D8F"],
  expense: ["#F4A261", "#E76F51"],
  balance: ["#FF8FA3", "#E8597A"],
};

const CENTER_GRADIENT = ["#FF8FA3", "#E8597A"];
const SLICE_GAP_ANGLE = 1.2;

// ─── Helpers ─────────────────────────────────────────────────────
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, outerR, innerR, startAngle, endAngle) {
  // Clamp so a full 360° slice works
  const sweep = Math.min(endAngle - startAngle, 359.999);
  const end = startAngle + sweep;
  const largeArc = sweep > 180 ? 1 : 0;

  const oStart = polarToCartesian(cx, cy, outerR, startAngle);
  const oEnd = polarToCartesian(cx, cy, outerR, end);
  const iStart = polarToCartesian(cx, cy, innerR, end);
  const iEnd = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
    `L ${iStart.x} ${iStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${iEnd.x} ${iEnd.y}`,
    "Z",
  ].join(" ");
}

function formatShortMoney(val) {
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) {
    const billions = abs / 1_000_000_000;
    const formatted = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1);
    return `${formatted.replace(".", ",")} tỷ VND`;
  }
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${formatted.replace(".", ",")} tr VND`;
  }
  if (abs >= 1_000) {
    const thousands = abs / 1_000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${formatted.replace(".", ",")}K`;
  }
  return `${abs} VND`;
}

function formatShortSignedMoney(val) {
  const sign = Number(val || 0) < 0 ? "-" : "";
  return `${sign}${formatShortMoney(val)}`;
}

function normalizeMonthlySeries(series = []) {
  return series
    .filter((item) => item?.monthKey)
    .map((item) => ({
      monthKey: String(item.monthKey),
      income: Math.max(0, Number(item?.income || 0)),
      expense: Math.max(0, Number(item?.expense || 0)),
      balance: Number(item?.balance ?? Number(item?.income || 0) - Number(item?.expense || 0))
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

function buildFallbackMonthlySeries(income = 0, expense = 0) {
  const keys = buildRecentMonthKeys(6);
  const currentKey = toMonthKey(new Date());

  return keys.map((monthKey) => {
    const isCurrent = monthKey === currentKey;
    const monthIncome = isCurrent ? Math.max(0, Number(income || 0)) : 0;
    const monthExpense = isCurrent ? Math.max(0, Number(expense || 0)) : 0;
    return {
      monthKey,
      income: monthIncome,
      expense: monthExpense,
      balance: monthIncome - monthExpense
    };
  });
}

// ─── Legend ──────────────────────────────────────────────────────
function LegendItem({ color, label, value, valueColor, valueGradient }) {
  const colors = useAppColors();

  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: colors.TEXT }]}>{label}</Text>
      <Svg width={128} height={18} style={styles.legendValueSvg}>
        <Defs>
          <LinearGradient id="legendValueGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={valueGradient?.[0] || valueColor} />
            <Stop offset="1" stopColor={valueGradient?.[1] || valueColor} />
          </LinearGradient>
        </Defs>
        <SvgText
          x={126}
          y={13}
          textAnchor="end"
          fontSize="13"
          fontWeight="700"
          fill="url(#legendValueGradient)"
        >
          {value}
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────
function SliceTooltip({ slice, cx, cy, outerR }) {
  if (!slice) return null;

  const midAngle = (slice.startAngle + slice.endAngle) / 2;
  const rad = ((midAngle - 90) * Math.PI) / 180;

  // Position popup along the outer radius + offset
  const popupDistance = outerR + 14;
  const px = cx + popupDistance * Math.cos(rad);
  const py = cy + popupDistance * Math.sin(rad);

  // Align tooltip box relative to the point
  const tooltipW = 140;
  const tooltipH = 52;
  let left = px - tooltipW / 2;
  let top = py - tooltipH / 2;

  // Clamp so it stays inside the SVG viewBox area
  const svgSize = (outerR + 30) * 2;
  if (left < 4) left = 4;
  if (left + tooltipW > svgSize - 4) left = svgSize - tooltipW - 4;
  if (top < 4) top = 4;
  if (top + tooltipH > svgSize - 4) top = svgSize - tooltipH - 4;

  return (
    <View
      style={[
        styles.tooltip,
        {
          left,
          top,
          width: tooltipW,
          minHeight: tooltipH,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.tooltipHeader}>
        <View style={[styles.tooltipDot, { backgroundColor: slice.color }]} />
        <Text style={styles.tooltipName}>{slice.name}</Text>
      </View>
      <Text style={[styles.tooltipAmount, { color: slice.valueColor }]}>
        {slice.sign}{formatMoney(slice.rawAmount)}
      </Text>
      <Text style={styles.tooltipPercent}>
        {slice.percent.toFixed(1)}% tổng tiền
      </Text>
    </View>
  );
}

function MonthSwitcher({ label, canPrev, canNext, onPrev, onNext }) {
  const colors = useAppColors();

  return (
    <View style={styles.monthSwitcherRow}>
      <Pressable style={[styles.monthNavBtn, { backgroundColor: colors.ROSE_MIST, borderColor: colors.CARD_BORDER }, !canPrev && styles.monthNavBtnDisabled]} onPress={onPrev} disabled={!canPrev}>
        <Text style={[styles.monthNavText, { color: canPrev ? colors.TEXT : colors.TEXT_MUTED }]}>◀</Text>
      </Pressable>
      <Text style={[styles.monthYearText, { color: colors.TEXT_SECONDARY }]}>{label}</Text>
      <Pressable style={[styles.monthNavBtn, { backgroundColor: colors.ROSE_MIST, borderColor: colors.CARD_BORDER }, !canNext && styles.monthNavBtnDisabled]} onPress={onNext} disabled={!canNext}>
        <Text style={[styles.monthNavText, { color: canNext ? colors.TEXT : colors.TEXT_MUTED }]}>▶</Text>
      </Pressable>
    </View>
  );
}

// ─── Monthly Bar Chart ────────────────────────────────────────────
function MonthlyBarsPlaceholder({ monthlySeries = [] }) {
  const colors = useAppColors();

  if (!monthlySeries.length) return null;

  const barH = 90;
  const barW = (screenWidth - 80) / monthlySeries.length;
  const maxValue = Math.max(
    1,
    ...monthlySeries.map((item) => Math.max(item.income, item.expense))
  );

  return (
    <View style={styles.monthlySection}>
      <Text style={[styles.monthlyTitle, { color: colors.TEXT_SECONDARY }]}>So sánh các tháng</Text>
      <View style={styles.monthlyBarRow}>
        {monthlySeries.map((item, idx) => {
          const incomeHeight = Math.max(6, (item.income / maxValue) * barH);
          const expenseHeight = Math.max(6, (item.expense / maxValue) * barH);

          return (
            <View key={idx} style={[styles.monthlyBarCol, { width: barW }]}>
              <View style={styles.monthlyBarPair}>
                <View style={{ height: barH, justifyContent: "flex-end", alignItems: "center" }}>
                  <View
                    style={{
                      width: 10,
                      height: incomeHeight,
                      borderRadius: 4,
                      backgroundColor: COLORS.INCOME,
                      opacity: 0.8,
                    }}
                  />
                </View>
                <View
                  style={{
                    height: barH,
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: expenseHeight,
                      borderRadius: 4,
                      backgroundColor: COLORS.EXPENSE,
                      opacity: 0.8,
                    }}
                  />
                </View>
              </View>
              <Text style={[styles.monthlyBarLabel, { color: colors.TEXT_MUTED }]}>{formatMonthShortLabel(item.monthKey)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────
const FinanceOverviewChart = ({ totalBalance, totalIncome, totalExpense, monthlySeries = [] }) => {
  const colors = useAppColors();
  const fallbackIncome = Number(totalIncome || 0);
  const fallbackExpense = Number(totalExpense || 0);
  const fallbackBalance = Number(totalBalance || 0);

  const [selectedIdx, setSelectedIdx] = useState(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

  const monthSeries = useMemo(() => {
    const normalized = normalizeMonthlySeries(monthlySeries);
    if (normalized.length) return normalized;

    const fallback = buildFallbackMonthlySeries(fallbackIncome, fallbackExpense);
    const currentKey = toMonthKey(new Date());
    return fallback.map((item) => (
      item.monthKey === currentKey
        ? { ...item, balance: fallbackBalance }
        : item
    ));
  }, [fallbackBalance, fallbackExpense, fallbackIncome, monthlySeries]);

  useEffect(() => {
    if (!monthSeries.length) return;
    setSelectedMonthIndex(monthSeries.length - 1);
  }, [monthSeries]);

  useEffect(() => {
    setSelectedIdx(null);
  }, [selectedMonthIndex]);

  const activeMonth = monthSeries[selectedMonthIndex] || monthSeries[monthSeries.length - 1] || {
    monthKey: toMonthKey(new Date()),
    income: fallbackIncome,
    expense: fallbackExpense,
    balance: fallbackBalance
  };

  const income = Number(activeMonth?.income || 0);
  const expense = Number(activeMonth?.expense || 0);
  const balance = Number(activeMonth?.balance || 0);
  const monthYearLabel = formatMonthKeyLabel(activeMonth?.monthKey || "");

  // Build slices
  const slices = useMemo(() => {
    const raw = [
      { key: "income", name: "Thu nhập", rawAmount: income, color: colors.INCOME, valueColor: colors.INCOME, sign: "+" },
      { key: "expense", name: "Chi tiêu", rawAmount: expense, color: colors.EXPENSE, valueColor: colors.EXPENSE, sign: "-" },
      { key: "balance", name: "Số dư", rawAmount: Math.abs(balance), color: colors.PRIMARY, valueColor: colors.PRIMARY, sign: "" },
    ].filter((s) => s.rawAmount > 0);

    const total = raw.reduce((sum, s) => sum + s.rawAmount, 0);
    if (total === 0) return [];

    let currentAngle = 0;
    return raw.map((s) => {
      const percent = (s.rawAmount / total) * 100;
      const sweep = (s.rawAmount / total) * 360;
      const baseStartAngle = currentAngle;
      const baseEndAngle = currentAngle + sweep;
      const halfSweep = sweep / 2;
      const inset = Math.min(SLICE_GAP_ANGLE, halfSweep);
      const startAngle = baseStartAngle + inset;
      const endAngle = baseEndAngle - inset;
      currentAngle = baseEndAngle;
      return { ...s, percent, startAngle, endAngle };
    });
  }, [balance, colors.EXPENSE, colors.INCOME, colors.PRIMARY, expense, income]);

  const handleSliceTap = useCallback(
    (idx) => {
      setSelectedIdx((prev) => (prev === idx ? null : idx));
    },
    []
  );

  // Chart dimensions
  const outerR = 90;
  const innerR = 58;
  const padding = 30;
  const svgSize = (outerR + padding) * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  const selectedSlice = selectedIdx !== null ? slices[selectedIdx] : null;
  const hasChartData = slices.length > 0;
  const isCurrentMonth = selectedMonthIndex === monthSeries.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
      <MonthSwitcher
        label={monthYearLabel}
        canPrev={selectedMonthIndex > 0}
        canNext={selectedMonthIndex < monthSeries.length - 1}
        onPrev={() => setSelectedMonthIndex((prev) => Math.max(0, prev - 1))}
        onNext={() => setSelectedMonthIndex((prev) => Math.min(monthSeries.length - 1, prev + 1))}
      />

      {/* Legend */}
            <View style={styles.legendContainer}>
        <LegendItem
          color={colors.INCOME}
          label="Thu nhập"
          value={`+${formatMoney(income)}`}
          valueColor={colors.INCOME}
          valueGradient={VALUE_GRADIENTS.income}
        />
        <LegendItem
          color={colors.EXPENSE}
          label="Chi tiêu"
          value={`-${formatMoney(expense)}`}
          valueColor={colors.EXPENSE}
          valueGradient={VALUE_GRADIENTS.expense}
        />
        <LegendItem
          color={colors.PRIMARY}
          label="Số dư"
          value={formatMoney(balance)}
          valueColor={colors.PRIMARY}
          valueGradient={VALUE_GRADIENTS.balance}
        />
      </View>

      {/* Custom SVG Donut Chart */}
      {hasChartData ? (
        <Pressable
          style={styles.chartWrapper}
          onPress={() => setSelectedIdx(null)}
        >
          <View style={{ width: svgSize, height: svgSize }}>
            <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
              <Defs>
                <LinearGradient id="slice-income" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={SLICE_GRADIENTS.income[0]} />
                  <Stop offset="1" stopColor={SLICE_GRADIENTS.income[1]} />
                </LinearGradient>
                <LinearGradient id="slice-expense" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={SLICE_GRADIENTS.expense[0]} />
                  <Stop offset="1" stopColor={SLICE_GRADIENTS.expense[1]} />
                </LinearGradient>
                <LinearGradient id="slice-balance" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={SLICE_GRADIENTS.balance[0]} />
                  <Stop offset="1" stopColor={SLICE_GRADIENTS.balance[1]} />
                </LinearGradient>
                <LinearGradient id="center-total-gradient" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={CENTER_GRADIENT[0]} />
                  <Stop offset="1" stopColor={CENTER_GRADIENT[1]} />
                </LinearGradient>
              </Defs>
              <G>
                {slices.map((slice, idx) => {
                  const isSelected = selectedIdx === idx;
                  const scale = isSelected ? 1.06 : 1;
                  const sOuterR = outerR * scale;
                  const sInnerR = innerR * scale;

                  const d = describeArc(cx, cy, sOuterR, sInnerR, slice.startAngle, slice.endAngle);

                  return (
                    <Path
                      key={slice.key}
                      d={d}
                      fill={`url(#slice-${slice.key})`}
                      opacity={selectedIdx !== null && !isSelected ? 0.45 : 1}
                      onPress={() => handleSliceTap(idx)}
                    />
                  );
                })}

                <SvgText
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                  fill={colors.TEXT_SECONDARY}
                >
                  Số dư
                </SvgText>

                <SvgText
                  x={cx}
                  y={cy + 14}
                  textAnchor="middle"
                  fontSize={
                    formatShortSignedMoney(balance).length > 12 ? 14 :
                    formatShortSignedMoney(balance).length > 10 ? 16 :
                    formatShortSignedMoney(balance).length > 8 ? 19 : 22
                  }
                  fontWeight="900"
                  fill="url(#center-total-gradient)"
                >
                  {formatShortSignedMoney(balance)}
                </SvgText>
              </G>
            </Svg>

            {selectedSlice && (
              <SliceTooltip
                slice={selectedSlice}
                cx={cx}
                cy={cy}
                outerR={outerR}
              />
            )}
          </View>
        </Pressable>
      ) : (
        <View style={[styles.chartEmptyWrap, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER }]}> 
          <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>Tháng này chưa có dữ liệu thống kê.</Text>
          {!isCurrentMonth ? (
            <Pressable style={styles.currentMonthBtn} onPress={() => setSelectedMonthIndex(monthSeries.length - 1)}>
              <Text style={styles.currentMonthBtnText}>Về tháng hiện tại</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {/* Monthly comparison bar chart */}
      <MonthlyBarsPlaceholder monthlySeries={monthSeries} />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
  },
  monthSwitcherRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  monthNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.ROSE_MIST,
  },
  monthNavBtnDisabled: {
    opacity: 0.4,
  },
  monthNavText: {
    color: COLORS.TEXT,
    fontWeight: "800",
  },
  monthNavTextDisabled: {
    color: COLORS.TEXT_MUTED,
  },
  monthYearText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  legendContainer: {
    gap: 6,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    color: COLORS.TEXT,
    fontSize: 13,
    fontWeight: "600",
  },
  legendValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  legendValueSvg: {
    marginLeft: 8,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  chartEmptyWrap: {
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 12,
    backgroundColor: COLORS.BG,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  currentMonthBtn: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    backgroundColor: COLORS.ROSE_MIST,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  currentMonthBtnText: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: "700",
  },

  // Tooltip
  tooltip: {
    position: "absolute",
    backgroundColor: COLORS.DARK_BG,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  tooltipName: {
    color: COLORS.DARK_TEXT,
    fontSize: 12,
    fontWeight: "700",
  },
  tooltipAmount: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 1,
  },
  tooltipPercent: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: "600",
  },

  // Monthly section
  monthlySection: {
    marginTop: 10,
  },
  monthlyTitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  monthlyBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  monthlyBarCol: {
    alignItems: "center",
  },
  monthlyBarPair: {
    height: 90,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },
  monthlyBarLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },

  // Empty state
  emptyContainer: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    textAlign: "center",
  },
});

export default FinanceOverviewChart;
