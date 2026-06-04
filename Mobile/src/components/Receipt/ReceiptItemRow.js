import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { formatCurrencyInput, parseCurrencyInput, todayIso } from "../../utils/format";
import { PickDateField } from "../../utils/datePicker";
import { CategoryVectorIcon, getIconColor } from "../../utils/categoryIcons";
import CategoryPickerModal from "./CategoryPickerModal";

export default function ReceiptItemRow({
  categories,
  categoriesLoading,
  index,
  item,
  onDelete,
  onUpdate
}) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedCategory = categories.find((category) => String(category.id) === String(item.categoryId));
  const iconColor = getIconColor(item.icon || selectedCategory?.icon);

  const handleCategorySelect = (categoryId) => {
    const category = categories.find((cat) => String(cat.id) === String(categoryId));
    onUpdate(index, {
      ...item,
      categoryId: categoryId ? Number(categoryId) : null,
      icon: category?.icon || item.icon
    });
  };

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemIndexBadge}>
          <Text style={styles.itemIndexText}>#{index + 1}</Text>
        </View>

        <Pressable onPress={() => onDelete(index)} style={styles.itemDeleteBtn}>
          <Text style={styles.itemDeleteText}>✕ Xóa</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Tên khoản chi</Text>
      <TextInput
        style={styles.textInput}
        value={item.name || ""}
        onChangeText={(text) => onUpdate(index, { ...item, name: text })}
        placeholder="VD: Cơm trưa, Xăng xe..."
        placeholderTextColor={COLORS.TEXT_MUTED}
      />

      <Text style={styles.fieldLabel}>Số tiền (VNĐ)</Text>
      <TextInput
        style={styles.textInput}
        value={item.amount ? formatCurrencyInput(String(item.amount)) : ""}
        onChangeText={(text) => onUpdate(index, { ...item, amount: parseCurrencyInput(text) })}
        placeholder="0"
        placeholderTextColor={COLORS.TEXT_MUTED}
        keyboardType="numeric"
      />

      <View style={styles.fieldRow}>
        <View style={styles.fieldHalf}>
          <Text style={styles.fieldLabel}>Danh mục</Text>
          <Pressable style={styles.categoryBtn} onPress={() => setPickerVisible(true)}>
            {selectedCategory ? (
              <View style={styles.categoryBtnContent}>
                <View style={[styles.catIconSm, { backgroundColor: `${iconColor}18` }]}>
                  <CategoryVectorIcon iconValue={selectedCategory.icon} size={14} color={iconColor} />
                </View>
                <Text style={styles.categoryBtnText} numberOfLines={1}>
                  {selectedCategory.name}
                </Text>
              </View>
            ) : (
              <Text style={styles.categoryBtnPlaceholder}>Chọn...</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.fieldHalf}>
          <PickDateField
            label="Ngày"
            value={item.date || todayIso()}
            onChange={(newDate) => onUpdate(index, { ...item, date: newDate })}
          />
        </View>
      </View>

      {item.categoryHint && !item.categoryId ? (
        <Text style={styles.hintText}>💡 Gợi ý: {item.categoryHint}</Text>
      ) : null}

      <CategoryPickerModal
        visible={pickerVisible}
        categories={categories}
        loading={categoriesLoading}
        selectedId={item.categoryId}
        onSelect={handleCategorySelect}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  itemIndexBadge: {
    backgroundColor: `${COLORS.PRIMARY}18`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  itemIndexText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.PRIMARY
  },
  itemDeleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.EXPENSE_LIGHT
  },
  itemDeleteText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.EXPENSE
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
    marginTop: 8
  },
  textInput: {
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.TEXT
  },
  fieldRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4
  },
  fieldHalf: {
    flex: 1
  },
  categoryBtn: {
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    minHeight: 42
  },
  categoryBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  catIconSm: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  categoryBtnText: {
    fontSize: 13,
    color: COLORS.TEXT,
    flex: 1
  },
  categoryBtnPlaceholder: {
    fontSize: 13,
    color: COLORS.TEXT_MUTED
  },
  hintText: {
    fontSize: 12,
    color: COLORS.WARNING,
    marginTop: 6,
    fontStyle: "italic"
  }
});
