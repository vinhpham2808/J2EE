import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function CategoryEmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🗂️</Text>
      <Text style={styles.emptyTitle}>Chưa có danh mục nào</Text>
      <Text style={styles.emptyText}>Tạo danh mục đầu tiên để bắt đầu quản lý giao dịch gọn gàng hơn.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    marginTop: 44,
    paddingHorizontal: 24
  },
  emptyIcon: {
    fontSize: 36,
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
