import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { formatMoney, formatDate } from "../../utils/format";
import { getGoalVisual } from "./goalUtils";

/**
 * Full detail card for a saving goal with progress bars, stats grid,
 * monthly progress, and action buttons (contribute / delete).
 */
export default function GoalCard({ item, onContribute, onDelete }) {
  const target = Number(item?.targetAmount || 0);
  const current = Number(item?.currentAmount || 0);
  const remaining = Math.max(0, Number(item?.remainingAmount ?? target - current));
  const progress = Math.max(0, Math.min(100, Number(item?.progressPercent || 0)));

  const monthlyTarget = Number(item?.monthlyTarget || 0);
  const monthlyContributed = Number(item?.monthlyContributed || 0);
  const monthlyProgress = Math.max(0, Math.min(100, Number(item?.monthlyProgressPercent || 0)));

  const visual = getGoalVisual(item);
  const isActive = String(item?.status || "ACTIVE").toUpperCase() === "ACTIVE";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name} numberOfLines={1}>{item?.name || "Mục tiêu"}</Text>
          <Text style={styles.period}>{formatDate(item?.startDate)} {'>'} {formatDate(item?.targetDate)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: visual.bg, borderColor: visual.border }]}>
          <Text style={[styles.statusText, { color: visual.color }]}>{visual.label}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Tiến độ tổng</Text>
        <Text style={[styles.progressValue, { color: visual.color }]}>{progress.toFixed(1)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: visual.color }]} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Mục tiêu</Text>
          <Text style={styles.statValue}>{formatMoney(target)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Đã có</Text>
          <Text style={[styles.statValue, styles.statGood]}>{formatMoney(current)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Còn thiếu</Text>
          <Text style={[styles.statValue, styles.statWarn]}>{formatMoney(remaining)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Cần/tháng</Text>
          <Text style={[styles.statValue, styles.statInfo]}>{formatMoney(monthlyTarget)}</Text>
        </View>
      </View>

      {isActive ? (
        <View style={styles.monthlyCard}>
          <View style={styles.progressRow}>
            <Text style={styles.monthlyLabel}>Tiến độ tháng này</Text>
            <Text style={styles.monthlyValue}>
              {formatMoney(monthlyContributed)} / {formatMoney(monthlyTarget)} ({monthlyProgress.toFixed(0)}%)
            </Text>
          </View>
          <View style={styles.monthlyTrack}>
            <View style={[styles.monthlyFill, { width: `${monthlyProgress}%` }]} />
          </View>
        </View>
      ) : null}

      {isActive ? (
        <View style={styles.actions}>
          <Pressable style={styles.contributeButton} onPress={() => onContribute(item)}>
            <Text style={styles.contributeText}>Đóng góp</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={() => onDelete(item?.id)}>
            <Text style={styles.deleteText}>Xóa</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: { flex: 1, paddingRight: 10 },
  name: { color: COLORS.TEXT, fontWeight: "800", fontSize: 16, marginBottom: 2 },
  period: { color: COLORS.TEXT_SECONDARY, fontSize: 12 },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontWeight: "700", fontSize: 12 },
  progressRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { color: COLORS.TEXT_SECONDARY, fontSize: 12 },
  progressValue: { fontWeight: "800" },
  progressTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.CARD_BORDER,
    overflow: "hidden",
  },
  progressFill: { height: "100%" },
  statsGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statBox: {
    width: "48%",
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  statLabel: { color: COLORS.TEXT_SECONDARY, fontSize: 11, marginBottom: 2 },
  statValue: { color: COLORS.TEXT, fontWeight: "700", fontSize: 12 },
  statGood: { color: COLORS.INCOME },
  statWarn: { color: COLORS.EXPENSE },
  statInfo: { color: COLORS.INFO },
  monthlyCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
  },
  monthlyLabel: { color: COLORS.TEXT_SECONDARY, fontSize: 12 },
  monthlyValue: { color: COLORS.TEXT, fontSize: 11, fontWeight: "700" },
  monthlyTrack: {
    marginTop: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: COLORS.CARD_BORDER,
    overflow: "hidden",
  },
  monthlyFill: { height: "100%", backgroundColor: COLORS.PRIMARY },
  actions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contributeButton: {
    backgroundColor: COLORS.ROSE_MIST,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  contributeText: { color: COLORS.PRIMARY, fontWeight: "800" },
  deleteButton: {
    backgroundColor: COLORS.EXPENSE_LIGHT,
    borderWidth: 1,
    borderColor: "#fecdca",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteText: { color: COLORS.EXPENSE, fontWeight: "700" },
});
