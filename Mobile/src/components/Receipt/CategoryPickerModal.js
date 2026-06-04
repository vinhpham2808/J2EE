import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { CategoryVectorIcon, getIconColor } from "../../utils/categoryIcons";

export default function CategoryPickerModal({
  categories,
  loading,
  onClose,
  onSelect,
  selectedId,
  visible
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Chọn danh mục</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.pickerClose}>Đóng</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.pickerList}>
            {loading ? <Text style={styles.emptyPickerText}>Đang tải danh mục...</Text> : null}
            {!loading && !categories.length ? (
              <Text style={styles.emptyPickerText}>Chưa có danh mục chi tiêu.</Text>
            ) : null}
            {categories.map((category) => {
              const isSelected = String(category.id) === String(selectedId);
              const iconColor = getIconColor(category.icon);
              return (
                <Pressable
                  key={String(category.id)}
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                  onPress={() => {
                    onSelect(String(category.id));
                    onClose();
                  }}
                >
                  <View style={[styles.pickerIconBubble, { backgroundColor: `${iconColor}18` }]}>
                    <CategoryVectorIcon iconValue={category.icon} size={18} color={iconColor} />
                  </View>
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                    {category.name}
                  </Text>
                  {isSelected ? <Text style={styles.pickerCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: "flex-end"
  },
  pickerSheet: {
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "65%",
    paddingBottom: 24
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT
  },
  pickerClose: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.PRIMARY
  },
  pickerList: {
    padding: 8
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 10
  },
  pickerItemActive: {
    backgroundColor: COLORS.ROSE_MIST
  },
  pickerIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center"
  },
  pickerItemText: {
    fontSize: 14,
    color: COLORS.TEXT,
    flex: 1
  },
  pickerItemTextActive: {
    fontWeight: "700",
    color: COLORS.PRIMARY
  },
  pickerCheck: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: "700"
  },
  emptyPickerText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    padding: 14,
    textAlign: "center"
  }
});
