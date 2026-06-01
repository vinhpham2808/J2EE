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
import appLogo from "../assets/applogo.png";
import { COLORS } from "../constants/colors";
import { scale, clampScale } from "../utils/dimensions";

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
          <Image source={appLogo} style={styles.brandLogo} resizeMode="contain" />
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
    paddingHorizontal: scale(16),
    paddingTop: scale(70),
    paddingBottom: scale(30)
  },
  brandRow: {
    alignSelf: "center",
    marginBottom: scale(20)
  },
  brandLogo: {
    width: 90,
    height: 90
  },
  title: {
    color: COLORS.DARK_TEXT,
    fontSize: clampScale(24, 20, 28),
    fontWeight: "700",
    textAlign: "center"
  },
  subtitle: {
    marginTop: scale(8),
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: clampScale(13, 11, 15),
    textAlign: "center"
  },
  formCard: {
    marginTop: scale(24),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER_LIGHT,
    backgroundColor: COLORS.DARK_CARD,
    padding: scale(14)
  },
  inputWrap: {
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    backgroundColor: COLORS.DARK_INPUT_BG,
    marginBottom: scale(10)
  },
  input: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(12),
    color: COLORS.DARK_TEXT
  },
  actionButton: {
    marginTop: scale(4),
    borderRadius: scale(10),
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: scale(12),
    alignItems: "center"
  },
  actionButtonDisabled: {
    opacity: 0.7
  },
  actionButtonText: {
    color: COLORS.DARK_TEXT,
    fontSize: clampScale(15, 13, 17),
    fontWeight: "800"
  },
  backButton: {
    marginTop: scale(12),
    alignItems: "center"
  },
  backButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: clampScale(12, 10, 14),
    fontWeight: "700"
  }
});
