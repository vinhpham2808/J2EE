import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { COLORS } from "../../constants/colors";
import { getCategoryIconPresets } from "../../utils/VectorIcons";
import { CategoryVectorIcon } from "../../utils/VectorIcons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;
const NUM_COLUMNS = 3;
const GAP = 10;
const CARD_SIZE = (Dimensions.get("window").width - 32 - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

// ═══════════════════════════════════════════════════════════
// Animated Icon Card
// ═══════════════════════════════════════════════════════════
function IconCard({ item, isSelected, onSelect }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stop any running animations before starting new ones
    scaleAnim.stopAnimation();
    glowAnim.stopAnimation();
    checkAnim.stopAnimation();

    if (isSelected) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.06,
          friction: 6,
          tension: 100,
          useNativeDriver: false
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false
        }),
        Animated.spring(checkAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: false
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: false
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false
        }),
        Animated.timing(checkAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false
        })
      ]).start();
    }
  }, [isSelected]);

  const backgroundColor = isSelected ? COLORS.ROSE_MIST : COLORS.CARD;
  const borderColor = isSelected ? COLORS.PRIMARY : COLORS.CARD_BORDER;
  const iconValue = item.value;
  const cardColor = item.color || COLORS.PRIMARY;

  return (
    <Animated.View
      style={[
        styles.iconCard,
        {
          backgroundColor,
          borderColor,
          transform: [{ scale: scaleAnim }],
          shadowColor: COLORS.PRIMARY,
          shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.25]
          }),
          shadowRadius: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 8]
          }),
          shadowOffset: { width: 0, height: 0 },
          elevation: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 6]
          })
        }
      ]}
    >
      <Pressable
        style={styles.iconCardPressable}
        onPress={() => onSelect(item)}
        android_ripple={{ color: COLORS.PRIMARY_GLOW, borderless: false, radius: CARD_SIZE / 2 }}
      >
        {/* Icon circle */}
        <View style={styles.iconCircle}>
          <CategoryVectorIcon iconValue={iconValue} size={20} color={cardColor} />
        </View>

        {/* Checkmark */}
        {isSelected && (
          <Animated.View
            style={[
              styles.checkBadge,
              {
                transform: [
                  { scale: checkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }
                ],
                opacity: checkAnim
              }
            ]}
          >
            <Text style={styles.checkText}>✓</Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Bottom Sheet Component
// ═══════════════════════════════════════════════════════════
export default function IconPickerBottomSheet({
  visible,
  onClose,
  onSelect,
  selectedIcon,
  type = "expense"
}) {
  // ── State ──────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [recentIcons, setRecentIcons] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "recent"

  // ── Data ───────────────────────────────────────────────
  const allIcons = useMemo(() => getCategoryIconPresets(type), [type]);

  const displayedIcons = activeTab === "recent" && recentIcons.length > 0
    ? recentIcons
    : allIcons;

  // ── Sheet open/close animation ────────────────────────
  useEffect(() => {
    // Stop any running sheet animations before starting new ones
    slideAnim.stopAnimation();
    backdropAnim.stopAnimation();

    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          tension: 50,
          useNativeDriver: false
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: SHEET_HEIGHT,
          friction: 9,
          tension: 50,
          useNativeDriver: false
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false
        })
      ]).start();
    }
  }, [visible]);

  // ── Handlers ──────────────────────────────────────────
  const handleSelect = useCallback(
    (item) => {
      // Save to recent
      setRecentIcons((prev) => {
        const filtered = prev.filter((r) => r.value !== item.value);
        return [item, ...filtered].slice(0, 9);
      });
      onSelect(item.value);
    },
    [onSelect]
  );

  const handleClose = () => {
    onClose();
  };

  // ── Render ────────────────────────────────────────────
  const selectedValue = selectedIcon;
  const selectedItem = allIcons.find((i) => i.value === selectedValue);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropAnim }
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={handleClose} />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Drag handle */}
        <View style={styles.dragHandleWrapper}>
          <View style={styles.dragHandle} />
        </View>

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Chọn icon</Text>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Currently selected preview */}
        {selectedItem && (
          <View style={styles.selectedPreview}>
            <View style={[styles.selectedPreviewCircle, { backgroundColor: (selectedItem.color || COLORS.PRIMARY) + "18" }]}>
              <CategoryVectorIcon iconValue={selectedItem.value} size={22} color={selectedItem.color || COLORS.PRIMARY} />
            </View>
            <Text style={styles.selectedPreviewLabel}>{selectedItem.label}</Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tab, activeTab === "all" && styles.tabActive]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
              Tất cả ({allIcons.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "recent" && styles.tabActive]}
            onPress={() => setActiveTab("recent")}
          >
            <Text style={[styles.tabText, activeTab === "recent" && styles.tabTextActive]}>
              Gần đây {recentIcons.length > 0 ? `(${recentIcons.length})` : ""}
            </Text>
          </Pressable>
        </View>

        {/* Icon Grid */}
        <FlatList
          data={displayedIcons}
          keyExtractor={(item) => item.value}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchEmoji}>🔎</Text>
              <Text style={styles.emptySearchText}>Chưa có icon gần đây</Text>
            </View>
          }
          renderItem={({ item }) => (
            <IconCard
              item={item}
              isSelected={item.value === selectedValue}
              onSelect={handleSelect}
            />
          )}
        />

        {/* Confirm button */}
        <Pressable style={styles.confirmBtn} onPress={handleClose}>
          <Text style={styles.confirmBtnText}>Xác nhận</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)"
  },
  backdropPressable: {
    flex: 1
  },

  // Sheet
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 34,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 15
  },

  // Drag handle
  dragHandleWrapper: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.CARD_BORDER
  },

  // Header
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    justifyContent: "center",
    alignItems: "center"
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY
  },

  // Selected preview
  selectedPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + "40",
    padding: 10,
    marginBottom: 12
  },
  selectedPreviewCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },
  selectedPreviewEmoji: {
    fontSize: 22
  },
  selectedPreviewLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.TEXT
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    marginBottom: 10
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  tabActive: {
    backgroundColor: COLORS.ROSE_MIST,
    borderColor: COLORS.PRIMARY
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY
  },
  tabTextActive: {
    color: COLORS.PRIMARY
  },

  // Grid
  gridContent: {
    paddingBottom: 12
  },
  gridRow: {
    gap: GAP,
    marginBottom: GAP
  },

  // Icon Card
  iconCard: {
    width: CARD_SIZE,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden"
  },
  iconCardPressable: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4
  },
  iconEmoji: {
    fontSize: 22
  },
  iconLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.TEXT,
    textAlign: "center",
    lineHeight: 15
  },

  // Check badge
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  checkText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: "800"
  },

  // Confirm button
  confirmBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  confirmBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "800"
  },

  // Empty state
  emptySearch: {
    alignItems: "center",
    paddingVertical: 40
  },
  emptySearchEmoji: {
    fontSize: 40,
    marginBottom: 10
  },
  emptySearchText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center"
  }
});
