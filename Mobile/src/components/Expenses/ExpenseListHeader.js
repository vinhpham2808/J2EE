import React from "react";
import { StyleSheet, View } from "react-native";
import ExpenseFilterTabs from "./ExpenseFilterTabs";
import ExpenseListOverview from "./ExpenseListOverview";
import ExpenseSummaryActions from "./ExpenseSummaryActions";

export default function ExpenseListHeader({
  expenses,
  filterType,
  isExporting,
  isPremium,
  isScanning,
  onAddExpense,
  onExport,
  onFilterChange,
  onScanReceipt,
  onVoiceResult,
  totalExpense
}) {
  return (
    <View style={styles.headerWrap}>
      <ExpenseFilterTabs filterType={filterType} onChange={onFilterChange} />
      <ExpenseSummaryActions
        expenseCount={expenses.length}
        filterType={filterType}
        isExporting={isExporting}
        isPremium={isPremium}
        isScanning={isScanning}
        onAddExpense={onAddExpense}
        onExport={onExport}
        onScanReceipt={onScanReceipt}
        onVoiceResult={onVoiceResult}
        totalExpense={totalExpense}
      />
      <ExpenseListOverview canToggle={false} expanded expenses={expenses} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    marginBottom: 12
  }
});
