import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import {
  CATEGORY_COLORS,
  TREND_CONFIG,
} from "../../utils/forecast";
import { formatMoney } from "../../utils/format";

export default function ForecastCategoryChips({
  categories,
  selectedCategoryId,
  onSelect,
}) {
  const colors = useAppColors();

  if (categories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.chipContent}
    >
      {categories.map((cat, idx) => {
        const isSelected = cat.categoryId === selectedCategoryId;
        const accent = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
        const trend = TREND_CONFIG[cat.trend] || TREND_CONFIG.STABLE;
        return (
          <Pressable
            key={cat.categoryId}
            style={[
              styles.chip,
              { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER },
              isSelected && { borderColor: accent, borderWidth: 2 },
            ]}
            onPress={() => onSelect(cat.categoryId)}
          >
            <Text style={styles.chipIcon}>{trend.icon}</Text>
            <Text style={[styles.chipLabel, { color: colors.TEXT }, isSelected && { fontWeight: "800" }]}> 
              {cat.categoryName}
            </Text>
            <Text style={[styles.chipAmount, { color: trend.color }]}>
              {formatMoney(cat.predictedAmount)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipScroll: {
    marginTop: 12,
  },
  chipContent: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT,
  },
  chipAmount: {
    fontSize: 12,
    fontWeight: "700",
  },
});
