import React from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { COLORS } from "../../constants/colors";

export default function ProfileInfoFields({ email, fullName, setEmail, setFullName }) {
  return (
    <>
      <Text style={styles.label}>Họ và tên</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Nguyễn Văn A"
        placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="tenban@example.com"
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
  }
});
