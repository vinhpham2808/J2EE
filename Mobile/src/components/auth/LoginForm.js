import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAppColors } from "../../constants/colors";
import { scale, clampScale } from "../../utils/layoutScale";
import AppIcon from "../ui/AppIcon";

export default function LoginForm({
  email,
  password,
  rememberMe,
  loading,
  googleLoading,
  onEmailChange,
  onPasswordChange,
  onToggleRemember,
  onSubmit,
  onForgotPassword,
  onGooglePress,
  onSignup,
}) {
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const colors = useAppColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.formCard, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
      <View style={[styles.inputWrap, { backgroundColor: colors.APP_BACKGROUND, borderColor: colors.BORDER }, isFocusedEmail && { borderColor: colors.PRIMARY }]}>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={t("auth.common.enterEmail")}
          placeholderTextColor={colors.TEXT_MUTED || "#7f9085"}
          style={[styles.input, { color: colors.TEXT }]}
          value={email}
          onChangeText={onEmailChange}
          onFocus={() => setIsFocusedEmail(true)}
          onBlur={() => setIsFocusedEmail(false)}
          testID="email-input"
        />
      </View>

      <View style={[styles.inputWrap, { backgroundColor: colors.APP_BACKGROUND, borderColor: colors.BORDER }, isFocusedPassword && { borderColor: colors.PRIMARY }]}>
        <TextInput
          secureTextEntry
          placeholder={t("auth.common.enterPassword")}
          placeholderTextColor={colors.TEXT_MUTED || "#7f9085"}
          style={[styles.input, { color: colors.TEXT }]}
          value={password}
          onChangeText={onPasswordChange}
          onFocus={() => setIsFocusedPassword(true)}
          onBlur={() => setIsFocusedPassword(false)}
          testID="password-input"
        />
      </View>

      <View style={styles.rowBetween}>
        <View style={styles.rememberRow}>
          <Switch
            value={rememberMe}
            onValueChange={onToggleRemember}
            thumbColor={rememberMe ? (colors.PRIMARY || "#7C4DFF") : "#9ca3af"}
            trackColor={{ false: colors.BORDER, true: colors.PRIMARY_LIGHT }}
            style={styles.switch}
            testID="remember-switch"
          />
          <Text style={[styles.rememberText, { color: colors.TEXT_SECONDARY }]}>{t("auth.login.rememberMe")}</Text>
        </View>
        <Pressable onPress={onForgotPassword} testID="forgot-password-button">
          <Text style={[styles.forgotText, { color: colors.PRIMARY || "#7C4DFF" }]}>{t("auth.login.forgotPassword")}</Text>
        </Pressable>
      </View>

        <Pressable
          style={[styles.loginButton, { backgroundColor: colors.PRIMARY || "#7C4DFF" }, loading && styles.loginButtonDisabled]}
          onPress={onSubmit}
          disabled={loading}
          testID="login-button"
        >
          <Text style={styles.loginButtonText}>
            {loading ? t("auth.login.loading") : t("auth.common.loginAction")}
          </Text>
        </Pressable>

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.BORDER }]} />
        <Text style={[styles.dividerText, { color: colors.TEXT_SECONDARY }]}>{t("auth.login.divider")}</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.BORDER }]} />
      </View>

      <SocialLoginButton loading={googleLoading} colors={colors} onPress={onGooglePress} />

      <View style={styles.signupRow}>
        <Text style={[styles.signupText, { color: colors.TEXT_SECONDARY }]}>{t("auth.login.noAccount")}</Text>
        <Pressable onPress={onSignup} testID="signup-button">
          <Text style={[styles.signupLink, { color: colors.PRIMARY || "#7C4DFF" }]}>{t("auth.login.signup")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SocialLoginButton({ loading, colors, onPress }) {
  return (
    <View style={styles.socialRow}>
      <Pressable
        style={[styles.socialBtn, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }, loading && styles.socialBtnDisabled]}
        onPress={onPress}
        disabled={loading}
        testID="google-login-button"
      >
        <AppIcon name="logo-google" size={18} color={colors.TEXT} />
        <Text style={[styles.socialLabel, { color: colors.TEXT }]}>Google</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    marginTop: scale(24),
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(14),
  },
  inputWrap: {
    borderRadius: scale(10),
    borderWidth: 1.5,
    marginBottom: scale(10),
  },
  input: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(12),
  },
  rowBetween: {
    marginTop: scale(2),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  rememberText: {
    fontSize: clampScale(12, 10, 14),
    marginLeft: scale(2),
  },
  forgotText: {
    fontSize: clampScale(12, 10, 14),
    fontWeight: "600",
  },
  loginButton: {
    marginTop: scale(14),
    borderRadius: scale(10),
    paddingVertical: scale(12),
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: clampScale(15, 13, 17),
    fontWeight: "800",
  },
  dividerRow: {
    marginTop: scale(18),
    marginBottom: scale(14),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: clampScale(12, 10, 14),
  },
  socialRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  socialBtn: {
    flex: 1,
    borderRadius: scale(10),
    borderWidth: 1,
    paddingVertical: scale(11),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  socialBtnDisabled: {
    opacity: 0.6,
  },
  socialLabel: {
    fontWeight: "600",
    fontSize: clampScale(13, 11, 15),
  },
  signupRow: {
    marginTop: scale(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  signupText: {
    fontSize: clampScale(12, 10, 14),
  },
  signupLink: {
    fontSize: clampScale(12, 10, 14),
    fontWeight: "700",
  },
});
