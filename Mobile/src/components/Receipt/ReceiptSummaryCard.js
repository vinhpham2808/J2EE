import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { formatDate, formatMoney } from "../../utils/format";

export default function ReceiptSummaryCard({ itemCount, location, merchant, receiptDate, totalAmount }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>🧾 {merchant || "Hóa đơn"}</Text>
      {location ? <Text style={styles.summaryLocation}>📍 {location}</Text> : null}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryDate}>📅 {formatDate(receiptDate)}</Text>
        <Text style={styles.summaryCount}>{itemCount} mục</Text>
      </View>
      <Text style={styles.summaryTotal}>Tổng: {formatMoney(totalAmount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: COLORS.CARD,
    margin: 16,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 4
  },
  summaryLocation: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  summaryDate: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY
  },
  summaryCount: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: "600"
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.EXPENSE
  }
});
