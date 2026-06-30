import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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

export default function SignupScreen() {
  const navigation = useNavigation();
  const colors = useAppColors();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);

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

  const onSubmit = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      Alert.alert(t("auth.signup.missingTitle"), t("auth.signup.missingEmail"));
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.REGISTER, {
        email: normalizedEmail
      });

      navigation.navigate("VerifyOtp", { email: normalizedEmail });
    } catch (error) {
      if (isActivationRequiredError(error)) {
        showActivationOption(getActivationEmail(error, normalizedEmail));
        return;
      }

      const message = getApiErrorMessage(error, t("auth.signup.failedMessage"));
      Alert.alert(t("auth.signup.failedTitle"), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.APP_BACKGROUND || "#F2F2F7" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.bgGlow, { backgroundColor: colors.PRIMARY_GLOW || "rgba(255, 178, 191, 0.25)" }]} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.brandRow, { shadowColor: colors.PRIMARY || "#ef5e83" }]}>
          <Image source={appLogo} style={styles.brandLogo} resizeMode="contain" />
        </View>

        <Text style={[styles.title, { color: colors.TEXT }]}>{t("auth.signup.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>{t("auth.signup.subtitle")}</Text>

        <View style={[styles.formCard, { backgroundColor: colors.SURFACE || "#FFFFFF", borderColor: colors.BORDER || "#E5E7EB" }]}>
          <View style={[styles.inputWrap, { backgroundColor: colors.SURFACE_SECONDARY || "#F2F2F7", borderColor: isFocusedEmail ? (colors.PRIMARY || "#ef5e83") : (colors.BORDER || "#E5E7EB") }]}>
            <TextInput
              style={[styles.input, { color: colors.TEXT }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t("auth.common.email")}
              placeholderTextColor={colors.TEXT_MUTED || "#B8A6AC"}
              onFocus={() => setIsFocusedEmail(true)}
              onBlur={() => setIsFocusedEmail(false)}
            />
          </View>

          <AppButton
            variant="primary"
            title={loading ? t("auth.common.processing") : t("auth.common.next")}
            onPress={onSubmit}
            loading={loading}
            disabled={loading}
            style={styles.actionButton}
          />

          <Pressable style={styles.backButton} onPress={() => navigation.navigate("Login")}>
            <Text style={[styles.backButtonText, { color: colors.PRIMARY || "#ef5e83" }]}>{t("auth.signup.hasAccount")}</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: scale(20),
    paddingVertical: scale(40)
  },
  brandRow: {
    alignItems: "center",
    marginBottom: scale(16),
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  brandLogo: {
    width: 100,
    height: 100
  },
  title: {
    fontSize: clampScale(28, 24, 32),
    fontWeight: "800",
    textAlign: "center",
    marginBottom: scale(6)
  },
  subtitle: {
    fontSize: clampScale(14, 12, 16),
    textAlign: "center",
    marginBottom: scale(24)
  },
  formCard: {
    borderRadius: scale(18),
    borderWidth: 1,
    padding: scale(18),
    gap: scale(12)
  },
  inputWrap: {
    borderRadius: scale(12),
    borderWidth: 1.5,
    paddingHorizontal: scale(14),
    height: scale(48),
    justifyContent: "center"
  },
  input: {
    fontSize: clampScale(15, 13, 17)
  },
  actionButton: {
    marginTop: scale(4),
  },
  backButton: {
    alignItems: "center",
    paddingVertical: scale(8)
  },
  backButtonText: {
    fontSize: clampScale(13, 11, 15),
    fontWeight: "600"
  }
});
