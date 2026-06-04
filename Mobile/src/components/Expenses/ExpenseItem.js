import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatDate, formatMoney } from "../../utils/format";
import { CategoryVectorIcon, getIconColor } from "../../utils/categoryIcons";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ colors, text, keyword }) {
  if (!keyword || !text) {
    return <Text style={[styles.itemName, { color: colors.TEXT }]}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${escapeRegex(keyword)})`, "gi"));
  return (
    <Text style={[styles.itemName, { color: colors.TEXT }]}>
      {parts.map((part, index) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <Text key={`${part}-${index}`} style={[styles.highlight, { color: colors.TEXT }]}>
            {part}
          </Text>
        ) : (
          <Text key={`${part}-${index}`}>{part}</Text>
        )
      )}
    </Text>
  );
}

export default function ExpenseItem({ item, onDelete, searchKeyword }) {
  const colors = useAppColors();
  const amount = Number(item?.amount || 0);
  const note = item?.note || "";
  const iconColor = getIconColor(item?.icon);

  return (
    <View style={[styles.itemCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>
      <View style={styles.itemMain}>
        <View style={[styles.iconBubble, { backgroundColor: `${iconColor}18` }]}>
          <CategoryVectorIcon iconValue={item?.icon} size={18} color={iconColor} />
        </View>

        <View style={styles.itemContent}>
          <HighlightText colors={colors} text={item?.name || "Chi tiêu"} keyword={searchKeyword} />
          <Text style={[styles.itemMeta, { color: colors.TEXT_SECONDARY }]}>{formatDate(item?.date)} • {item?.categoryName || "Khác"}</Text>
          {note ? (
            <View style={styles.noteRow}>
              <Text style={styles.noteIcon}>📝</Text>
              <Text style={[styles.noteText, { color: colors.TEXT_SECONDARY }]} numberOfLines={2}>
                {note}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.itemRight}>
        <Text style={[styles.itemAmount, { color: colors.EXPENSE }]}>- {formatMoney(amount)}</Text>
        <Pressable
          onPress={() => onDelete(item?.id)}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Xóa chi tiêu"
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
    color: COLORS.EXPENSE,
    fontWeight: "800"
  },
  deleteButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  deleteIcon: {
    color: COLORS.EXPENSE,
    fontSize: 14,
    lineHeight: 16
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    gap: 4
  },
  noteIcon: {
    fontSize: 11,
    marginTop: 1
  },
  noteText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
    lineHeight: 16
  },
  highlight: {
    backgroundColor: "#fff3b0",
    fontWeight: "700",
    color: COLORS.TEXT
  }
});
