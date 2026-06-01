import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { getApiErrorMessage } from "../utils/format";
import {
  getActivationEmail,
  isActivationRequiredError,
  openActivationOtp
} from "../utils/accountActivation";
import appLogo from "../assets/applogo.png";
import { COLORS } from "../constants/colors";
import { scale, clampScale } from "../utils/dimensions";

export default function SignupScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const showActivationOption = (activationEmail) => {
    Alert.alert(
      "Tài khoản chưa được kích hoạt",
      "Email này đã được đăng ký nhưng chưa xác thực OTP. Bạn có muốn tiếp tục kích hoạt tài khoản không?",
      [
        { text: "Để sau", style: "cancel" },
        {
          text: "Xác thực OTP",
          onPress: async () => {
            try {
              await openActivationOtp(navigation, activationEmail);
            } catch (error) {
              const message = getApiErrorMessage(error, "Không thể gửi lại mã OTP. Vui lòng thử lại.");
              Alert.alert("Không thể gửi OTP", message);
            }
          }
        }
      ]
    );
  };

  const onSubmit = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    try {
      await http.post(API_ENDPOINTS.REGISTER, {
        email: normalizedEmail
      });

      navigation.navigate("VerifyOtp", { email: normalizedEmail });
    } catch (error) {
      if (isActivationRequiredError(error)) {
        showActivationOption(getActivationEmail(error, normalizedEmail));
        return;
      }

      const message = getApiErrorMessage(error, "Không thể đăng ký. Vui lòng thử lại.");
      Alert.alert("Đăng ký thất bại", message);
    } finally {
      setLoading(false);
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
        <View style={styles.brandRow}>
          <Image source={appLogo} style={styles.brandLogo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Nhập email để bắt đầu.</Text>

        <View style={styles.formCard}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Email"
              placeholderTextColor="#7f9085"
            />
          </View>

          <Pressable
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>{loading ? "Đang xử lý..." : "Tiếp theo"}</Text>
          </Pressable>

          <Pressable style={styles.backButton} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.backButtonText}>Đã có tài khoản? Đăng nhập</Text>
          </Pressable>
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
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
    backgroundColor: COLORS.PRIMARY_GLOW
  },
  bgGlowBottom: {
    position: "absolute",
    right: -140,
    bottom: -120,
    width: scale(320),
    height: scale(320),
    borderRadius: scale(160),
    backgroundColor: COLORS.PRIMARY_GLOW
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: scale(20),
    paddingVertical: scale(40)
  },
  brandRow: {
    alignItems: "center",
    marginBottom: scale(16)
  },
  brandLogo: {
    width: 90,
    height: 90
  },
  title: {
    fontSize: clampScale(28, 24, 32),
    fontWeight: "800",
    color: COLORS.DARK_TEXT,
    textAlign: "center",
    marginBottom: scale(6)
  },
  subtitle: {
    fontSize: clampScale(14, 12, 16),
    color: COLORS.DARK_TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: scale(24)
  },
  formCard: {
    backgroundColor: COLORS.DARK_CARD_SOLID,
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    padding: scale(18),
    gap: scale(12)
  },
  inputWrap: {
    backgroundColor: COLORS.DARK_INPUT_BG,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    paddingHorizontal: scale(14),
    height: scale(48),
    justifyContent: "center"
  },
  input: {
    color: COLORS.DARK_TEXT,
    fontSize: clampScale(15, 13, 17)
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: scale(14),
    height: scale(50),
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(4)
  },
  actionButtonDisabled: {
    opacity: 0.6
  },
  actionButtonText: {
    color: COLORS.DARK_TEXT,
    fontSize: clampScale(16, 14, 18),
    fontWeight: "700"
  },
  backButton: {
    alignItems: "center",
    paddingVertical: scale(8)
  },
  backButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: clampScale(13, 11, 15),
    fontWeight: "600"
  }
});
