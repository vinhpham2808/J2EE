import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const showActivationOption = (activationEmail) => {
    Alert.alert(
      "Tài khoản chưa được kích hoạt",
      "Tài khoản này cần được xác thực OTP trước khi đặt lại mật khẩu.",
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

  const onSend = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      Alert.alert("Thiếu email", "Vui lòng nhập email của bạn.");
      return;
    }

    setLoading(true);
    try {
      await http.post(API_ENDPOINTS.FORGOT_PASSWORD, { email: normalizedEmail });
      navigation.navigate("ForgotPasswordOtp", { email: normalizedEmail });
    } catch (error) {
      if (isActivationRequiredError(error)) {
        showActivationOption(getActivationEmail(error, normalizedEmail));
        return;
      }

      const message = getApiErrorMessage(error, "Không thể gửi yêu cầu. Vui lòng thử lại.");
      Alert.alert("Thất bại", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
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

        <Text style={styles.title}>Quên mật khẩu</Text>
        <Text style={styles.subtitle}>Nhập email để nhận liên kết đặt lại mật khẩu.</Text>

        <View style={styles.formCard}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Nhập email"
              placeholderTextColor="#7f9085"
            />
          </View>

          <Pressable style={[styles.actionButton, loading && styles.actionButtonDisabled]} onPress={onSend} disabled={loading}>
            <Text style={styles.actionButtonText}>{loading ? "Đang gửi..." : "Gửi yêu cầu"}</Text>
          </Pressable>

          <Pressable style={styles.backButton} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.backButtonText}>Quay lại đăng nhập</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 70,
    paddingBottom: 30
  },
  brandRow: {
    alignSelf: "center",
    marginBottom: 20
  },
  brandLogo: {
    width: 220,
    height: 72
  },
  title: {
    color: COLORS.DARK_TEXT,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center"
  },
  subtitle: {
    marginTop: 8,
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 13,
    textAlign: "center"
  },
  formCard: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER_LIGHT,
    backgroundColor: COLORS.DARK_CARD,
    padding: 14
  },
  inputWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    backgroundColor: COLORS.DARK_INPUT_BG,
    marginBottom: 10
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: COLORS.DARK_TEXT
  },
  actionButton: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    alignItems: "center"
  },
  actionButtonDisabled: {
    opacity: 0.7
  },
  actionButtonText: {
    color: COLORS.DARK_TEXT,
    fontSize: 15,
    fontWeight: "800"
  },
  backButton: {
    marginTop: 12,
    alignItems: "center"
  },
  backButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 12,
    fontWeight: "700"
  }
});
