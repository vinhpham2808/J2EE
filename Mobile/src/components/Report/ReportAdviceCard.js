import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

export default function ReportAdviceCard({ strengths, improvements }) {
  const colors = useAppColors();
  const hasStrengths = strengths && strengths.length > 0;
  const hasImprovements = improvements && improvements.length > 0;

  if (!hasStrengths && !hasImprovements) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
      <Text style={[styles.cardTitle, { color: colors.TEXT }]}>💡 Đánh giá & Khuyên nghị</Text>

      {hasStrengths && strengths.map((str, idx) => (
        <View key={`str-${idx}`} style={styles.tipRow}>
          <Text style={styles.tipIcon}>🌟</Text>
          <Text style={[styles.tipText, { color: colors.TEXT_SECONDARY }]}>{str}</Text>
        </View>
      ))}

      {hasImprovements && improvements.map((imp, idx) => (
        <View key={`imp-${idx}`} style={styles.tipRow}>
          <Text style={styles.tipIcon}>⚠️</Text>
          <Text style={[styles.tipText, { color: colors.TEXT_SECONDARY }]}>{imp}</Text>
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
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginVertical: 6,
  },
  tipIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
});
