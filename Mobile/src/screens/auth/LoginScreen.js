import React from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import appLogo from "../../assets/logo&banner/applogo.png";
import { COLORS, useAppColors } from "../../constants/colors";
import { scale, clampScale } from "../../utils/layoutScale";
import useLoginActions from "../../hooks/useLoginActions";
import LoginForm from "../../components/auth/LoginForm";
import LanguagePill from "../../components/common/LanguagePill";

function LoginLoadingOverlay({ colors }) {
  const { t } = useTranslation();

  return (
    <View
      style={[styles.loadingOverlay, { backgroundColor: colors.OVERLAY || "rgba(0, 0, 0, 0.5)" }]}
      pointerEvents="auto"
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <View style={[styles.loadingContainer, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
        <ActivityIndicator size="large" color={colors.PRIMARY || "#7C4DFF"} />
        <Text style={[styles.loadingText, { color: colors.TEXT }]}>{t("auth.login.authenticating")}</Text>
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const colors = useAppColors();
  const { t } = useTranslation();
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    loading,
    googleAuthLoading,
    onToggleRemember,
    onSubmit,
    onGooglePress,
  } = useLoginActions();

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.APP_BACKGROUND || "#F2F2F7" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {loading || googleAuthLoading ? <LoginLoadingOverlay colors={colors} /> : null}

      <LanguagePill />

      <View style={[styles.bgGlowTop, { backgroundColor: colors.BADGE_POSITIVE_BG || "rgba(124, 77, 255, 0.08)" }]} />
      <View style={[styles.bgGlowMiddle, { backgroundColor: colors.BADGE_POSITIVE_BG || "rgba(249, 115, 22, 0.05)" }]} />
      <View style={[styles.bgGlowBottom, { backgroundColor: colors.BADGE_POSITIVE_BG || "rgba(124, 77, 255, 0.08)" }]} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.brandRow, { shadowColor: colors.PRIMARY || "#7C4DFF" }]}>
          <Image source={appLogo} style={styles.brandLogo} resizeMode="contain" />
        </View>

        <Text style={[styles.title, { color: colors.TEXT }]}>{t("auth.login.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>{t("auth.login.subtitle")}</Text>

        <LoginForm
          email={email}
          password={password}
          rememberMe={rememberMe}
          loading={loading}
          googleLoading={googleAuthLoading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onToggleRemember={onToggleRemember}
          onSubmit={onSubmit}
          onForgotPassword={() => navigation.navigate("ForgotPassword")}
          onGooglePress={onGooglePress}
          onSignup={() => navigation.navigate("Signup")}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bgGlowTop: {
    position: "absolute",
    top: -120,
    left: -100,
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
  },
  bgGlowMiddle: {
    position: "absolute",
    top: "40%",
    right: -100,
    width: scale(180),
    height: scale(180),
    borderRadius: scale(90),
  },
  bgGlowBottom: {
    position: "absolute",
    right: -140,
    bottom: -120,
    width: scale(320),
    height: scale(320),
    borderRadius: scale(160),
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: scale(16),
    paddingTop: scale(70),
    paddingBottom: scale(30),
  },
  brandRow: {
    alignSelf: "center",
    marginBottom: scale(20),
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  brandLogo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: clampScale(24, 20, 28),
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: scale(8),
    fontSize: clampScale(13, 11, 15),
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
    zIndex: 999,
  },
  loadingContainer: {
    borderRadius: scale(16),
    borderWidth: 1,
    paddingVertical: scale(24),
    paddingHorizontal: scale(32),
    alignItems: "center",
    gap: scale(12),
  },
  loadingText: {
    fontSize: clampScale(14, 12, 16),
    fontWeight: "600",
    textAlign: "center",
  },
});
