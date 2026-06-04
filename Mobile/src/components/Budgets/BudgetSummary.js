import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { formatMoney } from "../../utils/format";

export default function BudgetSummary({ summary }) {
  return (
    <View style={styles.overviewCard}>
      <Text style={styles.overviewTitle}>Ngân sách tháng</Text>
      <Text style={styles.overviewLimit}>Hạn mức: {formatMoney(summary.totalLimit)}</Text>
      <Text style={styles.overviewSpent}>Đã chi: {formatMoney(summary.totalSpent)}</Text>
      <Text style={styles.overviewHint}>{summary.warningCount} mục đang gần/vượt hạn mức</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overviewCard: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  overviewTitle: {
    color: COLORS.PEACH,
    fontWeight: "700",
    fontSize: 13,
  },
  overviewLimit: {
    marginTop: 6,
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 20,
  },
  overviewSpent: {
    marginTop: 2,
    color: COLORS.PEACH,
    fontWeight: "700",
  },
  overviewHint: {
    marginTop: 8,
    color: COLORS.ROSE_MIST,
    fontSize: 12,
  }
});
