import React, { useContext, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../contexts/AuthContext";
import { API_ENDPOINTS } from "../../constants/api";
import apiClient from "../../services/apiClient";
import { formatMoney, getApiErrorMessage } from "../../utils/format";
import { COLORS, useAppColors } from "../../constants/colors";
import { getSafeAreaContentStyle } from "../../utils/safeArea";

const PAYMENT_STATUS_LABELS = {
  PAID: "Đã thanh toán thành công",
  PENDING: "Đang chờ thanh toán",
  PROCESSING: "Đang xử lý",
  FAILED: "Thanh toán thất bại",
  CANCELLED: "Đã hủy",
  EXPIRED: "Đã hết hạn",
  UNDERPAID: "Thanh toán chưa đủ"
};

export default function PaymentResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const { refreshUser } = useContext(AuthContext);

  const result = String(route.params?.result || "").toLowerCase();
  const orderCode = route.params?.orderCode ? String(route.params.orderCode) : "";
  const returnedStatus = String(route.params?.status || "").toUpperCase();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  const displayStatus = useMemo(() => {
    if (returnedStatus === "PAID") {
      return "PAID";
    }
    if (payment?.status) {
      return String(payment.status).toUpperCase();
    }
    if (result === "cancel") {
      return "CANCELLED";
    }
    return "PENDING";
  }, [payment?.status, result, returnedStatus]);

  useEffect(() => {
    let active = true;

    const syncPaymentStatus = async () => {
      if (!orderCode) {
        return;
      }

      try {
        const response = await apiClient.get(API_ENDPOINTS.SYNC_PAYMENT_STATUS(orderCode));
        if (!active) {
          return;
        }

        const nextPayment = response.data || null;
        setPayment(nextPayment);

        const nextStatus = String(nextPayment?.status || returnedStatus || "").toUpperCase();
        if (nextStatus === "PAID") {
          await refreshUser();
        }
      } catch (syncError) {
        if (active) {
          setError(getApiErrorMessage(syncError, "Không thể đồng bộ trạng thái thanh toán."));
        }
      }
    };

    syncPaymentStatus();

    return () => {
      active = false;
    };
  }, [orderCode, refreshUser, returnedStatus]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.BG }]} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}>
      <View style={[styles.statusCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
        <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Trạng thái hiện tại</Text>
        <Text style={[styles.statusValue, { color: displayStatus === "PAID" ? colors.INCOME : colors.TEXT }]}> 
          {PAYMENT_STATUS_LABELS[displayStatus] || displayStatus}
        </Text>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.TEXT_SECONDARY }]}>Mã đơn hàng</Text>
          <Text style={[styles.detailValue, { color: colors.TEXT }]}>{orderCode || "--"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.TEXT_SECONDARY }]}>Số tiền</Text>
          <Text style={[styles.detailValue, { color: colors.PRIMARY }]}>{payment?.amount ? formatMoney(payment.amount) : "--"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.TEXT_SECONDARY }]}>Gói dịch vụ</Text>
          <Text style={[styles.detailValue, { color: colors.TEXT }]}>{payment?.planName || "--"}</Text>
        </View>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.EXPENSE_LIGHT, borderColor: colors.EXPENSE }]}> 
          <Text style={[styles.errorText, { color: colors.EXPENSE }]}>{error}</Text>
        </View>
      ) : null}

      <Pressable style={styles.homeButton} onPress={() => navigation.navigate("HomeTab")}>
        <Text style={styles.homeButtonText}>Về trang chủ</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  content: {
    padding: 16,
    gap: 14
  },
  statusCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    gap: 12
  },
  sectionTitle: {
    color: COLORS.TEXT,
    fontWeight: "600"
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "700"
  },
  statusPaid: {
    color: COLORS.INCOME
  },
  statusNormal: {
    color: COLORS.TEXT
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  detailLabel: {
    color: COLORS.TEXT_SECONDARY
  },
  detailValue: {
    flex: 1,
    textAlign: "right",
    color: COLORS.TEXT,
    fontWeight: "600"
  },
  errorBox: {
    backgroundColor: COLORS.EXPENSE_LIGHT,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 14,
    padding: 14
  },
  errorText: {
    color: COLORS.EXPENSE
  },
  homeButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center"
  },
  homeButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700"
  }
});
