import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS } from "../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SetupProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const email = route.params?.email || "";

  const [fullName, setFullName] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const canProceed = fullName.trim().length > 0;

  const onNext = () => {
    if (!canProceed) return;
    navigation.navigate("CreatePassword", { email, fullName: fullName.trim() });
  };

  const onClear = () => setFullName("");

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.bgGlowTop} />
        <View style={styles.bgGlowBottom} />

        <View style={styles.body}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Họ và tên (bắt buộc)</Text>
            <View style={[styles.inputWrap, isFocused && styles.inputWrapFocused]}>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Ví dụ: Nguyễn Văn A"
                placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {fullName.length > 0 && (
                <Pressable onPress={onClear} style={styles.clearButton}>
                  <Text style={styles.clearIcon}>✕</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Pressable
            style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
            onPress={onNext}
            disabled={!canProceed}
          >
            <Text style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}>
              Tiếp theo
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.DARK_BG
  },
  bgGlowTop: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.PRIMARY_GLOW
  },
  bgGlowBottom: {
    position: "absolute",
    right: -140,
    bottom: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.PRIMARY_GLOW
  },
  body: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 60
  },
  inputGroup: {
    marginBottom: 24
  },
  inputLabel: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.3
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.DARK_INPUT_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    paddingHorizontal: 14,
    height: 50
  },
  inputWrapFocused: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 1.5
  },
  input: {
    flex: 1,
    color: COLORS.DARK_TEXT,
    fontSize: 16
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.DARK_TEXT_SECONDARY,
    alignItems: "center",
    justifyContent: "center"
  },
  clearIcon: {
    color: COLORS.DARK_BG,
    fontSize: 12,
    fontWeight: "700"
  },
  nextButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 24,
    height: 50,
    alignItems: "center",
    justifyContent: "center"
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.DARK_BORDER,
    opacity: 0.5
  },
  nextButtonText: {
    color: COLORS.DARK_TEXT,
    fontSize: 16,
    fontWeight: "700"
  },
  nextButtonTextDisabled: {
    color: COLORS.DARK_TEXT_SECONDARY
  }
});
