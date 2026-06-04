import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";

/**
 * Paywall screen shown to non-PREMIUM users.
 * Prompts upgrade to access forecast features.
 */
export default function ForecastPaywall() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔮</Text>
      <Text style={styles.title}>Dự báo & Phát hiện bất thường</Text>
      <Text style={styles.desc}>
        Dự đoán chi tiêu tháng tới theo danh mục, phát hiện giao dịch bất thường,{"\n"}
        và nhận phân tích AI chuyên sâu về tài chính của bạn.
      </Text>

      <View style={styles.features}>
        <Text style={styles.feature}>📊 Dự báo chi tiêu theo danh mục</Text>
        <Text style={styles.feature}>📈 Biểu đồ xu hướng 6 tháng</Text>
        <Text style={styles.feature}>🚨 Cảnh báo giao dịch bất thường</Text>
        <Text style={styles.feature}>🤖 Phân tích AI chuyên sâu</Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate("SettingTab", { screen: "Payment" })}
      >
        <Text style={styles.buttonText}>Nâng cấp lên PREMIUM</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.TEXT,
    textAlign: "center",
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
  },
  features: {
    alignSelf: "stretch",
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  feature: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: "600",
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
});
