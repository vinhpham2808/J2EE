import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function PaymentCheckoutHeader({ canGoBack, onGoBack, title }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTextWrap}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>Bạn có thể thanh toán ngay trong app. Nếu cần mở app ngân hàng, ứng dụng sẽ bật liên kết ngoài.</Text>
      </View>
      {canGoBack ? (
        <Pressable style={styles.secondaryButton} onPress={onGoBack}>
          <Text style={styles.secondaryButtonText}>Lùi</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  headerTextWrap: {
    flex: 1
  },
  headerTitle: {
    color: COLORS.TEXT,
    fontSize: 18,
    fontWeight: "700"
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    lineHeight: 20
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.CARD
  },
  secondaryButtonText: {
    color: COLORS.TEXT,
    fontWeight: "700"
  }
});
