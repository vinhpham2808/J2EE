import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import IncomeExpenseChart from "../IncomeExpenseChart";
import ShowMoreButton from "../ShowMoreButton";

export default function ExpenseListOverview({
  canToggle,
  expanded,
  expenses,
  onToggle,
  searchKeyword
}) {
  if (!expenses.length) {
    return null;
  }

  return (
    <View>
      <IncomeExpenseChart data={expenses} title="Tổng quan chi tiêu" colorPrimary={COLORS.EXPENSE} />
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {searchKeyword ? `Kết quả tìm kiếm (${expenses.length})` : "Danh sách chi tiêu"}
        </Text>
        <ShowMoreButton visible={canToggle} expanded={expanded} onPress={onToggle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  listTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 16
  }
});
