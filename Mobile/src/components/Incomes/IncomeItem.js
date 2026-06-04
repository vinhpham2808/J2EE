import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatDate, formatMoney } from "../../utils/format";

export default function IncomeItem({ item, onDelete }) {
  const colors = useAppColors();

  return (
    <View style={[styles.itemCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
      <View style={styles.itemMain}>
        <View style={[styles.iconBubble, { backgroundColor: colors.ROSE_MIST }]}> 
          <Text style={styles.iconText}>{item?.icon || "💰"}</Text>
        </View>

        <View style={styles.itemContent}>
          <Text style={[styles.itemName, { color: colors.TEXT }]}>{item?.name || "Thu nhập"}</Text>
          <Text style={[styles.itemMeta, { color: colors.TEXT_SECONDARY }]}>{formatDate(item?.date)} • {item?.categoryName || "Khác"}</Text>
        </View>
      </View>

      <View style={styles.itemRight}>
        <Text style={[styles.itemAmount, { color: colors.INCOME }]}>+ {formatMoney(item?.amount)}</Text>
        <Pressable
          onPress={() => onDelete(item?.id)}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Xóa thu nhập"
        >
          <Text style={[styles.deleteIcon, { color: colors.EXPENSE }]}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  itemMain: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.ROSE_MIST,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  iconText: {
    fontSize: 18
  },
  itemContent: {
    flex: 1
  },
  itemName: {
    fontWeight: "700",
    color: COLORS.TEXT,
    fontSize: 15
  },
  itemMeta: {
    marginTop: 4,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12
  },
  itemRight: {
    alignItems: "flex-end"
  },
  itemAmount: {
    color: COLORS.INCOME,
    fontWeight: "800"
  },
  deleteButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  deleteIcon: {
    color: "#b42318",
    fontSize: 14,
    lineHeight: 16
  }
});
