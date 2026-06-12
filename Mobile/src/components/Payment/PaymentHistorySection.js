import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import AppIcon from "../ui/AppIcon";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatMoney } from "../../utils/format";
import { formatPaymentDate, getPaymentStatusMeta } from "../../utils/paymentStatus";

function getToneColors(colors, tone) {
  switch (tone) {
    case "success":
      return { backgroundColor: colors.INCOME_LIGHT, color: colors.INCOME };
    case "warning":
      return { backgroundColor: colors.WARNING_LIGHT, color: colors.WARNING };
    case "danger":
      return { backgroundColor: colors.EXPENSE_LIGHT, color: colors.EXPENSE };
    case "info":
      return { backgroundColor: colors.INFO_LIGHT, color: colors.INFO };
    case "muted":
    default:
      return { backgroundColor: colors.BG, color: colors.TEXT_SECONDARY };
  }
}

export default function PaymentHistorySection({
  deletingCode,
  loading,
  onDelete,
  onRefresh,
  payments,
  refreshing
}) {
  const colors = useAppColors();

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.TEXT }]}>Lịch sử thanh toán</Text>
          <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>Kiểm tra hóa đơn PayOS gần đây của bạn.</Text>
        </View>
        <Pressable
          style={[styles.refreshButton, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER }]}
          onPress={onRefresh}
          disabled={refreshing || loading}
          accessibilityRole="button"
          accessibilityLabel="Tải lại lịch sử thanh toán"
        >
          {refreshing || loading ? (
            <ActivityIndicator color={colors.PRIMARY} size="small" />
          ) : (
            <AppIcon name="refresh-outline" size={18} color={colors.TEXT} />
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT_SECONDARY }]}>Đang tải lịch sử thanh toán...</Text>
        </View>
      ) : payments.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.CARD_BORDER, backgroundColor: colors.BG }]}>
          <AppIcon name="receipt-outline" size={30} color={colors.TEXT_MUTED} />
          <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>Chưa có hóa đơn thanh toán nào.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {payments.map((payment) => {
            const orderCode = String(payment?.orderCode || "");
            const statusMeta = getPaymentStatusMeta(payment?.status);
            const toneColors = getToneColors(colors, statusMeta.tone);
            const isDeleting = deletingCode === orderCode;

            return (
              <View key={orderCode || payment?.paymentLinkId} style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.receiptIcon, { backgroundColor: colors.BG }]}>
                    <AppIcon name="receipt-outline" size={20} color={colors.PRIMARY} />
                  </View>
                  <View style={styles.cardTitleBlock}>
                    <Text style={[styles.planName, { color: colors.TEXT }]} numberOfLines={1}>
                      {payment?.planName || payment?.description || "Gói dịch vụ"}
                    </Text>
                    <Text style={[styles.receiptLabel, { color: colors.TEXT_SECONDARY }]}>
                      Hóa đơn thanh toán
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: toneColors.backgroundColor }]}>
                    <AppIcon name={statusMeta.icon} size={13} color={toneColors.color} />
                    <Text style={[styles.statusText, { color: toneColors.color }]}>{statusMeta.label}</Text>
                  </View>
                </View>

                <View style={styles.detailGrid}>
                  <View style={[styles.detailItem, { backgroundColor: colors.BG }]}>
                    <Text style={[styles.detailLabel, { color: colors.TEXT_MUTED }]}>Số tiền</Text>
                    <Text style={[styles.detailValue, { color: colors.TEXT }]}>{formatMoney(payment?.amount)}</Text>
                  </View>
                  <View style={[styles.detailItem, { backgroundColor: colors.BG }]}>
                    <Text style={[styles.detailLabel, { color: colors.TEXT_MUTED }]}>Cập nhật</Text>
                    <Text style={[styles.detailValue, { color: colors.TEXT }]}>{formatPaymentDate(payment?.updatedAt || payment?.createdAt)}</Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.deleteButton, { backgroundColor: colors.EXPENSE_LIGHT, opacity: isDeleting ? 0.7 : 1 }]}
                    onPress={() => onDelete(orderCode)}
                    disabled={isDeleting || !orderCode}
                  >
                    {isDeleting ? <ActivityIndicator color={colors.EXPENSE} size="small" /> : <AppIcon name="trash-outline" size={15} color={colors.EXPENSE} />}
                    <Text style={[styles.deleteText, { color: colors.EXPENSE }]}>Xóa</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
    gap: 12
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: 17,
    fontWeight: "800"
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 22,
    gap: 8
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "600"
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 24,
    gap: 8
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "700"
  },
  list: {
    gap: 10
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 2
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  receiptIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  cardTitleBlock: {
    flex: 1
  },
  planName: {
    fontSize: 14,
    fontWeight: "800"
  },
  receiptLabel: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700"
  },
  statusBadge: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800"
  },
  detailGrid: {
    flexDirection: "row",
    gap: 10
  },
  detailItem: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700"
  },
  detailValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800"
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8
  },
  deleteButton: {
    minHeight: 38,
    borderRadius: 12,
    flex: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5
  },
  deleteText: {
    fontSize: 12,
    fontWeight: "800"
  }
});
