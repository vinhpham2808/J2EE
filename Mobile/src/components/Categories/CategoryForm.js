import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { CategoryVectorIcon, getIconLabel } from "../../utils/categoryIcons";
import CategoryTypeSegmentedControl from "./CategoryTypeSegmentedControl";

export default function CategoryForm({
  cancelLabel = "Hủy",
  form,
  onCancel,
  onSave,
  saveLabel,
  savingLabel = "Đang lưu...",
  subtitle,
  title,
  variant = "card"
}) {
  const colors = useAppColors();
  const isModal = variant === "modal";
  const containerStyle = isModal ? styles.modalBody : styles.formCard;

  return (
    <View style={[containerStyle, { backgroundColor: colors.CARD }, !isModal && { borderColor: colors.CARD_BORDER, shadowColor: colors.TEXT }]}> 
      <Text style={[isModal ? styles.modalTitle : styles.formTitle, { color: colors.TEXT }]}>{title}</Text>
      {subtitle ? (
        <Text style={[isModal ? styles.modalSubTitle : styles.formSubtitle, { color: colors.TEXT_SECONDARY }]}>{subtitle}</Text>
      ) : null}

      <Text style={[styles.inputLabel, { color: colors.TEXT }]}>Tên danh mục</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER, color: colors.TEXT }]}
        value={form.name}
        onChangeText={form.setName}
        placeholder="Ví dụ: Ăn uống"
        placeholderTextColor={colors.TEXT_MUTED}
      />

      <Text style={[styles.inputLabel, { color: colors.TEXT }]}>Loại danh mục</Text>
      <CategoryTypeSegmentedControl value={form.type} onChange={form.setType} />

      {form.hint ? <Text style={[styles.hintText, { color: colors.TEXT_SECONDARY }]}>{form.hint}</Text> : null}

      <Text style={[styles.inputLabel, { color: colors.TEXT }]}>Icon</Text>
      <Pressable style={[styles.iconPickerTrigger, { backgroundColor: colors.BG, borderColor: `${colors.PRIMARY_LIGHT}50` }]} onPress={() => form.setIsIconPickerOpen(true)}>
        <View style={[styles.iconPickerPreview, { backgroundColor: colors.ROSE_MIST }]}> 
          <CategoryVectorIcon iconValue={form.icon} size={22} />
        </View>
        <Text style={[styles.iconPickerLabel, { color: colors.TEXT }]}>{getIconLabel(form.icon)}</Text>
        <Text style={[styles.iconPickerChevron, { color: colors.TEXT_MUTED }]}>›</Text>
      </Pressable>

      {isModal ? (
        <View style={styles.modalActions}>
          <Pressable style={[styles.modalCancelBtn, { borderColor: colors.CARD_BORDER }]} onPress={onCancel} disabled={form.saving}>
            <Text style={[styles.modalCancelText, { color: colors.TEXT }]}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            style={[styles.modalSaveBtn, form.saving && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={form.saving}
          >
            <Text style={styles.modalSaveText}>{form.saving ? savingLabel : saveLabel}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.saveButton, form.saving && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={form.saving}
        >
          <Text style={styles.saveButtonText}>{form.saving ? savingLabel : saveLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 14,
    shadowColor: COLORS.TEXT,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2
  },
  modalBody: {
    backgroundColor: COLORS.CARD
  },
  formTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 22,
    marginBottom: 4
  },
  formSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12
  },
  modalTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 18
  },
  modalSubTitle: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
    marginBottom: 10
  },
  inputLabel: {
    color: COLORS.TEXT,
    fontWeight: "700",
    marginBottom: 6
  },
  input: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    color: COLORS.TEXT
  },
  hintText: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
    fontSize: 12
  },
  iconPickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: `${COLORS.PRIMARY_LIGHT}50`,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14
  },
  iconPickerPreview: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.ROSE_MIST,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  iconPickerLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.TEXT
  },
  iconPickerChevron: {
    fontSize: 22,
    fontWeight: "300",
    color: COLORS.TEXT_MUTED,
    marginLeft: 8
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 16
  },
  modalActions: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8
  },
  modalCancelText: {
    color: COLORS.TEXT,
    fontWeight: "700"
  },
  modalSaveBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  modalSaveText: {
    color: COLORS.WHITE,
    fontWeight: "700"
  }
});
