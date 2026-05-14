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
import devbotLogo from "../assets/devbot.png";
import { COLORS } from "../constants/colors";

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
          <Image source={devbotLogo} style={styles.brandLogo} resizeMode="contain" />
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
  brandRow: {
    alignItems: "center",
    marginBottom: 16
  },
  brandLogo: {
    width: 160,
    height: 50
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
    marginBottom: 24
  },
  formCard: {
    backgroundColor: COLORS.DARK_CARD_SOLID,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    padding: 18,
    gap: 12
  },
  inputWrap: {
    backgroundColor: COLORS.DARK_INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: "center"
  },
  input: {
    color: COLORS.DARK_TEXT,
    fontSize: 15
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
  backButton: {
    alignItems: "center",
    paddingVertical: 8
  },
  backButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 13,
    fontWeight: "600"
  }
});
