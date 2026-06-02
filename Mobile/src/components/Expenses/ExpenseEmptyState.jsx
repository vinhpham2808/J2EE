import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function ExpenseEmptyState({ hasSearch, onAddExpense }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🧾</Text>
      <Text style={styles.emptyTitle}>
        {hasSearch ? "Không tìm thấy kết quả" : "Chưa có khoản chi nào"}
      </Text>
      <Text style={styles.emptyText}>
        {hasSearch
          ? "Thử tìm kiếm với từ khóa khác."
          : "Hãy thêm giao dịch đầu tiên để bắt đầu theo dõi chi tiêu dễ hơn."}
      </Text>
      {!hasSearch && (
        <Pressable style={styles.emptyAction} onPress={onAddExpense}>
          <Text style={styles.emptyActionText}>+ Thêm chi tiêu</Text>
        </Pressable>
      )}
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
  },
  emptyAction: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  emptyActionText: {
    color: COLORS.WHITE,
    fontWeight: "800"
  }
});
