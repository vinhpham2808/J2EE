import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function PasswordInput({
  value,
  onChangeText,
  onFocus,
  onBlur,
  focused,
  placeholder,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Mật khẩu mới</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry
          placeholder={placeholder || "Nhập mật khẩu"}
          placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText("")} style={styles.clearButton}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.DARK_INPUT_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapFocused: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    color: COLORS.DARK_TEXT,
    fontSize: 16,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.DARK_TEXT_SECONDARY,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  clearIcon: {
    color: COLORS.DARK_BG,
    fontSize: 12,
    fontWeight: "700",
  },
});
