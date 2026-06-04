import React, { useRef, useState, useMemo } from "react";
import { Animated, Pressable, StyleSheet, Text, View, Modal, ScrollView, Dimensions } from "react-native";
import { COLORS } from "../../constants/colors";
import { CategoryVectorIcon, getIconColor } from "../../utils/VectorIcons";

/**
 * Modern 2-column pastel grid category selector.
 *
 * Features:
 * - 2-column grid layout — easy to scan on mobile
 * - Pastel card backgrounds with soft shadows
 * - Selected state: subtle fill, primary border, checkmark badge
 * - Scale animation on press and selection
 * - Icon rendered inside a pastel circular container (44×44)
 *
 * Props:
 * - categories: Array<{ id, name, icon, color? }>
 * - selectedId: string | number — currently selected category id
 * - onSelect: (id: string) => void
 * - loading: boolean — show loading state
 * - emptyText: string — text when no categories
 * - maxDisplay: number — max items to show directly (default: 6) before showing "Xem thêm"
 */

export default function CategoryGridSelector({
  categories = [],
  selectedId,
  onSelect,
  loading = false,
  emptyText = "Chưa có danh mục. Hãy tạo danh mục ở tab Danh mục.",
  maxDisplay = 6
}) {
  const [sheetVisible, setSheetVisible] = useState(false);

  const displayData = useMemo(() => {
    if (categories.length <= maxDisplay) return categories;

    // Cần hiển thị (maxDisplay - 1) mục + 1 nút "Xem thêm"
    const limit = maxDisplay - 1;
    let topVisible = categories.slice(0, limit);

    // Luôn ưu tiên hiển thị mục đang được chọn
    if (selectedId) {
      const isSelectedVisible = topVisible.some(c => String(c.id) === String(selectedId));
      if (!isSelectedVisible) {
        const selectedItem = categories.find(c => String(c.id) === String(selectedId));
        if (selectedItem) {
          topVisible[limit - 1] = selectedItem; // Đổi chỗ cuối cùng cho item đang chọn
        }
      }
    }
    return topVisible;
  }, [categories, selectedId, maxDisplay]);

  if (loading) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateText}>Đang tải danh mục...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.grid}>
        {displayData.map((category) => (
          <CategoryCard
            key={String(category.id)}
            category={category}
            active={String(category.id) === String(selectedId)}
            onPress={() => onSelect(String(category.id))}
          />
        ))}
        {categories.length > maxDisplay && (
          <MoreCard
            onPress={() => setSheetVisible(true)}
            count={categories.length - displayData.length}
          />
        )}
      </View>

      {/* Bottom Sheet hiển thị toàn bộ danh mục */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSheetVisible(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Tất cả danh mục</Text>
              <Pressable onPress={() => setSheetVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>Đóng</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetGrid}>
              <View style={styles.grid}>
                {categories.map((category) => (
                  <CategoryCard
                    key={String(category.id)}
                    category={category}
                    active={String(category.id) === String(selectedId)}
                    onPress={() => {
                      onSelect(String(category.id));
                      setSheetVisible(false);
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function MoreCard({ onPress, count }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 36, bounciness: 8 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 36, bounciness: 8 }).start();
  };

  return (
    <Animated.View style={{ width: "48%", transform: [{ scale }] }}>
      <Pressable
        style={[styles.card, { backgroundColor: COLORS.CARD, borderColor: COLORS.CARD_BORDER }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.iconBubble, { backgroundColor: COLORS.CARD_BORDER + "40" }]}>
          <Text style={{ fontSize: 20 }}>🔥</Text>
        </View>
        <Text style={[styles.label, { color: COLORS.TEXT_SECONDARY }]}>
          +{count} Khác
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function CategoryCard({ category, active, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 36,
      bounciness: 8
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 36,
      bounciness: 8
    }).start();
  };

  // Icon color from preset or fallback to a soft pastel tone
  const iconColor = category.color || getIconColor(category.icon) || COLORS.PRIMARY;

  // Pastel bg: use icon color at ~12% opacity, or fallback
  const iconBg = iconColor + "18";

  // Selected fill: rose mist (app theme)
  const cardBg = active ? COLORS.ROSE_MIST : COLORS.CARD;
  const cardBorder = active ? COLORS.PRIMARY : COLORS.CARD_BORDER;

  return (
    <Animated.View style={{ width: "48%", transform: [{ scale }] }}>
      <Pressable
        style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Checkmark badge (selected only) */}
        {active && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}

        {/* Icon container */}
        <View style={[styles.iconBubble, { backgroundColor: active ? COLORS.WHITE : iconBg }]}>
          <CategoryVectorIcon iconValue={category.icon} size={26} color={iconColor} />
        </View>

        {/* Label */}
        <Text
          style={[styles.label, active && styles.labelActive]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {category.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const CARD_BORDER_RADIUS = 20;
const ICON_SIZE = 44;

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
    rowGap: 10
  },

  card: {
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    // Soft shadow — subtle depth
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },

  iconBubble: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT,
    textAlign: "center"
  },

  labelActive: {
    color: COLORS.PRIMARY,
    fontWeight: "700"
  },

  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  },

  checkText: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 15
  },

  stateWrap: {
    width: "100%",
    marginBottom: 16
  },

  stateText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20
  },

  // Modal / Bottom Sheet styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)"
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  bottomSheet: {
    backgroundColor: COLORS.BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get("window").height * 0.8,
    minHeight: Dimensions.get("window").height * 0.5, // ensures it has enough space
    paddingTop: 16,
    paddingBottom: Dimensions.get("window").height * 0.05,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.CARD_BORDER,
    borderRadius: 99
  },
  closeText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY
  },
  sheetGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20
  }
});
