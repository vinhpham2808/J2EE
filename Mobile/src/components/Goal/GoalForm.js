import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatCurrencyInput } from "../../utils/format";
import { PickDateField } from "../../utils/datePicker";

/**
 * Form card for creating a new goal.
 *
 * Props are state + setters managed by the parent hook.
 */
export default function GoalForm({
  name,
  targetAmount,
  startDate,
  targetDate,
  loading,
  onNameChange,
  onAmountChange,
  onStartDateChange,
  onTargetDateChange,
  onSubmit,
}) {
  const colors = useAppColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
      <Text style={[styles.title, { color: colors.TEXT }]}>Tạo mục tiêu mới</Text>
      <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>Nhập mục tiêu và thời gian để theo dõi tiến độ tự động.</Text>

      <Text style={[styles.label, { color: colors.TEXT }]}>Tên mục tiêu</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER, color: colors.TEXT }]}
        placeholder="Ví dụ: Quỹ du lịch"
        placeholderTextColor={colors.TEXT_MUTED}
        value={name}
        onChangeText={onNameChange}
      />

      <Text style={[styles.label, { color: colors.TEXT }]}>Số tiền mục tiêu</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER, color: colors.TEXT }]}
        placeholder="Ví dụ: 30.000.000"
        placeholderTextColor={colors.TEXT_MUTED}
        keyboardType="numeric"
        value={targetAmount}
        onChangeText={(value) => onAmountChange(formatCurrencyInput(value))}
      />

      <View style={styles.dateRow}>
        <View style={[styles.dateCol, styles.dateColLeft]}>
          <PickDateField
            label="Ngày bắt đầu"
            value={startDate}
            onChange={onStartDateChange}
            maximumDate={targetDate}
          />
        </View>
        <View style={styles.dateCol}>
          <PickDateField
            label="Ngày đích"
            value={targetDate}
            onChange={onTargetDateChange}
            minimumDate={startDate}
          />
        </View>
      </View>

      <Pressable
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>{loading ? "Đang lưu..." : "Tạo mục tiêu"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 12,
  },
  title: {
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 4,
    fontSize: 18,
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 10,
    fontSize: 12,
  },
  label: {
    color: COLORS.TEXT,
    marginBottom: 6,
    fontWeight: "700",
  },
  input: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
    color: COLORS.TEXT,
  },
  dateRow: {
    flexDirection: "row",
  },
  dateCol: {
    flex: 1,
  },
  dateColLeft: {
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800",
  },
});
