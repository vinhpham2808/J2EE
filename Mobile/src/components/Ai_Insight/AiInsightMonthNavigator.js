import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function AiInsightMonthNavigator({
  canGoNext,
  canGoPrev,
  disabled,
  goToNextMonth,
  goToPrevMonth,
  monthLabel
}) {
  return (
    <View style={styles.monthRow}>
      <Pressable
        onPress={goToPrevMonth}
        disabled={!canGoPrev || disabled}
        style={[styles.arrow, (!canGoPrev || disabled) && styles.arrowOff]}
      >
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <Pressable
        onPress={goToNextMonth}
        disabled={!canGoNext || disabled}
        style={[styles.arrow, (!canGoNext || disabled) && styles.arrowOff]}
      >
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  arrow: {
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  arrowOff: {
    opacity: 0.3
  },
  arrowText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.PRIMARY
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.TEXT,
    minWidth: 120,
    textAlign: "center"
  }
});
