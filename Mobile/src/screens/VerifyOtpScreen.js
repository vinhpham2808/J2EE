import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { getApiErrorMessage } from "../utils/format";
import { getRetryAfterSeconds } from "../utils/otp";
import { COLORS } from "../constants/colors";

export default function VerifyOtpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || "";
  const initialCountdown = Number(route.params?.initialCountdown || 0);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigation.navigate("Signup");
    }
  }, [email, navigation]);

  useEffect(() => {
    if (Number.isFinite(initialCountdown) && initialCountdown > 0) {
      setResendDisabled(true);
      setCountdown(Math.ceil(initialCountdown));
    }
  }, [initialCountdown]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleChange = useCallback((index, value) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index, key) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleSubmit = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đầy đủ mã OTP.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await http.post(API_ENDPOINTS.VERIFY_OTP, {
        email,
        otp: otpCode,
      });
      setLoading(false);

      setSuccessMsg("verified");
      setTimeout(() => {
        Alert.alert(
          "Đăng ký thành công",
          "Tài khoản của bạn đã được xác thực. Hãy thiết lập thông tin cá nhân.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("SetupProfile", { email }),
            },
          ]
        );
      }, 5000);
    } catch (err) {
      setLoading(false);
      const message = getApiErrorMessage(err, "Xác thực thất bại.");
      setError(message);
    }
  };

  const handleResend = async () => {
    setResendDisabled(true);
    setCountdown(60);
    setError("");
    setSuccessMsg("");
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();

    try {
      await http.post(API_ENDPOINTS.RESEND_OTP, { email });
      Alert.alert("Đã gửi lại", "Mã OTP mới đã được gửi tới email của bạn.");
    } catch (err) {
      const retryAfterSeconds = getRetryAfterSeconds(err);
      if (retryAfterSeconds > 0) {
        setResendDisabled(true);
        setCountdown(retryAfterSeconds);
        setError("");
        return;
      }

      const message = getApiErrorMessage(err, "Gửi lại mã thất bại.");
      setError(message);
      setResendDisabled(false);
      setCountdown(0);
    }
  };

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
        <Text style={styles.title}>Kiểm tra email của bạn</Text>
        <Text style={styles.subtitle}>Vui lòng nhập mã được gửi tới</Text>
        <Text style={styles.emailText}>{email}</Text>

        <View style={styles.formCard}>
          {/* OTP Inputs */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                value={digit}
                onChangeText={(value) => handleChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyDown(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Pressable
            style={[styles.actionButton, (loading || !!successMsg) && styles.actionButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !!successMsg}
          >
            <Text style={styles.actionButtonText}>
              {loading ? "Đang xác thực..." : "Xác thực"}
            </Text>
          </Pressable>

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Không nhận được mã? </Text>
            <Pressable onPress={handleResend} disabled={resendDisabled}>
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
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.DARK_TEXT,
    textAlign: "center",
    marginBottom: 6
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.DARK_TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: 4
  },
  emailText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.DARK_TEXT,
    textAlign: "center",
    marginBottom: 24
  },
  formCard: {
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER_LIGHT,
    padding: 24,
    gap: 16
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: COLORS.DARK_INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.DARK_TEXT
  },
  otpInputFilled: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 2
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
    overflow: "hidden"
  },
  successText: {
    color: COLORS.INCOME,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
    marginTop: 4
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4
  },
  actionButtonDisabled: {
    opacity: 0.6
  },
  actionButtonText: {
    color: COLORS.DARK_TEXT,
    fontSize: 16,
    fontWeight: "700"
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4
  },
  resendLabel: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 13
  },
  resendLink: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 13,
    fontWeight: "700"
  },
  resendLinkDisabled: {
    color: COLORS.EXPENSE_LIGHT
  }
});
