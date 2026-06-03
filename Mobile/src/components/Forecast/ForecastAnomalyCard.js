import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { formatMoney, formatDate } from "../../utils/format";

/**
 * Displays a single anomaly transaction row.
 *
 * @param {object} props
 * @param {object} props.item - Anomaly data { transactionId, categoryName, date, amount, meanAmount }
 */
export default function ForecastAnomalyCard({ item }) {
  const amount = Number(item?.amount || 0);
  const meanAmount = Number(item?.meanAmount || 0);

  const deviation = useMemo(() => {
    if (meanAmount <= 0) return 0;
    return Math.round((amount / meanAmount - 1) * 100);
  }, [amount, meanAmount]);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.warnIcon}>⚠️</Text>
        <View style={styles.info}>
          <Text style={styles.category}>{item?.categoryName || "Không rõ"}</Text>
          <Text style={styles.date}>{formatDate(item?.date)}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatMoney(amount)}</Text>
        <Text style={styles.deviation}>
          {deviation > 0 ? `Cao hơn ${deviation}% so với TB` : "Bất thường"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  warnIcon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT,
  },
  date: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.EXPENSE,
  },
  deviation: {
    fontSize: 11,
    color: COLORS.WARNING,
    fontWeight: "600",
    marginTop: 2,
  },
});
