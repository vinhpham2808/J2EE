import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function ReceiptPreviewFooter({ itemCount, onCancel, onConfirm, submitting }) {
  return (
    <View style={styles.footer}>
      <Pressable style={styles.confirmButton} onPress={onConfirm} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={COLORS.WHITE} size="small" />
        ) : (
          <Text style={styles.confirmButtonText}>✅ Xác nhận lưu ({itemCount} mục)</Text>
        )}
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={onCancel} disabled={submitting}>
        <Text style={styles.cancelButtonText}>Hủy</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 16,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: COLORS.CARD_BORDER,
    gap: 10
  },
  confirmButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  confirmButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 16
  },
  cancelButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  cancelButtonText: {
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600",
    fontSize: 14
  }
});
