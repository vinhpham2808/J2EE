import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import apiClient from "../../services/apiClient";
import { API_ENDPOINTS } from "../../constants/api";
import { getApiErrorMessage } from "../../utils/format";
import { COLORS, useAppColors } from "../../constants/colors";
import {
  validatePasswordRequirements,
  isPasswordValid,
} from "../../utils/authPassword";
import PasswordInput from "../../components/auth/PasswordInput";
import PasswordRequirement from "../../components/auth/PasswordRequirement";
import { scale, clampScale } from "../../utils/layoutScale";
import AppButton from "../../components/ui/AppButton";

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useAppColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const email = route.params?.email || "";
  const otp = route.params?.otp || "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const req = useMemo(() => validatePasswordRequirements(password), [password]);
  const canProceed = isPasswordValid(req);

  const onReset = async () => {
    if (!canProceed) return;

    setLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.RESET_PASSWORD, { email, otp, newPassword: password });
      Alert.alert(
        t("auth.common.success"),
        t("auth.resetPassword.successMessage"),
        [{ text: t("auth.common.login"), onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      const message = getApiErrorMessage(error, t("auth.resetPassword.failedMessage"));
      Alert.alert(t("auth.common.error"), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.APP_BACKGROUND || "#F2F2F7" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={[styles.bgGlow, { backgroundColor: colors.PRIMARY_GLOW || "rgba(255, 178, 191, 0.25)" }]} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.TEXT }]}>{t("auth.resetPassword.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>{t("auth.resetPassword.subtitle")}</Text>

          <PasswordInput
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            focused={passwordFocused}
            placeholder={t("auth.resetPassword.placeholder")}
          />

          <AppButton
            variant="primary"
            title={loading ? t("auth.resetPassword.loading") : t("auth.resetPassword.submit")}
            onPress={onReset}
            loading={loading}
            disabled={!canProceed || loading}
            style={styles.resetButton}
          />

          <PasswordRequirement req={req} />
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: scale(28),
    paddingBottom: scale(20),
  },
  title: {
    fontSize: clampScale(26, 22, 30),
    fontWeight: "800",
    marginBottom: scale(8),
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: scale(28),
  },
  resetButton: {
    marginTop: scale(6),
  },
});
