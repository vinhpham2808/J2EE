import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppColors } from "../../constants/colors";
import { scale } from "../../utils/layoutScale";
import AppIcon from "../ui/AppIcon";

export default function ExpenseEmptyState() {
  const colors = useAppColors();

  return (
    <View style={styles.emptyState}>
      <View style={[styles.iconContainer, { backgroundColor: colors.EXPENSE_LIGHT || "rgba(239,68,68,0.15)" }]}>
        <AppIcon name="cart-outline" size={28} color={colors.ACTION_EXPENSE || colors.EXPENSE} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>Chưa có dữ liệu chi tiêu</Text>
      <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>Hãy thêm khoản chi đầu tiên để bắt đầu theo dõi dòng tiền.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: scale(6),
    textAlign: "center"
  },
  emptyText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18
  }
});
