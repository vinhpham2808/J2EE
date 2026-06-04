import React, { useCallback } from "react";
import { FlatList, Modal, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CategoryForm from "../../components/Categories/CategoryForm";
import CategoryItem from "../../components/Categories/CategoryItem";
import CategoryListHeader from "../../components/Categories/CategoryListHeader";
import IconPickerBottomSheet from "../../components/Categories/IconPickerBottomSheet";
import { COLORS, useAppColors } from "../../constants/colors";
import useCategories from "../../hooks/useCategories";
import { getSafeAreaBottom, getSafeAreaTop } from "../../utils/safeArea";

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const {
    categories,
    canExpandCategories,
    createForm,
    editForm,
    onCloseEditCategory,
    onDeleteCategory,
    onOpenEditCategory,
    onRefresh,
    onSave,
    onUpdateCategory,
    refreshing,
    showAllCategories,
    toggleCategories,
    visibleCategories
  } = useCategories();

  const renderCategory = useCallback(
    ({ item }) => (
      <CategoryItem
        item={item}
        onEditCategory={onOpenEditCategory}
        onDeleteCategory={onDeleteCategory}
      />
    ),
    [onDeleteCategory, onOpenEditCategory]
  );

  const renderListHeader = useCallback(
    () => (
      <CategoryListHeader
        canExpand={canExpandCategories}
        hasCategories={Boolean(categories.length)}
        onToggle={toggleCategories}
        showAll={showAllCategories}
      />
    ),
    [canExpandCategories, categories.length, showAllCategories, toggleCategories]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.BG, paddingTop: getSafeAreaTop(insets) }]}> 
      <CategoryForm
        form={createForm}
        onSave={onSave}
        saveLabel="Thêm danh mục"
        subtitle="Tạo nhóm giao dịch rõ ràng để theo dõi chi tiêu tốt hơn."
        title="Thêm danh mục"
      />

      <FlatList
        data={visibleCategories}
        keyExtractor={(item) => String(item?.id)}
        renderItem={renderCategory}
        contentContainerStyle={[styles.listContent, { paddingBottom: getSafeAreaBottom(insets) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={<CategoryEmptyState colors={colors} />}
      />

      <Modal visible={Boolean(editForm.category)} transparent animationType="slide" onRequestClose={onCloseEditCategory}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.CARD }]}> 
            <CategoryForm
              form={editForm}
              onCancel={onCloseEditCategory}
              onSave={onUpdateCategory}
              saveLabel="Lưu thay đổi"
              subtitle="Cập nhật tên, loại và icon"
              title="Chỉnh sửa danh mục"
              variant="modal"
            />
          </View>
        </View>
      </Modal>

      <IconPickerBottomSheet
        visible={createForm.isIconPickerOpen}
        onClose={() => createForm.setIsIconPickerOpen(false)}
        onSelect={createForm.setIcon}
        selectedIcon={createForm.icon}
        type={createForm.type}
      />

      <IconPickerBottomSheet
        visible={editForm.isIconPickerOpen}
        onClose={() => editForm.setIsIconPickerOpen(false)}
        onSelect={editForm.setIcon}
        selectedIcon={editForm.icon}
        type={editForm.type}
      />
    </View>
  );
}

function CategoryEmptyState({ colors }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🗂️</Text>
      <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>Chưa có danh mục nào</Text>
      <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>Tạo danh mục đầu tiên để bắt đầu quản lý giao dịch gọn gàng hơn.</Text>
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
  listContent: {
    paddingBottom: 24
  },
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
  emptyState: {
    alignItems: "center",
    marginTop: 44,
    paddingHorizontal: 24
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 6
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 19
  }
});
