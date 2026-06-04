import React, { useRef, useState } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { CategoryVectorIcon, getIconColor } from "../../utils/categoryIcons";
import { CATEGORY_TYPE_META } from "./categoryTypeMeta";

const MENU_HEIGHT = 116;
const MENU_BOTTOM_MARGIN = 88;
const MENU_SCREEN_PADDING = 12;

export default function CategoryItem({ item, onEditCategory, onDeleteCategory }) {
  const colors = useAppColors();
  const normalizedType = String(item?.type || "").toLowerCase();
  const iconColor = getIconColor(item?.icon);
  const meta = CATEGORY_TYPE_META[normalizedType] || {
    label: (item?.type || "-").toString().toUpperCase(),
    chipBg: COLORS.BG,
    chipText: COLORS.TEXT_SECONDARY
  };
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
    <View style={[styles.itemCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
      <View style={styles.itemLeft}>
        <View style={[styles.itemIconBubble, { backgroundColor: `${iconColor}18` }]}>
          <CategoryVectorIcon iconValue={item?.icon} size={18} color={iconColor} style={styles.itemIconText} />
        </View>
        <Text style={[styles.itemName, { color: colors.TEXT }]}>{item?.name || "Chưa đặt tên"}</Text>
      </View>

      <View style={styles.itemRight}>
        <View style={[styles.typeChip, { backgroundColor: meta.chipBg }]}>
          <Text style={[styles.typeChipText, { color: meta.chipText }]}>{meta.label}</Text>
        </View>

        <Pressable
          ref={menuButtonRef}
          style={styles.menuDots}
          onPress={openMenu}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.menuDotsText, { color: colors.TEXT_SECONDARY }]}>⋮</Text>
        </Pressable>
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
              <Text style={styles.menuItemIcon}>✏️</Text>
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
              <Text style={styles.menuItemIcon}>🗑️</Text>
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
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10
  },
  itemIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.ROSE_MIST,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },
  itemIconText: {
    fontSize: 18
  },
  itemName: {
    color: COLORS.TEXT,
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1
  },
  itemRight: {
    alignItems: "flex-end"
  },
  typeChip: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  typeChipText: {
    fontWeight: "800",
    fontSize: 12
  },
  menuDots: {
    marginTop: 8,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  menuDotsText: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 1
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)"
  },
  menuDropdown: {
    position: "absolute",
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    minWidth: 120,
    overflow: "hidden",
    shadowColor: COLORS.TEXT,
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
  menuItemIcon: {
    fontSize: 16
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.TEXT
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.CARD_BORDER,
    marginHorizontal: 18
  }
});
