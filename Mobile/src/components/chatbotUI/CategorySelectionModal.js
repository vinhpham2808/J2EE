import React from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function CategorySelectionModal({ categories, onClose, onSelect, visible }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Danh mục</Text>
            <Pressable style={styles.modalCloseBtn} onPress={onClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => (
              <Pressable style={styles.categoryItem} onPress={() => onSelect(item.name)}>
                <Text style={styles.categoryIcon}>{item.icon || "📁"}</Text>
                <Text style={styles.categoryName}>{item.name}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.emptyCategories}>Không có danh mục nào.</Text>}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "60%",
    paddingBottom: 24
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT
  },
  modalCloseBtn: {
    padding: 4
  },
  modalCloseText: {
    fontSize: 16,
    color: COLORS.TEXT_MUTED,
    fontWeight: "700"
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    gap: 12
  },
  categoryIcon: {
    fontSize: 20
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.TEXT
  },
  emptyCategories: {
    textAlign: "center",
    color: COLORS.TEXT_MUTED,
    marginVertical: 24,
    fontSize: 14
  }
});
