import React, { useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BudgetCard from "../../components/Budgets/BudgetCard";
import BudgetForm from "../../components/Budgets/BudgetForm";
import BudgetSummary from "../../components/Budgets/BudgetSummary";
import { COLORS, useAppColors } from "../../constants/colors";
import useBudget from "../../hooks/useBudget";
import { getSafeAreaBottom, getSafeAreaTop } from "../../utils/safeArea";

function BudgetEmptyState({ colors }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💸</Text>
      <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>Chưa có hạn mức nào</Text>
      <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>Hãy tạo hạn mức đầu tiên để kiểm soát chi tiêu tốt hơn trong tháng.</Text>
    </View>
  );
}

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const budget = useBudget();

  const renderBudget = useCallback(
    ({ item }) => <BudgetCard item={item} onDelete={budget.onDelete} />,
    [budget.onDelete]
  );

  const renderHeader = useCallback(
    () => (
      <View>
        <BudgetSummary summary={budget.summary} />
        <BudgetForm budget={budget} />
        {budget.budgets.length ? (
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.TEXT }]}>Danh sách hạn mức</Text>
          </View>
        ) : null}
      </View>
    ),
    [budget, colors]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.BG, paddingTop: getSafeAreaTop(insets) }]}> 
      <FlatList
        data={budget.budgets}
        keyExtractor={(item) => String(item?.id)}
        renderItem={renderBudget}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: getSafeAreaBottom(insets) },
          !budget.budgets.length && styles.listContentEmpty
        ]}
        refreshControl={<RefreshControl refreshing={budget.refreshing} onRefresh={budget.onRefresh} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<BudgetEmptyState colors={colors} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f7",
    padding: 16,
    paddingTop: 16
  },
  listContent: {
    paddingBottom: 30
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center"
  },
  listHeader: {
    marginBottom: 8
  },
  listTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 16
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 6
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 19
  }
});
