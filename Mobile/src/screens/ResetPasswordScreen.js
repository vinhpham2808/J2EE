import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { getApiErrorMessage } from "../utils/format";
import { COLORS } from "../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function meetsRequirements(password) {
  return {
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-~`[\]\\;'/+=]/.test(password),
    hasMinLength: password.length >= 8,
    notTooLong: password.length <= 256,
  };
}

function RequirementItem({ met, label }) {
  return (
    <View style={styles.requirementRow}>
      <Text style={[styles.requirementBullet, met && styles.requirementBulletMet]}>●</Text>
      <Text style={[styles.requirementText, met && styles.requirementTextMet]}>{label}</Text>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const email = route.params?.email || "";
  const otp = route.params?.otp || "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const req = useMemo(() => meetsRequirements(password), [password]);
  const canProceed = req.hasNumber && req.hasUppercase && req.hasLowercase &&
    req.hasSpecial && req.hasMinLength && req.notTooLong;

  const onReset = async () => {
    if (!canProceed) return;

    setLoading(true);
    try {
      await http.post(API_ENDPOINTS.RESET_PASSWORD, {
        email,
        otp,
        newPassword: password,
      });

      Alert.alert(
        "Thành công",
        "Mật khẩu của bạn đã được đặt lại. Vui lòng đăng nhập bằng mật khẩu mới.",
        [{ text: "Đăng nhập", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
      Alert.alert("Lỗi", message);
    } finally {
      setLoading(false);
    }
  };

  const onClearPassword = () => setPassword("");

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.bgGlowTop} />
        <View style={styles.bgGlowBottom} />

        {/* Top bar with back */}
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Đặt lại mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập mật khẩu mới cho tài khoản của bạn.</Text>

          {/* New password input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {password.length > 0 && (
                <Pressable onPress={onClearPassword} style={styles.clearButton}>
                  <Text style={styles.clearIcon}>✕</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Reset button */}
          <Pressable
            style={[styles.nextButton, (!canProceed || loading) && styles.nextButtonDisabled]}
            onPress={onReset}
            disabled={!canProceed || loading}
          >
            <Text style={[styles.nextButtonText, (!canProceed || loading) && styles.nextButtonTextDisabled]}>
              {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </Text>
          </Pressable>

          {/* Password requirements */}
          <View style={styles.requirementsSection}>
            <View style={styles.requirementsRow}>
              <View style={styles.requirementsCol}>
                <Text style={styles.requirementsTitle}>Phải chứa ít nhất</Text>
                <RequirementItem met={req.hasNumber} label="1 số" />
                <RequirementItem met={req.hasUppercase} label="1 chữ hoa" />
                <RequirementItem met={req.hasLowercase} label="1 chữ thường" />
                <RequirementItem met={req.hasSpecial} label="1 ký tự đặc biệt" />
                <RequirementItem met={req.hasMinLength} label="8 ký tự" />
              </View>
              <View style={styles.requirementsCol}>
                <Text style={styles.requirementsTitle}>Không được chứa</Text>
                <RequirementItem met={req.notTooLong} label="Hơn 256 ký tự" />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.DARK_BG
  },
  bgGlowTop: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.PRIMARY_GLOW
  },
  bgGlowBottom: {
    position: "absolute",
    right: -140,
    bottom: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.PRIMARY_GLOW
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  backArrow: {
    color: COLORS.DARK_TEXT,
    fontSize: 22,
    fontWeight: "600"
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 20
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.DARK_TEXT,
    marginBottom: 8,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.DARK_TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: 28
  },
  inputGroup: {
    marginBottom: 18
  },
  inputLabel: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    marginLeft: 2
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.DARK_INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    paddingHorizontal: 14
  },
  inputWrapFocused: {
    borderColor: COLORS.PRIMARY
  },
  input: {
    flex: 1,
    color: COLORS.DARK_TEXT,
    fontSize: 15,
    paddingVertical: 14
  },
  clearButton: {
    padding: 6
  },
  clearIcon: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 14
  },
  nextButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6
  },
  nextButtonDisabled: {
    opacity: 0.5
  },
  nextButtonText: {
    color: COLORS.DARK_TEXT,
    fontSize: 16,
    fontWeight: "700"
  },
  nextButtonTextDisabled: {
    color: COLORS.DARK_TEXT
  },
  requirementsSection: {
    marginTop: 22
  },
  requirementsRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  requirementsCol: {
    flex: 1
  },
  requirementsTitle: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5
  },
  requirementBullet: {
    fontSize: 8,
    color: COLORS.EXPENSE_LIGHT,
    marginRight: 6,
    width: 10
  },
  requirementBulletMet: {
    color: COLORS.INCOME
  },
  requirementText: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 12
  },
  requirementTextMet: {
    color: COLORS.DARK_TEXT
  }
});
