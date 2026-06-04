import React from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { COLORS } from "../../constants/colors";

export default function PasswordChangeFields({
  confirmPassword,
  currentPassword,
  newPassword,
  setConfirmPassword,
  setCurrentPassword,
  setNewPassword,
  setShowPasswordFields,
  showPasswordFields
}) {
  if (!showPasswordFields) {
    return (
      <Pressable style={styles.secondaryButton} onPress={() => setShowPasswordFields(true)}>
        <Text style={styles.secondaryButtonText}>Đổi mật khẩu</Text>
      </Pressable>
    );
  }

  return (
    <>
      <Text style={styles.label}>Mật khẩu hiện tại</Text>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholder="Nhập mật khẩu hiện tại"
        placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
      />

      <Text style={styles.label}>Mật khẩu mới</Text>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="Ít nhất 6 ký tự"
        placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
      />

      <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="Nhập lại mật khẩu mới"
        placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    color: COLORS.TEXT,
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 14
  },
  input: {
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    color: COLORS.TEXT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 14
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 94, 131, 0.25)",
    backgroundColor: "rgba(239, 94, 131, 0.04)",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
    fontSize: 14
  }
});
