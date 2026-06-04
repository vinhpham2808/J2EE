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
import { COLORS } from "../../constants/colors";

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
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.emailText}>{email}</Text>

        <View style={styles.formCard}>
          {children}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.actionButton, actionDisabled && styles.actionButtonDisabled]}
            onPress={onAction}
            disabled={actionDisabled}
          >
            <Text style={styles.actionButtonText}>
              {actionLoading ? "Đang xác thực..." : actionLabel || "Xác thực"}
            </Text>
          </Pressable>

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Không nhận được mã? </Text>
            <Pressable onPress={onResend} disabled={resendDisabled}>
              <Text style={[styles.resendLink, resendDisabled && styles.resendLinkDisabled]}>
                {resendDisabled ? `Gửi lại (${countdown}s)` : "Gửi lại"}
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
    backgroundColor: COLORS.DARK_BG,
  },
  bgGlowTop: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.PRIMARY_GLOW,
  },
  bgGlowBottom: {
    position: "absolute",
    right: -140,
    bottom: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.PRIMARY_GLOW,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.DARK_TEXT,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.DARK_TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.DARK_TEXT,
    textAlign: "center",
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER_LIGHT,
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: COLORS.EXPENSE_LIGHT,
    fontSize: 13,
    textAlign: "center",
    backgroundColor: "rgba(231, 111, 81, 0.2)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(231, 111, 81, 0.3)",
    overflow: "hidden",
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: COLORS.DARK_TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  resendLabel: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 13,
  },
  resendLink: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 13,
    fontWeight: "700",
  },
  resendLinkDisabled: {
    color: COLORS.EXPENSE_LIGHT,
  },
});
