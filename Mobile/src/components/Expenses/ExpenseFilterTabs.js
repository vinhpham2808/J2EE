import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { EXPENSE_FILTER_TYPES } from "../../hooks/useExpenses";

const FILTER_OPTIONS = [
  { label: "Tháng này", value: EXPENSE_FILTER_TYPES.current },
  { label: "Tất cả", value: EXPENSE_FILTER_TYPES.all }
];

export default function ExpenseFilterTabs({ filterType, onChange }) {
  const colors = useAppColors();

  return (
    <View style={[styles.filterCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>
      <Text style={[styles.filterTitle, { color: colors.TEXT }]}>Khung thời gian</Text>
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((option, index) => {
          const isActive = filterType === option.value;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.filterChip,
                { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER },
                index === FILTER_OPTIONS.length - 1 && styles.filterChipLast,
                isActive && { backgroundColor: colors.EXPENSE_LIGHT || "rgba(239,68,68,0.15)", borderColor: colors.ACTION_EXPENSE || colors.EXPENSE }
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.filterChipText, { color: isActive ? (colors.ACTION_EXPENSE || colors.EXPENSE) : colors.TEXT }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 12
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 10
  },
  filterRow: {
    flexDirection: "row"
  },
  filterChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginRight: 8
  },
  filterChipLast: {
    marginRight: 0
  },
  filterChipText: {
    color: COLORS.TEXT,
    fontWeight: "700",
    fontSize: 12
  }
});
