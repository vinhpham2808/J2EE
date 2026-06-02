import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

/**
 * Compact summary metric card used in the forecast dashboard header row.
 *
 * @param {object}  props
 * @param {string}  props.icon   - Emoji icon
 * @param {string}  props.label  - Metric label
 * @param {string}  props.value  - Main value display
 * @param {string}  [props.sub]  - Optional subtitle
 * @param {string}  [props.accent] - Accent border/text color
 */
export default function ForecastSummaryCard({ icon, label, value, sub, accent }) {
  return (
    <View style={[styles.card, accent ? { borderColor: accent, borderWidth: 1.5 } : null]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent ? { color: accent } : null]} numberOfLines={1}>
        {value}
      </Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600",
    textAlign: "center",
  },
  value: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginTop: 2,
    textAlign: "center",
  },
  sub: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 1,
  },
});
