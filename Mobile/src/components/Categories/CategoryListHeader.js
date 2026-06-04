import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import ShowMoreButton from "../common/ShowMoreButton";

export default function CategoryListHeader({ canExpand, hasCategories, onToggle, showAll }) {
  const colors = useAppColors();

  if (!hasCategories) {
    return null;
  }

  return (
    <View style={styles.listHeader}>
      <Text style={[styles.listTitle, { color: colors.TEXT }]}>Danh mục gần đây</Text>
      <ShowMoreButton visible={canExpand} expanded={showAll} onPress={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  listTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 16
  }
});
