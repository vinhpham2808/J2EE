import React from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatCurrencyInput } from "../../utils/format";
import { PickDateField } from "../../utils/datePicker";

/**
 * Modal for contributing money to a goal.
 *
 * Props are state + setters/callbacks managed by the parent hook.
 */
export default function ContributionModal({
  visible,
  goal,
  amount,
  date,
  note,
  onAmountChange,
  onDateChange,
  onNoteChange,
  onClose,
  onSubmit,
}) {
  const colors = useAppColors();

  if (!goal) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.CARD }]}> 
          <Text style={[styles.title, { color: colors.TEXT }]}>Đóng góp mục tiêu</Text>
          <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>{goal.name}</Text>

          <Text style={[styles.label, { color: colors.TEXT }]}>Số tiền</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER, color: colors.TEXT }]}
            placeholder="Ví dụ: 1.000.000"
            placeholderTextColor={colors.TEXT_MUTED}
            keyboardType="numeric"
            value={amount}
            onChangeText={(value) => onAmountChange(formatCurrencyInput(value))}
          />

          <PickDateField label="Ngày đóng góp" value={date} onChange={onDateChange} />

          <Text style={[styles.label, { color: colors.TEXT }]}>Ghi chú</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER, color: colors.TEXT }]}
            placeholder="Tùy chọn"
            placeholderTextColor={colors.TEXT_MUTED}
            value={note}
            onChangeText={onNoteChange}
          />

          <View style={styles.actions}>
            <Pressable style={[styles.secondaryButton, { borderColor: colors.CARD_BORDER }]} onPress={onClose}>
              <Text style={[styles.secondaryText, { color: colors.TEXT }]}>Hủy</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, { backgroundColor: colors.PRIMARY }]} onPress={onSubmit}>
              <Text style={styles.primaryText}>Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    padding: 16,
  },
  title: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 18,
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 10,
    marginTop: 2,
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
  actions: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  secondaryText: {
    color: "#334155",
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
});
