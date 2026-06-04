import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import IncomeExpenseChart from "../common/IncomeExpenseChart";
import IncomeFilterTabs from "./IncomeFilterTabs";
import IncomeSummaryCard from "./IncomeSummaryCard";

export default function IncomeListHeader({
  filterType,
  incomes,
  isExporting,
  onAddIncome,
  onExport,
  onFilterChange,
  onVoiceResult,
  totalIncome
}) {
  const colors = useAppColors();

  return (
    <View style={styles.headerWrap}>
      <IncomeFilterTabs filterType={filterType} onChange={onFilterChange} />
      <IncomeSummaryCard
        filterType={filterType}
        incomeCount={incomes.length}
        isExporting={isExporting}
        onAddIncome={onAddIncome}
        onExport={onExport}
        onVoiceResult={onVoiceResult}
        totalIncome={totalIncome}
      />

      {incomes.length ? (
        <View>
          <IncomeExpenseChart data={incomes} title="Tổng quan thu nhập" colorPrimary={COLORS.INCOME} />
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.TEXT }]}>Danh sách thu nhập</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    marginBottom: 12
  },
  listHeader: {
    marginBottom: 8
  },
  listTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 16
  }
});
