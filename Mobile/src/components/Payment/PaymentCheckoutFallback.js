import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function PaymentCheckoutFallback({ onBackToPayment }) {
  return (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackTitle}>Không tìm thấy liên kết thanh toán</Text>
      <Text style={styles.fallbackText}>Hãy quay lại và tạo giao dịch mới.</Text>
      <Pressable style={styles.primaryButton} onPress={onBackToPayment}>
        <Text style={styles.primaryButtonText}>Quay lại thanh toán</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.BG
  },
  fallbackTitle: {
    color: COLORS.TEXT,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center"
  },
  fallbackText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 18
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  primaryButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700"
  }
});
