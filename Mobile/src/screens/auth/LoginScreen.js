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
import appLogo from "../../assets/applogo.png";
import { COLORS } from "../../constants/colors";
import { scale, clampScale } from "../../utils/layoutScale";
import useLoginActions from "../../hooks/useLoginActions";
import LoginForm from "../../components/auth/LoginForm";

function LoginLoadingOverlay() {
  return (
    <View
      style={styles.loadingOverlay}
      pointerEvents="auto"
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Devbot đang xác thực</Text>
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const navigation = useNavigation();
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
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {loading || googleAuthLoading ? <LoginLoadingOverlay /> : null}

      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <Image source={appLogo} style={styles.brandLogo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Đăng nhập tài khoản</Text>
        <Text style={styles.subtitle}>Chào mừng bạn quay lại. Hãy chọn cách đăng nhập.</Text>

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
    backgroundColor: COLORS.DARK_BG,
  },
  bgGlowTop: {
    position: "absolute",
    top: -120,
    left: -100,
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
    backgroundColor: COLORS.PRIMARY_GLOW,
  },
  bgGlowBottom: {
    position: "absolute",
    right: -140,
    bottom: -120,
    width: scale(320),
    height: scale(320),
    borderRadius: scale(160),
    backgroundColor: COLORS.PRIMARY_GLOW,
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
  },
  brandLogo: {
    width: 90,
    height: 90,
  },
  title: {
    color: COLORS.DARK_TEXT,
    fontSize: clampScale(24, 20, 28),
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    marginTop: scale(8),
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: clampScale(13, 11, 15),
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
    backgroundColor: COLORS.OVERLAY,
    zIndex: 999,
  },
  loadingContainer: {
    backgroundColor: COLORS.DARK_CARD_SOLID,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    paddingVertical: scale(24),
    paddingHorizontal: scale(32),
    alignItems: "center",
    gap: scale(12),
  },
  loadingText: {
    color: COLORS.DARK_TEXT,
    fontSize: clampScale(14, 12, 16),
    fontWeight: "600",
    textAlign: "center",
  },
});
