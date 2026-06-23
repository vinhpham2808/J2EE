import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import apiClient from "../../services/apiClient";
import { API_ENDPOINTS } from "../../constants/api";
import { getApiErrorMessage } from "../../utils/format";
import {
  getActivationEmail,
  isActivationRequiredError,
  openActivationOtp
} from "../../utils/authActivation";
import appLogo from "../../assets/logo&banner/applogo.png";
import { COLORS, useAppColors } from "../../constants/colors";
import { scale, clampScale } from "../../utils/layoutScale";
import AppButton from "../../components/ui/AppButton";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const colors = useAppColors();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);

  const showActivationOption = (activationEmail) => {
    Alert.alert(
      t("auth.common.activationRequiredTitle"),
      t("auth.forgotPassword.activationMessage"),
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

  const onSend = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      Alert.alert(t("auth.forgotPassword.missingTitle"), t("auth.forgotPassword.missingEmail"));
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email: normalizedEmail });
      navigation.navigate("ForgotPasswordOtp", { email: normalizedEmail });
    } catch (error) {
      if (isActivationRequiredError(error)) {
        showActivationOption(getActivationEmail(error, normalizedEmail));
        return;
      }

      const message = getApiErrorMessage(error, t("auth.forgotPassword.failedMessage"));
      Alert.alert(t("auth.forgotPassword.failedTitle"), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.APP_BACKGROUND || "#F2F2F7" }]}>
      <View style={[styles.bgGlow, { backgroundColor: colors.PRIMARY_GLOW || "rgba(255, 178, 191, 0.25)" }]} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.brandRow, { shadowColor: colors.PRIMARY || "#ef5e83" }]}>
          <Image source={appLogo} style={styles.brandLogo} resizeMode="contain" />
        </View>

        <Text style={[styles.title, { color: colors.TEXT }]}>{t("auth.forgotPassword.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>{t("auth.forgotPassword.subtitle")}</Text>

        <View style={[styles.formCard, { backgroundColor: colors.SURFACE || "#FFFFFF", borderColor: colors.BORDER || "#E5E7EB" }]}>
          <View style={[styles.inputWrap, { backgroundColor: colors.SURFACE_SECONDARY || "#F2F2F7", borderColor: isFocusedEmail ? (colors.PRIMARY || "#ef5e83") : (colors.BORDER || "#E5E7EB") }]}>
            <TextInput
              style={[styles.input, { color: colors.TEXT }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t("auth.common.enterEmail")}
              placeholderTextColor={colors.TEXT_MUTED || "#B8A6AC"}
              onFocus={() => setIsFocusedEmail(true)}
              onBlur={() => setIsFocusedEmail(false)}
            />
          </View>

          <AppButton
            variant="primary"
            title={loading ? t("auth.forgotPassword.sending") : t("auth.forgotPassword.sendRequest")}
            onPress={onSend}
            loading={loading}
            disabled={loading}
            style={styles.actionButton}
          />

          <Pressable style={styles.backButton} onPress={() => navigation.navigate("Login")}>
            <Text style={[styles.backButtonText, { color: colors.PRIMARY || "#ef5e83" }]}>{t("auth.forgotPassword.backToLogin")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: scale(16),
    paddingTop: scale(70),
    paddingBottom: scale(30)
  },
  brandRow: {
    alignSelf: "center",
    marginBottom: scale(20),
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  brandLogo: {
    width: scale(100),
    height: scale(100)
  },
  title: {
    fontSize: clampScale(24, 20, 28),
    fontWeight: "800",
    textAlign: "center"
  },
  subtitle: {
    marginTop: scale(8),
    fontSize: clampScale(13, 11, 15),
    textAlign: "center"
  },
  formCard: {
    marginTop: scale(24),
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(16),
    gap: scale(16)
  },
  inputWrap: {
    borderRadius: scale(12),
    borderWidth: 1.5,
    paddingHorizontal: scale(14),
    height: scale(48),
    justifyContent: "center",
    marginBottom: scale(4)
  },
  input: {
    fontSize: 16
  },
  actionButton: {
    marginTop: scale(4),
  },
  backButton: {
    marginTop: scale(4),
    alignItems: "center"
  },
  backButtonText: {
    fontSize: clampScale(13, 11, 15),
    fontWeight: "700"
  }
});
