import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../constants/colors";

export default function PasswordInput({
  value,
  onChangeText,
  onFocus,
  onBlur,
  focused,
  placeholder,
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{t("auth.password.newPassword")}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry
          placeholder={placeholder || t("auth.common.enterPassword")}
          placeholderTextColor="#9CA3AF"
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
    color: '#EF4444', // Red label
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#FFFFFF', // Light background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light border
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapFocused: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    color: '#1F2937', // Dark text color for readability on light bg
    fontSize: 16,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB', // Light gray background
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  clearIcon: {
    color: '#4B5563', // Dark icon color
    fontSize: 12,
    fontWeight: "700",
  },
});
