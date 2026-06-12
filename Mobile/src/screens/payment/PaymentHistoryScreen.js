import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PaymentHistorySection from "../../components/Payment/PaymentHistorySection";
import ScreenBackHeader from "../../components/common/ScreenBackHeader";
import { API_ENDPOINTS } from "../../constants/api";
import { useAppColors } from "../../constants/colors";
import apiClient from "../../services/apiClient";
import { getApiErrorMessage } from "../../utils/format";
import { getSafeAreaContentStyle } from "../../utils/safeArea";

async function fetchPaymentHistory() {
  const response = await apiClient.get(API_ENDPOINTS.GET_PAYMENTS);
  return Array.isArray(response.data) ? response.data : [];
}

async function deletePayment(orderCode) {
  const response = await apiClient.delete(API_ENDPOINTS.DELETE_PAYMENT(orderCode));
  return response.data;
}

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingCode, setDeletingCode] = useState("");

  const loadPaymentHistory = useCallback(async ({ refreshing: isRefreshing = false } = {}) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const history = await fetchPaymentHistory();
      setPayments(history);
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được lịch sử thanh toán."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadPaymentHistory();
  }, [loadPaymentHistory]));

  const handleRefresh = useCallback(() => {
    loadPaymentHistory({ refreshing: true });
  }, [loadPaymentHistory]);

  const handleDeletePayment = useCallback((orderCode) => {
    if (!orderCode) return;

    Alert.alert("Xóa hóa đơn?", "Hóa đơn này sẽ được xóa khỏi lịch sử thanh toán của bạn.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          setDeletingCode(String(orderCode));
          try {
            await deletePayment(orderCode);
            setPayments((currentPayments) => currentPayments.filter((payment) => (
              String(payment?.orderCode) !== String(orderCode)
            )));
          } catch (error) {
            Alert.alert("Xóa thất bại", getApiErrorMessage(error, "Không thể xóa hóa đơn này."));
          } finally {
            setDeletingCode("");
          }
        }
      }
    ]);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.BG }]}
      contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenBackHeader title="Lịch sử thanh toán" />
      <PaymentHistorySection
        deletingCode={deletingCode}
        loading={loading}
        onDelete={handleDeletePayment}
        onRefresh={handleRefresh}
        payments={payments}
        refreshing={refreshing}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 100
  }
});
