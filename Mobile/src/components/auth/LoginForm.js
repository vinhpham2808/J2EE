import React from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { scale, clampScale } from "../../utils/layoutScale";

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
  return (
    <View style={styles.formCard}>
      <View style={styles.inputWrap}>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Nhập email"
          placeholderTextColor="#7f9085"
          style={styles.input}
          value={email}
          onChangeText={onEmailChange}
        />
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          secureTextEntry
          placeholder="Nhập mật khẩu"
          placeholderTextColor="#7f9085"
          style={styles.input}
          value={password}
          onChangeText={onPasswordChange}
        />
      </View>

      <View style={styles.rowBetween}>
        <View style={styles.rememberRow}>
          <Switch
            value={rememberMe}
            onValueChange={onToggleRemember}
            thumbColor={rememberMe ? COLORS.PRIMARY : "#9ca3af"}
            trackColor={{ false: "#374151", true: COLORS.PRIMARY_DARK }}
            style={styles.switch}
          />
          <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
        </View>
        <Pressable onPress={onForgotPassword}>
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
        <View style={styles.dividerLine} />
      </View>

      <SocialLoginButton loading={googleLoading} onPress={onGooglePress} />

      <View style={styles.signupRow}>
        <Text style={styles.signupText}>Chưa có tài khoản? </Text>
        <Pressable onPress={onSignup}>
          <Text style={styles.signupLink}>Đăng ký</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SocialLoginButton({ loading, onPress }) {
  return (
    <View style={styles.socialRow}>
      <Pressable
        style={[styles.socialBtn, loading && styles.socialBtnDisabled]}
        onPress={onPress}
        disabled={loading}
      >
        <Text style={styles.socialIcon}>G</Text>
        <Text style={styles.socialLabel}>Google</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    marginTop: scale(24),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER_LIGHT,
    backgroundColor: COLORS.DARK_CARD,
    padding: scale(14),
  },
  inputWrap: {
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    backgroundColor: COLORS.DARK_INPUT_BG,
    marginBottom: scale(10),
  },
  input: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(12),
    color: COLORS.DARK_TEXT,
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
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: clampScale(12, 10, 14),
    marginLeft: scale(2),
  },
  forgotText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: clampScale(12, 10, 14),
    fontWeight: "600",
  },
  loginButton: {
    marginTop: scale(14),
    borderRadius: scale(10),
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: scale(12),
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.DARK_TEXT,
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
    backgroundColor: COLORS.DARK_BORDER,
  },
  dividerText: {
    color: COLORS.DARK_TEXT_SECONDARY,
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
    borderColor: COLORS.DARK_BORDER,
    backgroundColor: COLORS.DARK_INPUT_BG,
    paddingVertical: scale(11),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  socialBtnDisabled: {
    opacity: 0.6,
  },
  socialIcon: {
    color: COLORS.DARK_TEXT,
    fontSize: clampScale(16, 14, 18),
    fontWeight: "700",
  },
  socialLabel: {
    color: COLORS.DARK_TEXT,
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
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: clampScale(12, 10, 14),
  },
  signupLink: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: clampScale(12, 10, 14),
    fontWeight: "700",
  },
});
