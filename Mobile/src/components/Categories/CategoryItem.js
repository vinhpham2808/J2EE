import React, { useRef, useState } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppColors } from "../../constants/colors";
import { getIconColor } from "../../utils/categoryIcons";
import { formatDate } from "../../utils/format";
import { CATEGORY_TYPE_META } from "./categoryTypeMeta";
import AppIcon from "../ui/AppIcon";
import TransactionIcon from "../ui/TransactionIcon";

const MENU_HEIGHT = 116;
const MENU_BOTTOM_MARGIN = 88;
const MENU_SCREEN_PADDING = 12;

function getCreatedAtLabel(item) {
  const createdAt = item?.createdAt || item?.createdDate || item?.created_at;
  if (!createdAt) return null;

  try {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return null;
    const time = new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
    return `${time} • ${formatDate(date)}`;
  } catch {
    return `${formatDate(createdAt)}`;
  }
}

export default function CategoryItem({ item, onEditCategory, onDeleteCategory }) {
  const colors = useAppColors();
  const normalizedType = String(item?.type || "").toLowerCase();
  const iconColor = getIconColor(item?.icon);
  const meta = CATEGORY_TYPE_META[normalizedType] || {
    label: (item?.type || "-").toString().toUpperCase(),
    chipBg: colors.BG,
    chipText: colors.TEXT_SECONDARY
  };
  const createdAtLabel = getCreatedAtLabel(item);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 16 });
  const menuButtonRef = useRef(null);

  const openMenu = () => {
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      const screenWidth = Dimensions.get("window").width;
      const screenHeight = Dimensions.get("window").height;
      const anchoredTop = y + height / 2 - MENU_HEIGHT / 2;
      const maxTop = screenHeight - MENU_BOTTOM_MARGIN - MENU_HEIGHT;
      const top = Math.min(
        Math.max(MENU_SCREEN_PADDING, anchoredTop),
        Math.max(MENU_SCREEN_PADDING, maxTop)
      );

      setMenuPosition({
        top,
        right: Math.max(MENU_SCREEN_PADDING, screenWidth - x - width)
      });
      setMenuVisible(true);
    });
  };

  return (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: colors.CARD,
          borderColor: colors.CARD_BORDER,
          shadowColor: colors.SHADOW_COLOR || "#000",
        },
      ]}
    >
      <Pressable
        ref={menuButtonRef}
        style={styles.menuDots}
        onPress={openMenu}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.menuDotsText, { color: colors.TEXT_SECONDARY }]}>⋮</Text>
      </Pressable>

      <TransactionIcon iconValue={item?.icon} size={24} containerSize={48} color={iconColor} />

      <View style={styles.itemContent}>
        <Text numberOfLines={1} style={[styles.itemName, { color: colors.TEXT }]}>
          {item?.name || "Chưa đặt tên"}
        </Text>

        <View style={[styles.typeChip, { backgroundColor: meta.chipBg }]}>
          <Text style={[styles.typeChipText, { color: meta.chipText }]}>{meta.label}</Text>
        </View>
        {createdAtLabel ? (
          <Text style={[styles.createdAtText, { color: colors.TEXT_MUTED }]} numberOfLines={1}>{createdAtLabel}</Text>
        ) : null}
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuDropdown, menuPosition, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER, shadowColor: colors.TEXT }]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onEditCategory(item);
              }}
            >
              <AppIcon name="pencil-outline" size={16} color={colors.TEXT} />
              <Text style={[styles.menuItemText, { color: colors.TEXT }]}>Chỉnh sửa</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: colors.CARD_BORDER }]} />
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onDeleteCategory(item);
              }}
            >
              <AppIcon name="trash-outline" size={16} color={colors.EXPENSE} />
              <Text style={[styles.menuItemText, { color: colors.EXPENSE }]}>Xóa</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    margin: 6,
    position: "relative",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  itemContent: {
    flex: 1,
    paddingRight: 32
  },
  menuDots: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  menuDotsText: {
    fontSize: 18,
    fontWeight: "800",
  },
  itemName: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 6,
    textAlign: "left",
  },
  typeChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  typeChipText: {
    fontWeight: "700",
    fontSize: 10,
  },
  createdAtText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "500"
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)"
  },
  menuDropdown: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 120,
    overflow: "hidden",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 8
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "600",
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 18
  }
});
