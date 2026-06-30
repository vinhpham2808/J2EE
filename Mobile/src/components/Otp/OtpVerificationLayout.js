import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { scale } from "../../utils/layoutScale";
import { useTranslation } from "react-i18next";
import AppButton from "../ui/AppButton";

export default function OtpVerificationLayout({
  title,
  subtitle,
  email,
  children,
  error,
  actionLabel,
  actionLoading,
  actionDisabled,
  onAction,
  resendDisabled,
  countdown,
  onResend,
}) {
  const { t } = useTranslation();
  const colors = useAppColors();

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
        <Text style={[styles.title, { color: colors.TEXT }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>{subtitle}</Text>
        <Text style={[styles.emailText, { color: colors.TEXT }]}>{email}</Text>

        <View style={[styles.formCard, { backgroundColor: colors.SURFACE || "#FFFFFF", borderColor: colors.BORDER || "#E5E7EB" }]}>
          {children}

          {error ? <Text style={[styles.errorText, { color: colors.EXPENSE_LIGHT || "#FDE8E3" }]}>{error}</Text> : null}

          <AppButton
            variant="primary"
            title={actionLoading ? t("auth.common.verifying") : actionLabel || t("auth.common.verify")}
            onPress={onAction}
            loading={actionLoading}
            disabled={actionDisabled}
            style={styles.actionButton}
          />

          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: colors.TEXT_SECONDARY }]}>{t("auth.common.noCode")}</Text>
            <Pressable onPress={onResend} disabled={resendDisabled}>
              <Text style={[styles.resendLink, { color: colors.PRIMARY || "#ef5e83" }, resendDisabled && { color: colors.EXPENSE_LIGHT || "#FDE8E3" }]}>
                {resendDisabled ? `${t("auth.common.resend")} (${countdown}s)` : t("auth.common.resend")}
              </Text>
            </Pressable>
          </View>
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
    paddingVertical: scale(40),
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: scale(6),
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: scale(4),
  },
  emailText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: scale(24),
  },
  formCard: {
    borderRadius: scale(18),
    borderWidth: 1,
    padding: scale(24),
    gap: scale(16),
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    backgroundColor: "rgba(231, 111, 81, 0.2)",
    borderRadius: scale(10),
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    borderWidth: 1,
    borderColor: "rgba(231, 111, 81, 0.3)",
    overflow: "hidden",
  },
  actionButton: {
    marginTop: scale(4),
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: scale(4),
  },
  resendLabel: {
    fontSize: 13,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: "700",
  },
});
