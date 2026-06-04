import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CategoryVectorIcon, getCategoryIconPresets } from "../../utils/categoryIcons";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.58, 520);
const HORIZONTAL_PADDING = 16;
const GRID_GAP = 8;
const ICON_COLUMNS = 5;
const ICON_SIZE = Math.floor(
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP * (ICON_COLUMNS - 1)) / ICON_COLUMNS
);

function PickerHeader({ title, onClose }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Chọn icon đại diện cho danh mục</Text>
      </View>
      <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button">
        <Text style={styles.closeText}>×</Text>
      </Pressable>
    </View>
  );
}

function SelectedIconSummary({ item }) {
  if (!item) return null;

  const color = item.color || COLORS.PRIMARY;

  return (
    <View style={styles.selectedRow}>
      <View style={[styles.selectedIconBox, { backgroundColor: `${color}18` }]}>
        <CategoryVectorIcon iconValue={item.value} size={22} color={color} />
      </View>
      <Text style={styles.selectedLabel} numberOfLines={1}>{item.label}</Text>
    </View>
  );
}

function PickerTabs({ activeTab, allCount, recentCount, onChange }) {
  return (
    <View style={styles.tabs}>
      <TabButton
        active={activeTab === "all"}
        label={`Tất cả ${allCount}`}
        onPress={() => onChange("all")}
      />
      <TabButton
        active={activeTab === "recent"}
        disabled={recentCount === 0}
        label={`Gần đây ${recentCount || ""}`.trim()}
        onPress={() => onChange("recent")}
      />
    </View>
  );
}

function TabButton({ active, disabled, label, onPress }) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive, disabled && styles.tabDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={[styles.tabText, active && styles.tabTextActive, disabled && styles.tabTextDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

const IconOption = memo(function IconOption({ item, selected, onSelect }) {
  const color = item.color || COLORS.PRIMARY;

  return (
    <Pressable
      style={[styles.iconOption, selected && styles.iconOptionSelected]}
      onPress={() => onSelect(item)}
      accessibilityRole="button"
      accessibilityLabel={`Chọn icon ${item.label}`}
    >
      <View style={[styles.iconCircle, selected && { backgroundColor: `${color}16` }]}>
        <CategoryVectorIcon iconValue={item.value} size={21} color={color} />
      </View>
      {selected ? <Text style={styles.checkMark}>✓</Text> : null}
    </Pressable>
  );
});

function EmptyRecent() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Chưa có icon gần đây</Text>
      <Text style={styles.emptyText}>Icon bạn chọn sẽ xuất hiện ở đây.</Text>
    </View>
  );
}

export default function IconPickerBottomSheet({
  visible,
  onClose,
  onSelect,
  selectedIcon,
  type = "expense"
}) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [recentIcons, setRecentIcons] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const allIcons = useMemo(() => getCategoryIconPresets(type), [type]);
  const icons = activeTab === "recent" ? recentIcons : allIcons;
  const selectedItem = useMemo(
    () => allIcons.find((item) => item.value === selectedIcon),
    [allIcons, selectedIcon]
  );

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: visible ? 0 : SHEET_HEIGHT,
        friction: 10,
        tension: 60,
        useNativeDriver: true
      }),
      Animated.timing(backdropAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 180 : 140,
        useNativeDriver: true
      })
    ]).start();
  }, [backdropAnim, slideAnim, visible]);

  useEffect(() => {
    if (recentIcons.length === 0 && activeTab === "recent") {
      setActiveTab("all");
    }
  }, [activeTab, recentIcons.length]);

  const handleSelect = useCallback(
    (item) => {
      setRecentIcons((current) => [item, ...current.filter((icon) => icon.value !== item.value)].slice(0, 10));
      onSelect(item.value);
    },
    [onSelect]
  );

  const renderIcon = useCallback(
    ({ item }) => (
      <IconOption item={item} selected={item.value === selectedIcon} onSelect={handleSelect} />
    ),
    [handleSelect, selectedIcon]
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />
        <PickerHeader title="Chọn icon" onClose={onClose} />
        <SelectedIconSummary item={selectedItem} />
        <PickerTabs
          activeTab={activeTab}
          allCount={allIcons.length}
          recentCount={recentIcons.length}
          onChange={setActiveTab}
        />

        <FlatList
          data={icons}
          keyExtractor={(item) => item.value}
          numColumns={ICON_COLUMNS}
          renderItem={renderIcon}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyRecent />}
        />

        <Pressable style={styles.doneButton} onPress={onClose} accessibilityRole="button">
          <Text style={styles.doneText}>Xong</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)"
  },
  backdropPressable: {
    flex: 1
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 18,
    shadowColor: COLORS.TEXT,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    elevation: 14
  },
  handle: {
    alignSelf: "center",
    width: 34,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.CARD_BORDER,
    marginTop: 10,
    marginBottom: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  title: {
    color: COLORS.TEXT,
    fontSize: 18,
    fontWeight: "800"
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 2
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  closeText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 21
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 14,
    padding: 8,
    marginBottom: 10
  },
  selectedIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  selectedLabel: {
    flex: 1,
    color: COLORS.TEXT,
    fontSize: 14,
    fontWeight: "700"
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  tab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  tabActive: {
    backgroundColor: COLORS.ROSE_MIST,
    borderColor: COLORS.PRIMARY
  },
  tabDisabled: {
    opacity: 0.45
  },
  tabText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "700"
  },
  tabTextActive: {
    color: COLORS.PRIMARY
  },
  tabTextDisabled: {
    color: COLORS.TEXT_MUTED
  },
  grid: {
    paddingBottom: 8
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP
  },
  iconOption: {
    width: ICON_SIZE,
    height: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    backgroundColor: COLORS.CARD,
    alignItems: "center",
    justifyContent: "center"
  },
  iconOptionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.ROSE_MIST
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  checkMark: {
    position: "absolute",
    top: 4,
    right: 6,
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: "900"
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 34
  },
  emptyTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    marginBottom: 4
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12
  },
  doneButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 6
  },
  doneText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: "800"
  }
});
