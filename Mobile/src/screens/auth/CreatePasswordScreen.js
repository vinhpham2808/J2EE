import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import apiClient from "../../services/apiClient";
import { API_ENDPOINTS } from "../../constants/api";
import { getApiErrorMessage } from "../../utils/format";
import { COLORS } from "../../constants/colors";
import {
  validatePasswordRequirements,
  isPasswordValid,
} from "../../utils/authPassword";
import PasswordInput from "../../components/auth/PasswordInput";
import PasswordRequirement from "../../components/auth/PasswordRequirement";

export default function CreatePasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const email = route.params?.email || "";
  const fullName = route.params?.fullName || "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const req = useMemo(() => validatePasswordRequirements(password), [password]);
  const canProceed = isPasswordValid(req);

  const containsNameOrEmail = useMemo(() => {
    const lower = password.toLowerCase();
    const nameParts = fullName.toLowerCase().split(/\s+/);
    const emailLocal = email.split("@")[0]?.toLowerCase() || "";
    return (
      nameParts.some((p) => p.length > 1 && lower.includes(p)) ||
      (emailLocal.length > 1 && lower.includes(emailLocal))
    );
  }, [password, fullName, email]);

  const extraMet = useMemo(
    () => ({
      notTooLong: req.notTooLong,
      noPersonalInfo: !containsNameOrEmail,
    }),
    [req.notTooLong, containsNameOrEmail]
  );

  const onNext = async () => {
    if (!canProceed) return;

    if (containsNameOrEmail) {
      Alert.alert("Mật khẩu yếu", "Mật khẩu không được chứa tên hoặc email của bạn.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.put(API_ENDPOINTS.COMPLETE_PROFILE, { email, fullName, password });
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
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            focused={passwordFocused}
            placeholder="Nhập mật khẩu"
          />

          <Pressable
            style={[styles.nextButton, (!canProceed || loading) && styles.nextButtonDisabled]}
            onPress={onNext}
            disabled={!canProceed || loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? "Đang thiết lập..." : "Tiếp theo"}
            </Text>
          </Pressable>

          <PasswordRequirement req={req} extraMet={extraMet} />
        </ScrollView>
      </View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  nextButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 24,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    marginTop: 4,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.DARK_BORDER,
    opacity: 0.5,
  },
  nextButtonText: {
    color: COLORS.DARK_TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
});
