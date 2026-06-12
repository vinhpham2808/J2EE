import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { API_ENDPOINTS } from "../../constants/api";
import { COLORS, useAppColors } from "../../constants/colors";
import apiClient from "../../services/apiClient";
import { formatMoney, getApiErrorMessage } from "../../utils/format";

async function createPaymentLink(payload) {
  const response = await apiClient.post(API_ENDPOINTS.CREATE_PAYMENT, payload);
  return response.data;
}

import { getSafeAreaContentStyle } from "../../utils/safeArea";
import { PAYMENT_PLANS } from "./paymentPlans";
import AppIcon from "../../components/ui/AppIcon";

const APP_LOGO = require("../../assets/logo&banner/applogo.png");
const WALLET_BLUE = "#4FACFE";
const WALLET_PURPLE = "#7C4DFF";
const WALLET_DEEP_BLUE = "#3B82F6";

const PAYMENT_BENEFITS = [
  "Không bị giới hạn trải nghiệm quản lý tài chính",
  "Theo dõi tài khoản, ngân sách, tiết kiệm và mục tiêu",
  "Báo cáo rõ ràng để ra quyết định chi tiêu tốt hơn",
  "Theo dõi trạng thái thanh toán ngay trong ứng dụng",
  "Ưu tiên các tiện ích nâng cao cho tài khoản trả phí"
];

export default function PaymentScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const [selectedPlanId, setSelectedPlanId] = useState(PAYMENT_PLANS.find((plan) => plan.featured)?.id || PAYMENT_PLANS[0]?.id || "premium");
  const [loading, setLoading] = useState(false);

  const selectedPlan = PAYMENT_PLANS.find((plan) => plan.id === selectedPlanId) || PAYMENT_PLANS[0];
  const brandColor = WALLET_BLUE;
  const isDarkMode = colors.CARD !== "#FFFFFF";
  const pageBg = isDarkMode ? colors.BG : "#EEF7FF";
  const cardBg = isDarkMode ? colors.CARD : COLORS.WHITE;

  const createPayment = async () => {
    if (!selectedPlan) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn gói dịch vụ trước khi thanh toán.");
      return;
    }

    setLoading(true);
    try {
      const response = await createPaymentLink({
        planId: selectedPlan.id,
        amount: selectedPlan.amount,
        description: `Thanh toán ${selectedPlan.displayName}`
      });

      const checkoutUrl = response?.checkoutUrl;
      if (!checkoutUrl) {
        Alert.alert("Tạo liên kết thành công", "Không tìm thấy liên kết để mở cổng thanh toán.");
        return;
      }

      navigation.navigate("PaymentCheckout", {
        checkoutUrl,
        orderCode: response?.orderCode ? String(response.orderCode) : "",
        planName: selectedPlan.displayName
      });
    } catch (error) {
      Alert.alert("Tạo thanh toán thất bại", getApiErrorMessage(error, "Không thể tạo liên kết thanh toán."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: pageBg }]} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}>
      <View style={styles.hero}>
        <LinearGradient colors={[WALLET_PURPLE, WALLET_BLUE]} style={styles.heroIcon}>
          <Image source={APP_LOGO} style={styles.appLogo} resizeMode="contain" />
        </LinearGradient>
        <Text style={[styles.title, { color: colors.TEXT }]}>Money Manager Premium</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
          Chọn gói phù hợp để thanh toán và mở khóa trải nghiệm quản lý tài chính tốt hơn.
        </Text>
      </View>

      <View style={styles.benefitList}>
        {PAYMENT_BENEFITS.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <AppIcon name="star" size={22} color={brandColor} />
            <Text style={[styles.benefitText, { color: colors.TEXT }]}>{benefit}</Text>
          </View>
        ))}
      </View>

      {PAYMENT_PLANS.map((plan) => {
        const active = plan.id === selectedPlanId;
        const premium = plan.id === "premium";
        const textColor = colors.TEXT;
        const secondaryTextColor = colors.TEXT_SECONDARY;
        const accentColor = premium ? brandColor : WALLET_PURPLE;

        return (
          <Pressable
            key={plan.id}
            style={[
              styles.planPressable,
              {
                shadowColor: premium ? brandColor : "#000",
                shadowOpacity: active ? 0.18 : 0.06,
                elevation: active ? 5 : 2
              },
            ]}
            onPress={() => setSelectedPlanId(plan.id)}
          >
            <View
              style={[
                styles.planCard,
                premium && styles.featuredPlanCard,
                {
                  backgroundColor: cardBg,
                  borderColor: active ? accentColor : (premium ? "rgba(79,172,254,0.5)" : "transparent")
                }
              ]}
            >
              {plan.discountLabel ? (
                <View style={styles.ribbon}>
                  <Text style={styles.ribbonText}>{plan.badge} {plan.discountLabel}</Text>
                </View>
              ) : null}

              <View style={styles.planTopRow}>
                <View style={styles.planTitleBlock}>
                  <Text style={[styles.planName, { color: textColor }]}>{plan.displayName}</Text>
                  <Text style={[styles.planDescription, { color: secondaryTextColor }]}>{plan.description}</Text>
                </View>
                <View style={styles.priceBlock}>
                  {plan.originalAmount ? (
                    <Text style={[styles.originalAmount, { color: colors.TEXT_MUTED }]}>{formatMoney(plan.originalAmount)}</Text>
                  ) : null}
                  <Text style={[styles.planAmount, { color: colors.TEXT }]}>{formatMoney(plan.amount)}</Text>
                  <Text style={[styles.planCycle, { color: secondaryTextColor }]}>/ {plan.cycleLabel}</Text>
                </View>
              </View>

              <View style={[styles.planDivider, { backgroundColor: isDarkMode ? colors.CARD_BORDER : "#D7EBFF" }]} />

              <View style={styles.featureList}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <AppIcon name={premium ? "sparkles" : "checkmark-circle"} size={15} color={premium ? WALLET_BLUE : accentColor} />
                    <Text style={[styles.featureText, { color: secondaryTextColor }]}>{feature}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.selectRow}>
                <View style={[styles.radioOuter, { borderColor: active ? accentColor : colors.CARD_BORDER }]}>
                  {active ? <View style={[styles.radioInner, { backgroundColor: accentColor }]} /> : null}
                </View>
                <Text style={[styles.selectText, { color: active ? accentColor : colors.TEXT_SECONDARY }]}>
                  {active ? "Đang chọn gói này" : "Chạm để chọn gói"}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      <Text style={[styles.noteText, { color: colors.TEXT_SECONDARY }]}>
        Lưu ý: Phí dịch vụ được thanh toán theo gói bạn chọn. Sau khi giao dịch thành công, quyền lợi Basic hoặc Premium sẽ được kích hoạt cho tài khoản trong ứng dụng. Nếu kết quả thanh toán chưa hiển thị ngay, vui lòng thoát ra và mở lại màn hình thanh toán sau ít phút để hệ thống kiểm tra giao dịch. Gói dịch vụ không tự động gia hạn; khi hết thời hạn, bạn có thể chủ động thanh toán lại để tiếp tục sử dụng các tính năng nâng cấp.
      </Text>

      <Pressable
        style={[styles.button, { shadowColor: brandColor, elevation: 4 }, loading && styles.buttonDisabled]}
        onPress={createPayment}
        disabled={loading}
      >
        <LinearGradient colors={[WALLET_PURPLE, WALLET_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
          <Text style={styles.buttonText}>{loading ? "Đang xử lý..." : "Chuyển khoản ngân hàng"}</Text>
          <View style={styles.buttonPill}>
            <Text style={styles.buttonPillText}>{selectedPlan?.displayName || "Gói đã chọn"}</Text>
          </View>
        </LinearGradient>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14
  },
  hero: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.7)"
  },
  appLogo: {
    width: 52,
    height: 52,
    borderRadius: 18
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center"
  },
  benefitList: {
    gap: 14,
    marginVertical: 4
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13
  },
  benefitText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "800"
  },
  planPressable: {
    borderRadius: 16,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
  },
  planCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    overflow: "hidden"
  },
  featuredPlanCard: {
    paddingTop: 22
  },
  ribbon: {
    alignSelf: "flex-start",
    backgroundColor: WALLET_DEEP_BLUE,
    borderBottomRightRadius: 8,
    marginTop: -22,
    marginLeft: -16,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  ribbonText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: "800"
  },
  planTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  planTitleBlock: {
    flex: 1
  },
  planName: {
    fontWeight: "800",
    fontSize: 18
  },
  priceBlock: {
    alignItems: "flex-end",
    minWidth: 112
  },
  originalAmount: {
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "line-through"
  },
  planAmount: {
    fontWeight: "800",
    fontSize: 22
  },
  planCycle: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1
  },
  planDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18
  },
  planDivider: {
    height: 1,
    marginTop: 16,
    marginBottom: 14
  },
  featureList: {
    gap: 9
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  selectText: {
    fontSize: 12,
    fontWeight: "800"
  },
  noteText: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 2,
    textAlign: "left"
  },
  button: {
    borderRadius: 14,
    marginTop: 4,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonGradient: {
    minHeight: 48,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15
  },
  buttonPill: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  buttonPillText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: "800"
  }
});
