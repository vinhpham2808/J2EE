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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import apiClient from "../../services/apiClient";
import { API_ENDPOINTS } from "../../constants/api";
import { getApiErrorMessage } from "../../utils/format";
import { COLORS, useAppColors } from "../../constants/colors";
import {
  validatePasswordRequirements,
  isPasswordValid,
} from "../../utils/authPassword";
import {
  getActivationEmail,
  isActivationRequiredError,
  openActivationOtp
} from "../../utils/authActivation";
import PasswordInput from "../../components/auth/PasswordInput";
import PasswordRequirement from "../../components/auth/PasswordRequirement";
import { scale, clampScale } from "../../utils/layoutScale";
import AppButton from "../../components/ui/AppButton";

export default function CreatePasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const { t } = useTranslation();
  const email = route.params?.email || "";
  const fullName = route.params?.fullName || "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const req = useMemo(() => validatePasswordRequirements(password), [password]);
  const canProceed = isPasswordValid(req);

  const containsNameOrEmail = useMemo(() => {
    const lower = password.toLowerCase();
    const nameParts = fullName.toLowerCase().split(/\s+/);
    const emailLocal = email.split("@")[0]?.toLowerCase() || "";
    return (
      nameParts.some((p) => p.length > 1 && lower.includes(p)) ||
      (emailLocal.length > 1 && lower.includes(emailLocal))
    );
  }, [password, fullName, email]);

  const extraMet = useMemo(
    () => ({
      notTooLong: req.notTooLong,
      noPersonalInfo: !containsNameOrEmail,
    }),
    [req.notTooLong, containsNameOrEmail]
  );

  const showActivationOption = (activationEmail) => {
    Alert.alert(
      t("auth.common.activationRequiredTitle"),
      t("auth.signup.activationMessage"),
      [
        { text: t("auth.common.later"), style: "cancel" },
        {
          text: t("auth.common.verifyOtp"),
          onPress: async () => {
            try {
              await openActivationOtp(navigation, activationEmail);
            } catch (error) {
              const message = getApiErrorMessage(error, t("auth.common.resendOtpFailed"));
              Alert.alert(t("auth.common.cannotResendOtp"), message);
            }
          }
        }
      ]
    );
  };

  const onNext = async () => {
    if (!canProceed) return;

    if (containsNameOrEmail) {
      Alert.alert(t("auth.createPassword.weakTitle"), t("auth.createPassword.weakMessage"));
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.REGISTER, { email, fullName, password });
      navigation.navigate("VerifyOtp", { email });
    } catch (error) {
      if (isActivationRequiredError(error)) {
        showActivationOption(getActivationEmail(error, email));
        return;
      }
      const message = getApiErrorMessage(error, t("auth.signup.failedMessage"));
      Alert.alert(t("auth.signup.failedTitle") || t("auth.common.error"), message);
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
          <Text style={[styles.title, { color: colors.TEXT }]}>{t("auth.createPassword.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>{t("auth.createPassword.subtitle")}</Text>

          <PasswordInput
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            focused={passwordFocused}
            placeholder={t("auth.common.enterPassword")}
          />

          <AppButton
            variant="primary"
            title={loading ? t("auth.createPassword.loading") : t("auth.common.next")}
            onPress={onNext}
            loading={loading}
            disabled={!canProceed || loading}
            style={styles.nextButton}
          />

          <PasswordRequirement req={req} extraMet={extraMet} />
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
  nextButton: {
    marginBottom: scale(24),
    marginTop: scale(4),
  },
});
