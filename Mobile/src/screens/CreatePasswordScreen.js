import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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

export default function CreatePasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const email = route.params?.email || "";
  const fullName = route.params?.fullName || "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const req = useMemo(() => meetsRequirements(password), [password]);
  const canProceed = req.hasNumber && req.hasUppercase && req.hasLowercase &&
    req.hasSpecial && req.hasMinLength && req.notTooLong;

  // Check if name/email is contained in password (must NOT contain)
  const containsNameOrEmail = useMemo(() => {
    const lowerPassword = password.toLowerCase();
    const nameParts = fullName.toLowerCase().split(/\s+/);
    const emailLocal = email.split("@")[0]?.toLowerCase() || "";
    return nameParts.some(part => part.length > 1 && lowerPassword.includes(part)) ||
      (emailLocal.length > 1 && lowerPassword.includes(emailLocal));
  }, [password, fullName, email]);

  // Must NOT contain checks — true when the condition is NOT violated
  const mustNotContainMet = useMemo(() => ({
    notTooLong: req.notTooLong,            // password ≤256 chars → requirement met
    noPersonalInfo: !containsNameOrEmail,   // doesn't contain name/email → met
  }), [req.notTooLong, containsNameOrEmail]);

  const onNext = async () => {
    if (!canProceed) return;

    if (containsNameOrEmail) {
      Alert.alert("Mật khẩu yếu", "Mật khẩu không được chứa tên hoặc email của bạn.");
      return;
    }

    setLoading(true);
    try {
      await http.put(API_ENDPOINTS.COMPLETE_PROFILE, {
        email,
        fullName,
        password
      });

      Alert.alert(
        "Hoàn tất",
        "Tài khoản của bạn đã được thiết lập. Vui lòng đăng nhập.",
        [{ text: "Đăng nhập", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể thiết lập tài khoản. Vui lòng thử lại.");
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Password input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mật khẩu (bắt buộc)</Text>
          <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry
              placeholder="Nhập mật khẩu"
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

        {/* Next button */}
        <Pressable
          style={[styles.nextButton, (!canProceed || loading) && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!canProceed || loading}
        >
          <Text style={[styles.nextButtonText, (!canProceed || loading) && styles.nextButtonTextDisabled]}>
            {loading ? "Đang thiết lập..." : "Tiếp theo"}
          </Text>
        </Pressable>

        {/* Password requirements */}
        <View style={styles.requirementsSection}>
          <View style={styles.requirementsRow}>
            {/* Left column — must contain */}
            <View style={styles.requirementsCol}>
              <Text style={styles.requirementsTitle}>Phải chứa ít nhất</Text>
              <RequirementItem met={req.hasNumber} label="1 số" />
              <RequirementItem met={req.hasUppercase} label="1 chữ hoa" />
              <RequirementItem met={req.hasLowercase} label="1 chữ thường" />
              <RequirementItem met={req.hasSpecial} label="1 ký tự đặc biệt" />
              <RequirementItem met={req.hasMinLength} label="8 ký tự" />
            </View>

            {/* Right column — must NOT contain */}
            <View style={styles.requirementsCol}>
              <Text style={styles.requirementsTitle}>Không được chứa</Text>
              <RequirementItem met={mustNotContainMet.notTooLong} label="Hơn 256 ký tự" />
              <RequirementItem met={mustNotContainMet.noPersonalInfo} label="Tên hoặc email của bạn" />
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 20
  },
  inputGroup: {
    marginBottom: 18
  },
  inputLabel: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.3
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.DARK_INPUT_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    paddingHorizontal: 14,
    height: 50
  },
  inputWrapFocused: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 1.5
  },
  input: {
    flex: 1,
    color: COLORS.DARK_TEXT,
    fontSize: 16
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.DARK_TEXT_SECONDARY,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8
  },
  clearIcon: {
    color: COLORS.DARK_BG,
    fontSize: 12,
    fontWeight: "700"
  },
  nextButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 24,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    marginTop: 4
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.DARK_BORDER,
    opacity: 0.5
  },
  nextButtonText: {
    color: COLORS.DARK_TEXT,
    fontSize: 16,
    fontWeight: "700"
  },
  nextButtonTextDisabled: {
    color: COLORS.DARK_TEXT_SECONDARY
  },
  requirementsSection: {
    marginBottom: 10
  },
  requirementsRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  requirementsCol: {
    flex: 1,
    paddingRight: 8
  },
  requirementsTitle: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5
  },
  requirementBullet: {
    fontSize: 8,
    color: COLORS.DARK_TEXT_SECONDARY,
    marginRight: 8,
    width: 12
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
  },
  footer: {
    alignItems: "center",
    paddingBottom: 30
  },
  footerText: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5
  }
});
