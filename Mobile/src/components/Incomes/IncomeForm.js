import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import CategoryGridSelector from "../common/CategoryGridSelector";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatCurrencyInput, formatMoney } from "../../utils/format";
import { PickDateField } from "../../utils/datePicker";

export default function IncomeForm({ form, insetsStyle }) {
  const colors = useAppColors();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.BG }]} contentContainerStyle={[styles.content, insetsStyle]}>
      <Text style={[styles.label, { color: colors.TEXT }]}>Tên khoản thu</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER, color: colors.TEXT }]} value={form.name} onChangeText={form.setName} placeholder="Ví dụ: Lương tháng" placeholderTextColor={colors.TEXT_MUTED} />

      <Text style={[styles.label, { color: colors.TEXT }]}>Số tiền</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER, color: colors.TEXT }]}
        value={form.amount}
        onChangeText={form.setAmount}
        keyboardType="numeric"
        placeholder="Ví dụ: 15.000.000"
        placeholderTextColor={colors.TEXT_MUTED}
      />

      {form.jars.length > 0 && form.incomeAmount > 0 && (
        <View style={[styles.allocSection, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
          <Pressable style={[styles.allocHeader, { backgroundColor: colors.ROSE_MIST }]} onPress={() => form.setShowAllocations(!form.showAllocations)}>
            <Text style={[styles.allocHeaderTitle, { color: colors.PRIMARY }]}> 
              💰 Phân bổ vào {form.jars.length} hũ ({formatMoney(form.totalAllocated)} / {formatMoney(form.incomeAmount)})
            </Text>
            <Text style={[styles.allocHeaderArrow, { color: colors.PRIMARY }]}>{form.showAllocations ? "▲" : "▼"}</Text>
          </Pressable>

          {form.showAllocations && (
            <View style={styles.allocList}>
              {form.allocations.map((allocation, index) => (
                <View key={allocation.jarId} style={[styles.allocRow, { borderBottomColor: colors.BG }]}> 
                  <View style={styles.allocRowLeft}>
                    <View style={[styles.allocJarIconBox, { backgroundColor: (allocation.jarColor || COLORS.PRIMARY) + "18" }]}>
                      <Text style={styles.allocJarIcon}>{allocation.jarIcon || "🏺"}</Text>
                    </View>
                    <View style={styles.allocJarInfo}>
                      <Text style={[styles.allocJarName, { color: colors.TEXT }]} numberOfLines={1}>
                        {allocation.jarName}
                      </Text>
                      <Text style={[styles.allocJarPct, { color: colors.TEXT_MUTED }]}>Mục tiêu: {allocation.percentage}%</Text>
                    </View>
                  </View>
                  <TextInput
                    style={[styles.allocInput, { borderBottomColor: colors.CARD_BORDER, color: colors.PRIMARY }]}
                    value={formatCurrencyInput(String(allocation.amount))}
                    onChangeText={(value) => form.handleAllocationAmountChange(index, value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.TEXT_MUTED}
                  />
                </View>
              ))}

              {form.allocationDiff !== 0 && (
                <Text style={[styles.allocWarning, form.allocationDiff > 0 ? styles.allocWarningUnder : styles.allocWarningOver]}>
                  {form.allocationDiff > 0
                    ? `⚠️ Còn ${formatMoney(form.allocationDiff)} chưa được phân bổ`
                    : `⚠️ Vượt ${formatMoney(Math.abs(form.allocationDiff))} so với số tiền nhập`}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      <PickDateField label="Ngày" value={form.date} onChange={form.setDate} />

      <Text style={[styles.label, { color: colors.TEXT }]}>Danh mục</Text>
      <CategoryGridSelector
        categories={form.categories}
        selectedId={form.categoryId}
        onSelect={form.setCategoryId}
        loading={form.categoryLoading}
        emptyText="Chưa có danh mục thu nhập. Hãy tạo danh mục ở tab Danh mục."
      />

      <Pressable style={[styles.saveButton, form.submitting && styles.saveButtonDisabled]} onPress={form.onSave} disabled={form.submitting}>
        <Text style={styles.saveButtonText}>{form.submitting ? "Đang lưu..." : "Lưu thu nhập"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  content: {
    padding: 16
  },
  label: {
    color: COLORS.TEXT,
    marginBottom: 6,
    fontWeight: "600"
  },
  input: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
    color: COLORS.TEXT
  },
  allocSection: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    marginBottom: 12,
    overflow: "hidden"
  },
  allocHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.ROSE_MIST,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  allocHeaderTitle: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 13,
    fontWeight: "700",
    flex: 1
  },
  allocHeaderArrow: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8
  },
  allocList: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  allocRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG,
    paddingVertical: 10,
    paddingHorizontal: 8
  },
  allocRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10
  },
  allocJarIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  allocJarIcon: {
    fontSize: 18
  },
  allocJarInfo: {
    flex: 1
  },
  allocJarName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT
  },
  allocJarPct: {
    fontSize: 10,
    color: COLORS.TEXT_MUTED,
    marginTop: 2
  },
  allocInput: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    textAlign: "right",
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.PRIMARY
  },
  allocWarning: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 8,
    marginTop: 4
  },
  allocWarningUnder: {
    color: COLORS.WARNING
  },
  allocWarningOver: {
    color: COLORS.EXPENSE
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 16
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700"
  }
});
