import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ShowMoreButton from "../common/ShowMoreButton";
import { COLORS, useAppColors } from "../../constants/colors";
import { clampScale, scale } from "../../utils/layoutScale";

export function DashboardSectionHeader({ title, children }) {
  const colors = useAppColors();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>{title}</Text>
      {children}
    </View>
  );
}

export function DashboardSectionCard({ children }) {
  const colors = useAppColors();

  return <View style={[styles.sectionCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>{children}</View>;
}

export function ToggleSectionHeader({ title, visible, expanded, onPress }) {
  return (
    <DashboardSectionHeader title={title}>
      <ShowMoreButton visible={visible} expanded={expanded} onPress={onPress} />
    </DashboardSectionHeader>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale(6)
  },
  sectionTitle: {
    color: COLORS.TEXT,
    fontSize: clampScale(17, 15, 19),
    fontWeight: "800"
  },
  sectionCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: scale(12)
  }
});
