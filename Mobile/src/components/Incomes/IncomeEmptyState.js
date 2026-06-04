import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

export default function IncomeEmptyState() {
  const colors = useAppColors();

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💹</Text>
      <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>Chưa có dữ liệu thu nhập</Text>
      <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>Hãy thêm khoản thu đầu tiên để theo dõi tài chính rõ ràng hơn.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    lineHeight: 19,
    marginBottom: 14
  }
});
