import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { formatMoney, formatDate } from "../../utils/format";
import { getGoalVisual } from "./goalUtils";

/**
 * Full-screen modal showing detailed goal info:
 * progress, stats grid, monthly progress, and actions.
 */
export default function GoalDetailModal({ goal, visible, onClose, onContribute, onDelete }) {
  if (!goal) return null;

  const target = Number(goal?.targetAmount || 0);
  const current = Number(goal?.currentAmount || 0);
  const remaining = Math.max(0, Number(goal?.remainingAmount ?? target - current));
  const progress = Math.max(0, Math.min(100, Number(goal?.progressPercent || 0)));
  const monthlyTarget = Number(goal?.monthlyTarget || 0);
  const monthlyContributed = Number(goal?.monthlyContributed || 0);
  const monthlyProgress = Math.max(0, Math.min(100, Number(goal?.monthlyProgressPercent || 0)));
  const visual = getGoalVisual(goal);
  const isActive = String(goal?.status || "ACTIVE").toUpperCase() === "ACTIVE";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title} numberOfLines={2}>{goal?.name || "Mục tiêu"}</Text>
              <Text style={styles.period}>{formatDate(goal?.startDate)} {'>'} {formatDate(goal?.targetDate)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: visual.bg }]}>
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

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryText}>Đóng</Text>
            </Pressable>
            {isActive ? (
              <>
                <Pressable style={styles.deleteTextButton} onPress={() => onDelete(goal?.id)}>
                  <Text style={styles.deleteText}>Xóa</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={() => onContribute(goal)}>
                  <Text style={styles.primaryText}>Đóng góp</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 16,
    maxHeight: "82%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    color: COLORS.TEXT,
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 3,
  },
  period: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
  },
  progressRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
  progressValue: {
    fontWeight: "800",
  },
  progressTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.CARD_BORDER,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
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
  statLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.TEXT,
    fontWeight: "700",
    fontSize: 12,
  },
  statGood: {
    color: COLORS.INCOME,
  },
  statWarn: {
    color: COLORS.EXPENSE,
  },
  statInfo: {
    color: COLORS.INFO,
  },
  monthlyCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
  },
  monthlyLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
  monthlyValue: {
    color: COLORS.TEXT,
    fontSize: 11,
    fontWeight: "700",
  },
  monthlyTrack: {
    marginTop: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: COLORS.CARD_BORDER,
    overflow: "hidden",
  },
  monthlyFill: {
    height: "100%",
    backgroundColor: COLORS.PRIMARY,
  },
  actions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryText: {
    color: "#334155",
    fontWeight: "700",
  },
  deleteTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteText: {
    color: COLORS.EXPENSE,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
});
