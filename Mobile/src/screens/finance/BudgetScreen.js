import React, { useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import BudgetCard from "../../components/Budgets/BudgetCard";
import BudgetForm from "../../components/Budgets/BudgetForm";
import BudgetSummary from "../../components/Budgets/BudgetSummary";
import { COLORS, useAppColors } from "../../constants/colors";
import useBudget from "../../hooks/useBudget";
import { getSafeAreaBottom, getSafeAreaTop } from "../../utils/safeArea";
import AppIcon from "../../components/ui/AppIcon";
import ScreenBackHeader from "../../components/common/ScreenBackHeader";
import { scale } from "../../utils/layoutScale";

function BudgetEmptyState({ colors }) {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyState}>
      <View style={[styles.iconContainer, { backgroundColor: colors.ROSE_MIST || "rgba(239,94,131,0.1)" }]}>
        <AppIcon name="card-outline" size={28} color={colors.PRIMARY} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>{t("finance.budget.emptyTitle")}</Text>
      <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>{t("finance.budget.emptyDescription")}</Text>
    </View>
  );
}

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const { t } = useTranslation();
  const budget = useBudget();

  const renderBudget = useCallback(
    ({ item }) => <BudgetCard item={item} onDelete={budget.onDelete} />,
    [budget.onDelete]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.BG, paddingTop: getSafeAreaTop(insets) }]}>
      <ScreenBackHeader title={t("finance.budget.title")} />
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
        ListHeaderComponent={
          <View>
            <BudgetSummary summary={budget.summary} />
            <BudgetForm budget={budget} />
            {budget.budgets.length ? (
              <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: colors.TEXT }]}>{t("finance.budget.listTitle")}</Text>
              </View>
            ) : null}
          </View>
        }
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
    justifyContent: "center",
    paddingHorizontal: scale(24),
    paddingVertical: scale(40)
  },
  iconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(12)
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
