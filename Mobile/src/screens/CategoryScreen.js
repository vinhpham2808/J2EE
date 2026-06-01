import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Dimensions, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { getApiErrorMessage } from "../utils/format";
import { COLORS } from "../constants/colors";
import { CategoryVectorIcon, getFirstCategoryIcon, getIconColor, getIconLabel } from "../utils/VectorIcons";
import IconPickerBottomSheet from "../components/IconPickerBottomSheet";
import ShowMoreButton, { useVisibleItems } from "../components/ShowMoreButton";
import { getSafeAreaBottom, getSafeAreaTop } from "../utils/safeAreaSpacing";

const TYPE_META = {
  expense: {
    label: "Chi tiêu",
    chipBg: COLORS.EXPENSE_LIGHT,
    chipText: COLORS.EXPENSE
  },
  income: {
    label: "Thu nhập",
    chipBg: COLORS.INCOME_LIGHT,
    chipText: COLORS.INCOME
  }
};

function CategoryTypeSegmentedControl({ value, onChange }) {
  const slideAnim = useRef(new Animated.Value(value === "expense" ? 1 : 0)).current;
  const thumbScaleAnim = useRef(new Animated.Value(1)).current;
  const [width, setWidth] = useState(0);
  const segmentWidth = width > 0 ? (width - 8) / 2 : 0;

  useEffect(() => {
    slideAnim.stopAnimation();
    thumbScaleAnim.stopAnimation();

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: value === "expense" ? 1 : 0,
        friction: 8,
        tension: 120,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(thumbScaleAnim, {
          toValue: 0.96,
          duration: 80,
          useNativeDriver: true
        }),
        Animated.spring(thumbScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 160,
          useNativeDriver: true
        })
      ])
    ]).start();
  }, [slideAnim, thumbScaleAnim, value]);

  const indicatorTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segmentWidth]
  });

  return (
    <View style={styles.typeRow} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.typeActiveIndicator,
            {
              width: segmentWidth,
              transform: [{ translateX: indicatorTranslateX }, { scale: thumbScaleAnim }]
            }
          ]}
        />
      ) : null}

      <Pressable style={styles.typeButton} onPress={() => onChange("income")}>
        <Text style={[styles.typeText, value === "income" && styles.typeTextActive]}>Thu nhập</Text>
      </Pressable>
      <Pressable style={styles.typeButton} onPress={() => onChange("expense")}>
        <Text style={[styles.typeText, value === "expense" && styles.typeTextActive]}>Chi tiêu</Text>
      </Pressable>
    </View>
  );
}

function CategoryItem({ item, onEditCategory, onDeleteCategory }) {
  const normalizedType = String(item?.type || "").toLowerCase();
  const iconColor = getIconColor(item?.icon);
  const meta = TYPE_META[normalizedType] || {
    label: (item?.type || "-").toString().toUpperCase(),
    chipBg: COLORS.BG,
    chipText: COLORS.TEXT_SECONDARY
  };
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 16 });
  const menuButtonRef = useRef(null);
  const MENU_HEIGHT = 116;
  const MENU_BOTTOM_MARGIN = 88;
  const MENU_SCREEN_PADDING = 12;

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
    <View style={styles.itemCard}>
      <View style={styles.itemLeft}>
        <View style={[styles.itemIconBubble, { backgroundColor: iconColor + "18" }]}>
          <CategoryVectorIcon iconValue={item?.icon} size={18} color={iconColor} style={styles.itemIconText} />
        </View>
        <Text style={styles.itemName}>{item?.name || "Chưa đặt tên"}</Text>
      </View>

      <View style={styles.itemRight}>
        <View style={[styles.typeChip, { backgroundColor: meta.chipBg }]}>
          <Text style={[styles.typeChipText, { color: meta.chipText }]}>{meta.label}</Text>
        </View>

        {/* 3-dot menu button */}
        <Pressable
          ref={menuButtonRef}
          style={styles.menuDots}
          onPress={openMenu}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.menuDotsText}>⋮</Text>
        </Pressable>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuDropdown, menuPosition]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onEditCategory(item);
              }}
            >
              <Text style={styles.menuItemIcon}>✏️</Text>
              <Text style={styles.menuItemText}>Chỉnh sửa</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onDeleteCategory(item);
              }}
            >
              <Text style={styles.menuItemIcon}>🗑️</Text>
              <Text style={[styles.menuItemText, { color: COLORS.EXPENSE }]}>Xóa</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("income");
  const [selectedIcon, setSelectedIcon] = useState(getFirstCategoryIcon("income"));
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("income");
  const [editIcon, setEditIcon] = useState(getFirstCategoryIcon("income"));
  const [editingCategorySaving, setEditingCategorySaving] = useState(false);
  const [isEditIconPickerOpen, setIsEditIconPickerOpen] = useState(false);

  useEffect(() => {
    setSelectedIcon(getFirstCategoryIcon(type));
  }, [type]);

  const formHint = useMemo(() => {
    if (type === "income") {
      return "Gợi ý: Lương, Freelance, Thưởng...";
    }
    return "Gợi ý: Ăn uống, Di chuyển, Giải trí...";
  }, [type]);

  const {
    visibleItems: visibleCategories,
    canToggle: canExpandCategories,
    expanded: showAllCategories,
    toggle: toggleCategories
  } = useVisibleItems(categories, { initialCount: 3, mode: "toggle" });

  const fetchCategories = useCallback(async () => {
    const response = await http.get(API_ENDPOINTS.GET_ALL_CATEGORIES);
    setCategories(Array.isArray(response.data) ? response.data : []);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCategories();
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được danh mục"));
    } finally {
      setRefreshing(false);
    }
  }, [fetchCategories]);

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  const onSave = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      Alert.alert("Thiếu dữ liệu", "Vui lòng nhập tên danh mục.");
      return;
    }

    const isDuplicate = categories.some((category) => {
      return String(category?.name || "").trim().toLowerCase() === normalizedName.toLowerCase();
    });
    if (isDuplicate) {
      Alert.alert("Trùng danh mục", "Tên danh mục đã tồn tại.");
      return;
    }

    setSaving(true);
    try {
      await http.post(API_ENDPOINTS.ADD_CATEGORY, {
        name: normalizedName,
        icon: selectedIcon,
        type
      });

      setName("");
      setType("income");
      setSelectedIcon(getFirstCategoryIcon("income"));
      await fetchCategories();
      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.create.category);
    } catch (error) {
      Alert.alert("Lưu thất bại", getApiErrorMessage(error, "Không thể thêm danh mục"));
    } finally {
      setSaving(false);
    }
  };

  const onOpenEditCategory = (category) => {
    if (!category?.id) return;
    const normalizedType = String(category.type || "income").toLowerCase() === "expense" ? "expense" : "income";
    setEditingCategory(category);
    setEditName(String(category.name || ""));
    setEditType(normalizedType);
    setEditIcon(String(category.icon || getFirstCategoryIcon(normalizedType)));
  };

  const onCloseEditCategory = () => {
    setEditingCategory(null);
    setEditName("");
    setEditType("income");
    setEditIcon(getFirstCategoryIcon("income"));
    setEditingCategorySaving(false);
  };

  const onDeleteCategory = (category) => {
    if (!category?.id) return;
    Alert.alert(
      "Xóa danh mục",
      `Bạn có chắc muốn xóa danh mục "${category.name}" không? Các giao dịch thuộc danh mục này sẽ không bị xóa.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await http.delete(API_ENDPOINTS.DELETE_CATEGORY(category.id));
              await fetchCategories();
              Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.delete.category);
            } catch (error) {
              Alert.alert("Xóa thất bại", getApiErrorMessage(error, "Không thể xóa danh mục này"));
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!editingCategory?.id) return;
    setEditIcon(getFirstCategoryIcon(editType));
  }, [editType, editingCategory]);

  const onUpdateCategory = async () => {
    if (!editingCategory?.id) return;
    const normalizedName = editName.trim();
    if (!normalizedName) {
      Alert.alert("Thiếu dữ liệu", "Vui lòng nhập tên danh mục.");
      return;
    }

    const isDuplicate = categories.some((category) => {
      const sameName = String(category?.name || "").trim().toLowerCase() === normalizedName.toLowerCase();
      const notCurrentCategory = Number(category?.id) !== Number(editingCategory.id);
      return sameName && notCurrentCategory;
    });
    if (isDuplicate) {
      Alert.alert("Trùng danh mục", "Tên danh mục đã tồn tại.");
      return;
    }

    setEditingCategorySaving(true);
    try {
      await http.put(API_ENDPOINTS.UPDATE_CATEGORY(editingCategory.id), {
        name: normalizedName,
        type: editType,
        icon: editIcon
      });
      await fetchCategories();
      onCloseEditCategory();
      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.update.category);
    } catch (error) {
      Alert.alert("Cập nhật thất bại", getApiErrorMessage(error, "Không thể cập nhật danh mục"));
      setEditingCategorySaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets) }]}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Thêm danh mục</Text>
        <Text style={styles.formSubtitle}>Tạo nhóm giao dịch rõ ràng để theo dõi chi tiêu tốt hơn.</Text>

        <Text style={styles.inputLabel}>Tên danh mục</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ví dụ: Ăn uống"
          placeholderTextColor="#98a2b3"
        />

        <Text style={styles.inputLabel}>Loại danh mục</Text>
        <CategoryTypeSegmentedControl value={type} onChange={setType} />

        <Text style={styles.hintText}>{formHint}</Text>

        <Text style={styles.inputLabel}>Icon</Text>
        <Pressable
          style={styles.iconPickerTrigger}
          onPress={() => setIsIconPickerOpen(true)}
        >
          <View style={styles.iconPickerPreview}>
            <CategoryVectorIcon iconValue={selectedIcon} size={22} />
          </View>
          <Text style={styles.iconPickerLabel}>{getIconLabel(selectedIcon)}</Text>
          <Text style={styles.iconPickerChevron}>›</Text>
        </Pressable>

        <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={onSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "Đang lưu..." : "Thêm danh mục"}</Text>
        </Pressable>
      </View>

      <FlatList
        data={visibleCategories}
        keyExtractor={(item) => String(item?.id)}
        renderItem={({ item }) => (
          <CategoryItem
            item={item}
            onEditCategory={onOpenEditCategory}
            onDeleteCategory={onDeleteCategory}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: getSafeAreaBottom(insets) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          categories.length ? (
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Danh mục gần đây</Text>
              <ShowMoreButton visible={canExpandCategories} expanded={showAllCategories} onPress={toggleCategories} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗂️</Text>
            <Text style={styles.emptyTitle}>Chưa có danh mục nào</Text>
            <Text style={styles.emptyText}>Tạo danh mục đầu tiên để bắt đầu quản lý giao dịch gọn gàng hơn.</Text>
          </View>
        }
      />

      <Modal visible={Boolean(editingCategory)} transparent animationType="slide" onRequestClose={onCloseEditCategory}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chỉnh sửa danh mục</Text>
            <Text style={styles.modalSubTitle}>Cập nhật tên, loại và icon</Text>

            <Text style={styles.inputLabel}>Tên danh mục</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Ví dụ: Ăn uống"
              placeholderTextColor="#98a2b3"
            />

            <Text style={styles.inputLabel}>Loại danh mục</Text>
            <CategoryTypeSegmentedControl value={editType} onChange={setEditType} />

            <Text style={styles.inputLabel}>Icon</Text>
            <Pressable
              style={styles.iconPickerTrigger}
              onPress={() => setIsEditIconPickerOpen(true)}
            >
              <View style={styles.iconPickerPreview}>
                <CategoryVectorIcon iconValue={editIcon} size={22} />
              </View>
              <Text style={styles.iconPickerLabel}>{getIconLabel(editIcon)}</Text>
              <Text style={styles.iconPickerChevron}>›</Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={onCloseEditCategory} disabled={editingCategorySaving}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveBtn, editingCategorySaving && styles.saveButtonDisabled]}
                onPress={onUpdateCategory}
                disabled={editingCategorySaving}
              >
                <Text style={styles.modalSaveText}>{editingCategorySaving ? "Đang lưu..." : "Lưu thay đổi"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Icon Picker Bottom Sheet - Create Form */}
      <IconPickerBottomSheet
        visible={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={setSelectedIcon}
        selectedIcon={selectedIcon}
        type={type}
      />

      {/* Icon Picker Bottom Sheet - Edit Modal */}
      <IconPickerBottomSheet
        visible={isEditIconPickerOpen}
        onClose={() => setIsEditIconPickerOpen(false)}
        onSelect={setEditIcon}
        selectedIcon={editIcon}
        type={editType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
    padding: 16,
    paddingTop: 16
  },
  formCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 14,
    shadowColor: COLORS.TEXT,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  formTitle: { color: COLORS.TEXT, fontWeight: "800", fontSize: 22, marginBottom: 4 },
  formSubtitle: { color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  inputLabel: { color: COLORS.TEXT, fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    color: COLORS.TEXT
  },
  typeRow: {
    flexDirection: "row",
    backgroundColor: "#F5F5F7",
    borderWidth: 1.5,
    borderColor: "#EA5A7A",
    borderRadius: 16,
    padding: 4,
    marginBottom: 8,
    position: "relative"
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    zIndex: 2
  },
  typeActiveIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    backgroundColor: "#EA5A7A",
    shadowColor: "#EA5A7A",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    zIndex: 1
  },
  typeText: { color: "#667085", fontWeight: "700" },
  typeTextActive: { color: COLORS.WHITE },
  hintText: { color: COLORS.TEXT_SECONDARY, marginBottom: 12, fontSize: 12 },
  iconPickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY_LIGHT + "50",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14
  },
  iconPickerPreview: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.ROSE_MIST,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  iconPickerLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.TEXT
  },
  iconPickerChevron: {
    fontSize: 22,
    fontWeight: "300",
    color: COLORS.TEXT_MUTED,
    marginLeft: 8
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.WHITE, fontWeight: "800", fontSize: 16 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  listTitle: { color: COLORS.TEXT, fontWeight: "800", fontSize: 16 },
  listContent: { paddingBottom: 24 },
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
  itemIconText: { fontSize: 18 },
  itemName: { color: COLORS.TEXT, fontWeight: "700", fontSize: 15, flexShrink: 1 },
  itemRight: { alignItems: "flex-end" },
  typeChip: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  typeChipText: { fontWeight: "800", fontSize: 12 },
  menuDots: {
    marginTop: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menuDotsText: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 1,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
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
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  menuItemIcon: {
    fontSize: 16,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.TEXT,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.CARD_BORDER,
    marginHorizontal: 18,
  },
  emptyState: { alignItems: "center", marginTop: 44, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.TEXT, marginBottom: 6 },
  emptyText: { textAlign: "center", color: COLORS.TEXT_SECONDARY, lineHeight: 19 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    padding: 16
  },
  modalCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    padding: 14,
    maxHeight: "80%"
  },
  modalTitle: { color: COLORS.TEXT, fontWeight: "800", fontSize: 18 },
  modalSubTitle: { color: COLORS.TEXT_SECONDARY, marginTop: 2, marginBottom: 10 },
  modalActions: { marginTop: 8, flexDirection: "row", justifyContent: "flex-end" },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8
  },
  modalCancelText: { color: COLORS.TEXT, fontWeight: "700" },
  modalSaveBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  modalSaveText: { color: COLORS.WHITE, fontWeight: "700" }
});
