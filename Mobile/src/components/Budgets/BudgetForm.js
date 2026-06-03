import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { CategoryVectorIcon, getIconColor } from "../../utils/VectorIcons";

function BudgetCategoryChip({ category, active, onPress }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <CategoryVectorIcon iconValue={category?.icon} size={16} color={getIconColor(category?.icon)} />
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {category?.name || "Danh mục"}
      </Text>
    </Pressable>
  );
}

export default function BudgetForm({ budget }) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Thiết lập hạn mức</Text>
      <Text style={styles.formSubTitle}>Chọn danh mục chi tiêu và nhập giới hạn theo tháng.</Text>
      <Text style={styles.label}>Danh mục chi</Text>
      <View style={styles.chipRow}>
        {budget.categories.map((category) => (
          <BudgetCategoryChip
            key={String(category.id)}
            category={category}
            active={String(category.id) === String(budget.categoryId)}
            onPress={() => budget.setCategoryId(String(category.id))}
          />
        ))}
      </View>
      <Text style={styles.label}>Hạn mức (VND)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={budget.amountLimit}
        onChangeText={budget.setAmountLimit}
        placeholder="Ví dụ: 3.000.000"
        placeholderTextColor="#98a2b3"
      />
      <View style={styles.dateRow}>
        <View style={[styles.dateCol, styles.dateColLeft]}>
          <Text style={styles.label}>Tháng</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={budget.month} onChangeText={budget.setMonth} placeholder="1-12" placeholderTextColor="#98a2b3" />
        </View>
        <View style={styles.dateCol}>
          <Text style={styles.label}>Năm</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={budget.year} onChangeText={budget.setYear} placeholder="2026" placeholderTextColor="#98a2b3" />
        </View>
      </View>
      <Pressable style={[styles.saveButton, budget.submitting && styles.saveButtonDisabled]} onPress={budget.onSave} disabled={budget.submitting}>
        <Text style={styles.saveButtonText}>{budget.submitting ? "Đang lưu..." : "Lưu hạn mức"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: { backgroundColor: COLORS.CARD, borderRadius: 16, borderWidth: 1, borderColor: COLORS.CARD_BORDER, padding: 12, marginBottom: 12 },
  formTitle: { color: COLORS.TEXT, fontWeight: "800", fontSize: 18, marginBottom: 4 },
  formSubTitle: { color: COLORS.TEXT_SECONDARY, marginBottom: 10, fontSize: 12 },
  label: { color: COLORS.TEXT, marginBottom: 6, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: COLORS.CARD_BORDER, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: COLORS.CARD, marginRight: 8, marginBottom: 8, flexDirection: "row", alignItems: "center", maxWidth: "48%" },
  chipActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.ROSE_MIST },
  chipText: { color: COLORS.TEXT, fontSize: 12, fontWeight: "600", flexShrink: 1 },
  chipTextActive: { color: COLORS.PRIMARY, fontWeight: "800" },
  input: { backgroundColor: COLORS.BG, borderRadius: 12, borderWidth: 1, borderColor: COLORS.CARD_BORDER, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 10, color: COLORS.TEXT },
  dateRow: { flexDirection: "row" },
  dateCol: { flex: 1 },
  dateColLeft: { marginRight: 8 },
  saveButton: { backgroundColor: COLORS.PRIMARY, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.WHITE, fontWeight: "800" }
});
