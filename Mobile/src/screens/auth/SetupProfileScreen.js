import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { COLORS, useAppColors } from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale, clampScale } from "../../utils/layoutScale";
import AppButton from "../../components/ui/AppButton";

export default function SetupProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useAppColors();
  const { t } = useTranslation();
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
      style={[styles.screen, { backgroundColor: colors.APP_BACKGROUND || "#F2F2F7" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={[styles.bgGlow, { backgroundColor: colors.PRIMARY_GLOW || "rgba(255, 178, 191, 0.25)" }]} />

        <View style={styles.body}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.PRIMARY || "#ef5e83" }]}>{t("auth.setupProfile.fullNameRequired")}</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.SURFACE_SECONDARY || "#F2F2F7", borderColor: isFocused ? (colors.PRIMARY || "#ef5e83") : (colors.BORDER || "#E5E7EB") }]}>
              <TextInput
                style={[styles.input, { color: colors.TEXT }]}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t("auth.setupProfile.fullNamePlaceholder")}
                placeholderTextColor={colors.TEXT_MUTED || "#B8A6AC"}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {fullName.length > 0 && (
                <Pressable onPress={onClear} style={[styles.clearButton, { backgroundColor: colors.TEXT_MUTED || "#B8A6AC" }]}>
                  <Text style={[styles.clearIcon, { color: colors.BG || "#FFF5F7" }]}>✕</Text>
                </Pressable>
              )}
            </View>
          </View>

          <AppButton
            variant="primary"
            title={t("auth.common.next")}
            onPress={onNext}
            disabled={!canProceed}
            style={styles.nextButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bgGlow: {
    position: "absolute",
    top: -120,
    left: -100,
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
  },
  body: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: scale(28),
    paddingBottom: scale(60)
  },
  inputGroup: {
    marginBottom: scale(24)
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: scale(8),
    letterSpacing: 0.3
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(12),
    borderWidth: 1.5,
    paddingHorizontal: scale(14),
    height: scale(50)
  },
  input: {
    flex: 1,
    fontSize: 16
  },
  clearButton: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center"
  },
  clearIcon: {
    fontSize: 12,
    fontWeight: "700"
  },
  nextButton: {
  }
});
