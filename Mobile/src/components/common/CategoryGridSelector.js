import React, { useState, useMemo } from "react";
import { Pressable, StyleSheet, Text, View, Modal, ScrollView, TextInput } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { CategoryVectorIcon, getIconColor } from "../../utils/categoryIcons";

export default function CategoryGridSelector({
  categories = [],
  selectedId,
  onSelect,
  onCreateNew,
  recentIds = [],
  label = "Danh mục",
  placeholder = "Chọn danh mục",
  hintText,
  highlighted = false,
  loading = false,
  emptyText = "Chưa có danh mục. Hãy tạo danh mục ở tab Danh mục.",
}) {
  const colors = useAppColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const selectedCategory = useMemo(() => {
    if (!selectedId) return null;
    return categories.find((c) => String(c.id) === String(selectedId));
  }, [categories, selectedId]);

  const filteredCategories = useMemo(() => {
    if (!searchText.trim()) return categories;
    const q = searchText.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchText]);

  const recentCategories = useMemo(() => {
    if (searchText) return [];
    return recentIds
      .map((id) => categories.find((c) => String(c.id) === String(id)))
      .filter(Boolean)
      .slice(0, 5);
  }, [categories, recentIds, searchText]);

  const handleSelect = (id) => {
    onSelect(String(id));
    setModalVisible(false);
    setSearchText("");
  };

  const handleClose = () => {
    setModalVisible(false);
    setSearchText("");
  };

  if (loading) {
    return (
      <View style={[styles.row, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }, highlighted && styles.rowHighlighted, highlighted && { backgroundColor: colors.CARD, borderColor: colors.PRIMARY, shadowColor: colors.PRIMARY }]}> 
        <Text style={[styles.rowLabel, { color: highlighted ? colors.PRIMARY : colors.TEXT }, highlighted && styles.rowLabelHighlighted]}>{label}</Text>
        <View style={styles.rowRight}>
          <Text style={[styles.rowPlaceholder, { color: colors.TEXT_SECONDARY }]}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Pressable style={[styles.row, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }, highlighted && styles.rowHighlighted, highlighted && { backgroundColor: colors.CARD, borderColor: colors.PRIMARY, shadowColor: colors.PRIMARY }]} onPress={() => setModalVisible(true)}>
        <View style={styles.rowTextBlock}>
          <Text style={[styles.rowLabel, { color: highlighted ? colors.PRIMARY : colors.TEXT }, highlighted && styles.rowLabelHighlighted]}>{label}</Text>
          {highlighted && hintText ? <Text style={[styles.rowHint, { color: colors.TEXT_SECONDARY }]}>{hintText}</Text> : null}
        </View>
        <View style={styles.rowRight}>
          {selectedCategory ? (
            <View style={styles.selectedWrap}>
              <View
                style={[
                  styles.selectedIcon,
                  {
                    backgroundColor:
                      (selectedCategory.color ||
                        getIconColor(selectedCategory.icon) ||
                        COLORS.PRIMARY) + "18",
                  },
                ]}
              >
                <CategoryVectorIcon
                  iconValue={selectedCategory.icon}
                  size={16}
                  color={
                    selectedCategory.color ||
                    getIconColor(selectedCategory.icon) ||
                    COLORS.PRIMARY
                  }
                />
              </View>
              <Text style={[styles.rowValue, { color: colors.PRIMARY }]}>{selectedCategory.name}</Text>
            </View>
          ) : (
            <Text style={[styles.rowPlaceholder, { color: colors.TEXT_SECONDARY }]}>{placeholder}</Text>
          )}
          {highlighted && <Text style={[styles.rowChevron, { color: colors.PRIMARY }]}>›</Text>}
        </View>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={[styles.modal, { backgroundColor: colors.CARD }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.TEXT }]}>Chọn danh mục</Text>
              
            </View>

            <View style={[styles.searchWrap, { backgroundColor: colors.BG }]}> 
              <TextInput
                style={[styles.searchInput, { color: colors.TEXT }]}
                placeholder="Tìm kiếm danh mục"
                placeholderTextColor={colors.TEXT_SECONDARY}
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <Pressable onPress={() => setSearchText("")} hitSlop={8}>
                  <Text style={[styles.searchClear, { color: colors.TEXT_SECONDARY }]}>✕</Text>
                </Pressable>
              )}
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {recentCategories.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.TEXT_SECONDARY }]}>Gần đây</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recentList}
                  >
                    {recentCategories.map((cat) => {
                      const isActive = String(cat.id) === String(selectedId);
                      const chipColor =
                        cat.color || getIconColor(cat.icon) || COLORS.PRIMARY;
                      return (
                        <Pressable
                          key={String(cat.id)}
                          style={[
                            styles.recentChip,
                            isActive && {
                              backgroundColor: colors.PRIMARY,
                              borderColor: colors.PRIMARY,
                            },
                          ]}
                          onPress={() => handleSelect(cat.id)}
                        >
                          <CategoryVectorIcon
                            iconValue={cat.icon}
                            size={14}
                            color={isActive ? colors.WHITE : chipColor}
                          />
                          <Text
                            style={[
                              styles.recentChipText,
                               { color: isActive ? colors.WHITE : colors.TEXT },
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={styles.section}>
                {!searchText && (
                  <Text style={[styles.sectionTitle, { color: colors.TEXT_SECONDARY }]}>Tất cả danh mục</Text>
                )}
                {filteredCategories.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>{emptyText}</Text>
                ) : (
                  filteredCategories.map((cat) => {
                    const isActive = String(cat.id) === String(selectedId);
                    const iconColor =
                      cat.color || getIconColor(cat.icon) || COLORS.PRIMARY;
                    return (
                      <Pressable
                        key={String(cat.id)}
                        style={[
                          styles.catItem,
                          { borderBottomColor: colors.CARD_BORDER },
                          isActive && [styles.catItemActive, { backgroundColor: colors.ROSE_MIST + "40" }],
                        ]}
                        onPress={() => handleSelect(cat.id)}
                      >
                        <View
                          style={[
                            styles.catIcon,
                            { backgroundColor: iconColor + "18" },
                          ]}
                        >
                          <CategoryVectorIcon
                            iconValue={cat.icon}
                            size={18}
                            color={iconColor}
                          />
                        </View>
                        <Text
                          style={[
                            styles.catName,
                            { color: isActive ? colors.PRIMARY : colors.TEXT },
                            isActive && styles.catNameActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                        <View
                          style={[
                            styles.radio,
                            { borderColor: isActive ? colors.PRIMARY : colors.CARD_BORDER },
                            isActive && styles.radioActive,
                          ]}
                        >
                          {isActive && <View style={[styles.radioDot, { backgroundColor: colors.PRIMARY }]} />}
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </ScrollView>

            {onCreateNew && (
              <Pressable
                style={styles.createBtn}
                onPress={() => {
                  setModalVisible(false);
                  setSearchText("");
                  onCreateNew();
                }}
              >
                <Text style={[styles.createBtnPlus, { color: colors.PRIMARY }]}>+</Text>
                <Text style={[styles.createBtnText, { color: colors.PRIMARY }]}>Tạo danh mục mới</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    marginBottom: 16,
  },
  rowHighlighted: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 1.5,
    backgroundColor: COLORS.WHITE,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  rowTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.TEXT,
  },
  rowLabelHighlighted: {
    color: COLORS.PRIMARY,
    fontWeight: "800",
  },
  rowHint: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  rowPlaceholder: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
  },
  rowChevron: {
    marginLeft: 8,
    fontSize: 22,
    lineHeight: 22,
    color: COLORS.PRIMARY,
    fontWeight: "800",
  },


  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxHeight: "75%",
    backgroundColor: COLORS.CARD,
    borderRadius: 24,
    overflow: "hidden",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT,
  },
  modalClose: {
    fontSize: 20,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "400",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT,
    paddingVertical: 0,
  },
  searchClear: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    paddingLeft: 8,
  },

  modalBody: {
    paddingHorizontal: 20,
  },

  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  recentList: {
    paddingBottom: 4,
    gap: 8,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  recentChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT,
  },

  catItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.CARD_BORDER,
  },
  catItemActive: {
    backgroundColor: COLORS.ROSE_MIST + "40",
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  catIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  catName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.TEXT,
  },
  catNameActive: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: COLORS.PRIMARY,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.PRIMARY,
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    paddingVertical: 20,
  },

  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.CARD_BORDER,
  },
  createBtnPlus: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
});
