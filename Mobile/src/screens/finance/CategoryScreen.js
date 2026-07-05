import React, { useCallback } from "react";
import { FlatList, Modal, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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

  return (
    <View style={[styles.container, { backgroundColor: colors.BG, paddingTop: getSafeAreaTop(insets) }]}> 
      <FlatList
        data={visibleCategories}
        keyExtractor={(item) => String(item?.id)}
        renderItem={renderCategory}
        contentContainerStyle={[styles.listContent, { paddingBottom: getSafeAreaBottom(insets) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <CategoryForm
              form={createForm}
              onSave={onSave}
              saveLabel={t("finance.category.addSave")}
              subtitle={t("finance.category.addSubtitle")}
              title={t("finance.category.addTitle")}
            />
            <CategoryListHeader
              canExpand={canExpandCategories}
              hasCategories={Boolean(categories.length)}
              onToggle={toggleCategories}
              showAll={showAllCategories}
            />
          </View>
        }
        ListEmptyComponent={<CategoryEmptyState colors={colors} />}
      />

      <Modal visible={Boolean(editForm.category)} transparent animationType="slide" onRequestClose={onCloseEditCategory}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.CARD }]}> 
            <CategoryForm
              form={editForm}
              onCancel={onCloseEditCategory}
              onSave={onUpdateCategory}
              saveLabel={t("finance.category.editSave")}
              subtitle={t("finance.category.editSubtitle")}
              title={t("finance.category.editTitle")}
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
  const { t } = useTranslation();

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🗂️</Text>
      <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>{t("finance.category.emptyTitle")}</Text>
      <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>{t("finance.category.emptyDescription")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
    paddingHorizontal: 10,
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
