import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatDate } from "../../utils/format";

export default function ForecastAISection({
  narrative,
  generatedAt,
  hasError,
}) {
  const colors = useAppColors();

  if (narrative) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>🤖 Phân tích AI</Text>
        <View style={[styles.insightCard, { backgroundColor: colors.CARD, borderColor: colors.PRIMARY_LIGHT }]}> 
          <Text style={[styles.insightText, { color: colors.TEXT }]}>{narrative}</Text>
          {generatedAt ? (
            <Text style={[styles.insightTime, { color: colors.TEXT_MUTED }]}>{formatDate(generatedAt)}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.section}>
        <View style={[styles.insightFallback, { backgroundColor: colors.WARNING_LIGHT, borderColor: colors.WARNING }]}> 
          <Text style={[styles.insightFallbackText, { color: colors.TEXT }]}> 
            ⚠️ Không thể tạo phân tích AI lúc này. Vui lòng thử lại sau.
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 10,
  },
  insightCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT,
    padding: 14,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.TEXT,
    lineHeight: 21,
  },
  insightTime: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 8,
    textAlign: "right",
  },
  insightFallback: {
    backgroundColor: COLORS.WARNING_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.WARNING,
    padding: 12,
  },
  insightFallbackText: {
    fontSize: 13,
    color: COLORS.TEXT,
    lineHeight: 19,
  },
});
