import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

/**
 * Empty state placeholder shown when no data is available.
 *
 * @param {object}  props
 * @param {string}  [props.message="Chưa có dữ liệu"] - Display message
 */
export default function ForecastEmptyState({ message }) {
  const colors = useAppColors();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📭</Text>
      <Text style={[styles.text, { color: colors.TEXT_SECONDARY }]}>{message || "Chưa có dữ liệu"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
});
