import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ShowMoreButton from "../common/ShowMoreButton";
import { COLORS } from "../../constants/colors";
import { clampScale, scale } from "../../utils/dimensions";

export function DashboardSectionHeader({ title, children }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function DashboardSectionCard({ children }) {
  return <View style={styles.sectionCard}>{children}</View>;
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
