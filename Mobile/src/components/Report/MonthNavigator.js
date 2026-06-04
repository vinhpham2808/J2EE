import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

export default function MonthNavigator({ selectedMonth, selectedYear, onPrev, onNext }) {
  const colors = useAppColors();

  return (
    <View style={[styles.header, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
      <Pressable onPress={onPrev} style={styles.arrowButton}>
        <Text style={[styles.arrowText, { color: colors.PRIMARY }]}>‹</Text>
      </Pressable>
      <Text style={[styles.monthLabel, { color: colors.TEXT }]}> 
        {MONTHS[selectedMonth - 1]} {selectedYear}
      </Text>
      <Pressable onPress={onNext} style={styles.arrowButton}>
        <Text style={[styles.arrowText, { color: colors.PRIMARY }]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  arrowButton: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    minWidth: 120,
    textAlign: "center",
  },
});
