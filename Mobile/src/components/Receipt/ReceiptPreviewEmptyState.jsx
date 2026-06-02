import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function ReceiptPreviewEmptyState({ onBack }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🧾</Text>
      <Text style={styles.emptyTitle}>Không nhận diện được khoản chi</Text>
      <Text style={styles.emptyText}>
        Gemini không tìm thấy mặt hàng nào trong ảnh.{"\n"}
        Hãy thử lại với ảnh rõ hơn hoặc nhập tay.
      </Text>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Quay lại</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.BG,
    justifyContent: "center",
    alignItems: "center",
    padding: 32
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT,
    marginBottom: 8,
    textAlign: "center"
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20
  },
  backButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28
  },
  backButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 15
  }
});
