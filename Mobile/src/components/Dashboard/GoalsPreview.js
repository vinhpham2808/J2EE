import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { clampScale, scale } from "../../utils/layoutScale";
import { formatMoney } from "../../utils/format";
import { DashboardSectionCard, DashboardSectionHeader } from "./DashboardSection";
import ShowMoreButton from "../common/ShowMoreButton";

function GoalPreviewCard({ goal, onPress }) {
  const colors = useAppColors();
  const target = Number(goal?.targetAmount || 0);
  const current = Number(goal?.currentAmount || 0);
  const progress = Math.max(0, Math.min(100, Number(goal?.progressPercent || 0)));
  const status = String(goal?.status || "ACTIVE").toUpperCase();
  const isCompleted = status === "COMPLETED";
  const progressColor = isCompleted ? COLORS.PRIMARY : progress >= 50 ? COLORS.PRIMARY : progress >= 25 ? COLORS.GOLD : COLORS.INFO;

  return (
    <Pressable style={[styles.goalCard, { borderBottomColor: colors.BG }]} onPress={onPress}>
      <View style={styles.goalHeader}>
        <View style={styles.goalInfo}>
          <Text style={[styles.goalName, { color: colors.TEXT }]} numberOfLines={1}>{goal?.name || "Mục tiêu"}</Text>
          <Text style={[styles.goalStatus, { color: colors.TEXT_MUTED }]}> 
            {isCompleted ? "Hoàn thành" : `Đang tích lũy · ${formatMoney(current)} / ${formatMoney(target)}`}
          </Text>
        </View>
        <Text style={[styles.goalPercent, { color: progressColor }]}>{Math.round(progress)}%</Text>
      </View>
      <View style={[styles.goalTrack, { backgroundColor: colors.CARD_BORDER }]}> 
        <View style={[styles.goalFill, { width: `${progress}%`, backgroundColor: progressColor }]} />
      </View>
    </Pressable>
  );
}

export default function GoalsPreview({ goals, onCreate, onGoalPress, onMore }) {
  const colors = useAppColors();

  return (
    <>
      <DashboardSectionHeader title="Mục tiêu tiết kiệm">
        <ShowMoreButton visible={Boolean(onMore)} onPress={onMore} label="Xem thêm" />
      </DashboardSectionHeader>
      <DashboardSectionCard>
        {goals.length > 0 ? (
          goals.map((goal) => <GoalPreviewCard key={goal.id} goal={goal} onPress={onGoalPress} />)
        ) : (
          <View style={styles.emptyGoalContainer}>
            <Text style={styles.emptyGoalIcon}>🎯</Text>
            <Text style={[styles.emptyGoalText, { color: colors.TEXT_SECONDARY }]}>Chưa có mục tiêu tiết kiệm nào.</Text>
            <Pressable style={[styles.createGoalButton, { backgroundColor: colors.ROSE_MIST, borderColor: colors.CARD_BORDER }]} onPress={onCreate}>
              <Text style={[styles.createGoalButtonText, { color: colors.PRIMARY }]}>Tạo mục tiêu</Text>
            </Pressable>
          </View>
        )}
      </DashboardSectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(8)
  },
  goalInfo: {
    flex: 1,
    paddingRight: scale(10)
  },
  goalName: {
    color: COLORS.TEXT,
    fontWeight: "700",
    fontSize: clampScale(14, 12, 16)
  },
  goalStatus: {
    color: COLORS.TEXT_MUTED,
    fontSize: clampScale(12, 10, 14),
    marginTop: scale(2)
  },
  goalPercent: {
    fontSize: clampScale(18, 16, 22),
    fontWeight: "900"
  },
  goalTrack: {
    height: scale(6),
    borderRadius: scale(6),
    backgroundColor: COLORS.CARD_BORDER,
    overflow: "hidden"
  },
  goalFill: {
    height: "100%",
    borderRadius: scale(6)
  },
  emptyGoalContainer: {
    alignItems: "center",
    paddingVertical: scale(16)
  },
  emptyGoalIcon: {
    fontSize: clampScale(28, 24, 32),
    marginBottom: scale(6)
  },
  emptyGoalText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: clampScale(13, 11, 15),
    marginBottom: scale(10)
  },
  createGoalButton: {
    backgroundColor: COLORS.ROSE_MIST,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: scale(10),
    paddingHorizontal: scale(16),
    paddingVertical: scale(8)
  },
  createGoalButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
    fontSize: clampScale(13, 11, 15)
  }
});
