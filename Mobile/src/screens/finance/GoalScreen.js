import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatMoney } from "../../utils/format";
import ShowMoreButton from "../../components/common/ShowMoreButton";
import { getSafeAreaBottom, getSafeAreaTop } from "../../utils/safeArea";
import useGoals from "../../hooks/useGoals";
import GoalForm from "../../components/Goal/GoalForm";
import CompactGoalTab from "../../components/Goal/CompactGoalTab";
import GoalDetailModal from "../../components/Goal/GoalDetailModal";
import ContributionModal from "../../components/Goal/ContributionModal";

export default function GoalScreen() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  const {
    goals,
    refreshing,
    visibleGoals,
    canExpandGoals,
    showAllGoals,
    toggleGoals,
    onRefresh,
    overview,
    name,
    targetAmount,
    startDate,
    targetDate,
    loading,
    setName,
    setTargetAmount,
    setStartDate,
    setTargetDate,
    onCreate,
    detailGoal,
    setDetailGoal,
    onDelete,
    selectedGoal,
    contributionAmount,
    contributionDate,
    contributionNote,
    setContributionAmount,
    setContributionDate,
    setContributionNote,
    openContributionModal,
    closeContributionModal,
    onContribute,
  } = useGoals();

  return (
    <View style={[styles.container, { backgroundColor: colors.BG, paddingTop: getSafeAreaTop(insets) }]}> 
      <View style={styles.overviewCard}>
        <View style={styles.overviewBadgeRow}>
          <View style={styles.overviewBadge}>
            <Text style={styles.overviewBadgeIcon}>🎯</Text>
            <Text style={styles.overviewTag}>Kế hoạch tích lũy</Text>
          </View>
          <View style={styles.overviewCountBadge}>
            <Text style={styles.overviewCountText}>{overview.activeCount} mục tiêu</Text>
          </View>
        </View>

        <Text style={styles.overviewTitle}>Mục tiêu tiết kiệm</Text>

        <View style={styles.overviewMoneyRow}>
          <View style={styles.overviewMoneyCol}>
            <Text style={styles.overviewMoneyLabel}>💰 Đã tích lũy</Text>
            <Text style={styles.overviewMoneyValue}>
              {overview.totalCurrent > 0 ? formatMoney(overview.totalCurrent) : "0 ₫"}
            </Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewMoneyCol}>
            <Text style={styles.overviewMoneyLabel}>🎯 Mục tiêu</Text>
            <Text style={styles.overviewMoneyValueSub}>
              {overview.totalTarget > 0 ? formatMoney(overview.totalTarget) : "0 ₫"}
            </Text>
          </View>
        </View>

        <View style={styles.overviewProgressRow}>
          <Text style={styles.overviewProgressPercent}>{overview.overallProgress.toFixed(0)}%</Text>
          <Text style={styles.overviewProgressLabel}>hoàn thành</Text>
        </View>
        <View style={styles.overviewTrack}>
          <View style={[styles.overviewFill, { width: `${Math.max(2, overview.overallProgress)}%` }]} />
        </View>
      </View>

      <GoalForm
        name={name}
        targetAmount={targetAmount}
        startDate={startDate}
        targetDate={targetDate}
        loading={loading}
        onNameChange={setName}
        onAmountChange={setTargetAmount}
        onStartDateChange={setStartDate}
        onTargetDateChange={setTargetDate}
        onSubmit={onCreate}
      />

      <FlatList
        data={visibleGoals}
        keyExtractor={(item) => String(item?.id)}
        renderItem={({ item }) => <CompactGoalTab item={item} onPress={setDetailGoal} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: getSafeAreaBottom(insets) },
          !goals.length && styles.listContentEmpty,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          goals.length ? (
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: colors.TEXT }]}>Danh sách mục tiêu</Text>
              <ShowMoreButton visible={canExpandGoals} expanded={showAllGoals} onPress={toggleGoals} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>Chưa có mục tiêu tiết kiệm</Text>
            <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}> 
              Hãy tạo mục tiêu đầu tiên để bắt đầu kế hoạch tích lũy của bạn.
            </Text>
          </View>
        }
      />

      <GoalDetailModal
        goal={detailGoal}
        visible={Boolean(detailGoal)}
        onClose={() => setDetailGoal(null)}
        onContribute={openContributionModal}
        onDelete={onDelete}
      />

      <ContributionModal
        visible={Boolean(selectedGoal)}
        goal={selectedGoal}
        amount={contributionAmount}
        date={contributionDate}
        note={contributionNote}
        onAmountChange={setContributionAmount}
        onDateChange={setContributionDate}
        onNoteChange={setContributionNote}
        onClose={closeContributionModal}
        onSubmit={onContribute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
    padding: 16,
    paddingTop: 16,
  },

  // Overview
  overviewCard: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 6,
  },
  overviewBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  overviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
  },
  overviewBadgeIcon: {
    fontSize: 13,
  },
  overviewTag: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 12,
  },
  overviewCountBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  overviewCountText: {
    color: COLORS.PEACH,
    fontWeight: "800",
    fontSize: 12,
  },
  overviewTitle: {
    color: COLORS.WHITE,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  overviewMoneyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  overviewMoneyCol: {
    flex: 1,
  },
  overviewDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 12,
  },
  overviewMoneyLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  overviewMoneyValue: {
    color: COLORS.WHITE,
    fontSize: 17,
    fontWeight: "800",
  },
  overviewMoneyValueSub: {
    color: COLORS.PEACH,
    fontSize: 15,
    fontWeight: "700",
  },
  overviewProgressRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
    gap: 4,
  },
  overviewProgressPercent: {
    color: COLORS.WHITE,
    fontSize: 28,
    fontWeight: "800",
  },
  overviewProgressLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  overviewTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  overviewFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: COLORS.PEACH,
  },

  // List
  listContent: {
    paddingBottom: 30,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  listHeader: {
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 16,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 6,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 19,
  },
});
