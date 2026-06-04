import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

export default function BudgetGoalProgressCard({ budgetsOnTrack, totalBudgets, completedGoalsThisMonth }) {
  const colors = useAppColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
      <Text style={[styles.cardTitle, { color: colors.TEXT }]}>🎯 Tiến độ Ngân sách & Mục tiêu</Text>
      <View style={styles.goalStatusRow}>
        <View style={styles.goalStatusItem}>
          <Text style={[styles.goalStatusValue, { color: colors.PRIMARY }]}>{budgetsOnTrack} / {totalBudgets}</Text>
          <Text style={[styles.goalStatusLabel, { color: colors.TEXT_SECONDARY }]}>Ngân sách an toàn</Text>
        </View>
        <View style={[styles.verticalDivider, { backgroundColor: colors.CARD_BORDER }]} />
        <View style={styles.goalStatusItem}>
          <Text style={[styles.goalStatusValue, { color: colors.PRIMARY }]}>{completedGoalsThisMonth}</Text>
          <Text style={[styles.goalStatusLabel, { color: colors.TEXT_SECONDARY }]}>Mục tiêu hoàn thành</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 14,
  },
  goalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalStatusItem: {
    flex: 1,
    alignItems: "center",
  },
  goalStatusValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },
  goalStatusLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    fontWeight: "600",
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.CARD_BORDER,
  },
});
