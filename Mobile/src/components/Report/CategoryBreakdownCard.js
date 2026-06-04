import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatMoney } from "../../utils/format";

export default function CategoryBreakdownCard({ categories }) {
  const colors = useAppColors();

  if (!categories || categories.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
      <Text style={[styles.cardTitle, { color: colors.TEXT }]}>📂 Chi tiêu theo danh mục</Text>
      {categories.map((item, idx) => (
        <View key={idx} style={styles.categoryItem}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryIcon}>{item.icon || "🧾"}</Text>
              <Text style={[styles.categoryName, { color: colors.TEXT }]}>{item.name}</Text>
            </View>
            <Text style={[styles.categoryAmount, { color: colors.EXPENSE }]}>{formatMoney(item.amount)}</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${item.percent}%`, backgroundColor: item.color || COLORS.PRIMARY }]} />
            <Text style={[styles.percentText, { color: colors.TEXT_SECONDARY }]}>{Math.round(item.percent)}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 14,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    flex: 1,
  },
  percentText: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "right",
  },
});
