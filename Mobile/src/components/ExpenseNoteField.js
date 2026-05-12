import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import VoiceInputButton from "./VoiceInputButton";
import { COLORS } from "../constants/colors";

/**
 * ExpenseNoteField — TextInput + VoiceInputButton cho ghi chú chi tiêu
 *
 * Props:
 *   value: string              — Giá trị note hiện tại
 *   onChange: (text) => void   — Callback khi note thay đổi
 *   onVoiceResult: (text) => void — Callback khi có kết quả voice
 *   placeholder: string        — Placeholder text
 *   multiline: boolean         — Cho phép nhập nhiều dòng
 */
export default function ExpenseNoteField({
  value = "",
  onChange,
  onVoiceResult,
  placeholder = "Nhập ghi chú chi tiết...",
  multiline = true
}) {
  const handleVoiceResult = (text) => {
    // Nếu có text hiện tại, thêm vào cuối
    const newText = value ? `${value}\n${text}` : text;
    onChange?.(newText);
    onVoiceResult?.(text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        <Text style={styles.labelIcon}>📝</Text> Ghi chú chi tiết
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TEXT_MUTED}
          multiline={multiline}
          textAlignVertical="top"
        />
        <View style={styles.micWrapper}>
          <VoiceInputButton onResult={handleVoiceResult} language="vi-VN" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12
  },
  label: {
    color: COLORS.TEXT,
    marginBottom: 6,
    fontWeight: "600"
  },
  labelIcon: {
    fontSize: 14
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: COLORS.TEXT
  },
  inputMultiline: {
    minHeight: 60,
    maxHeight: 120
  },
  micWrapper: {
    marginTop: 2
  }
});
