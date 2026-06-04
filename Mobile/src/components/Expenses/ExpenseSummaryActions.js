import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { formatMoney } from "../../utils/format";
import VoiceInputButton from "../common/VoiceInputButton";

const ALL_EXPENSE_FILTER = "all";

export default function ExpenseSummaryActions({
  expenseCount,
  filterType,
  isExporting,
  isPremium,
  isScanning,
  onAddExpense,
  onExport,
  onScanReceipt,
  onVoiceResult,
  totalExpense
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
        <Text style={styles.summaryAmount}>{formatMoney(totalExpense)}</Text>
        <Text style={styles.summaryHint}>{expenseCount} giao dịch</Text>
      </View>

      <View style={styles.actionRowMain}>
        <Pressable style={styles.addButtonMain} onPress={onAddExpense}>
          <Text style={styles.addButtonText}>+ Thêm chi tiêu</Text>
        </Pressable>
        <VoiceInputButton onResult={onVoiceResult} />
        <Pressable
          style={[styles.scanButton, isScanning && { opacity: 0.6 }]}
          onPress={onScanReceipt}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color={COLORS.PRIMARY} size="small" />
          ) : (
            <Text style={styles.scanButtonIcon}>📷</Text>
          )}
        </Pressable>
      </View>

      {!isPremium && (
        <Text style={styles.premiumHint}>🔒 Quét hóa đơn là tính năng Premium</Text>
      )}

      <Pressable
        style={[styles.exportButton, isExporting && { opacity: 0.7 }]}
        onPress={onExport}
        disabled={isExporting}
      >
        <Text style={styles.exportText}>
          {isExporting
            ? "Đang tạo báo cáo..."
            : filterType === ALL_EXPENSE_FILTER
              ? "Tải báo cáo tất cả tháng"
              : "Tải báo cáo tháng này"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 12,
    shadowColor: COLORS.TEXT,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2
  },
  summaryContent: {
    alignItems: "center"
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "700"
  },
  summaryAmount: {
    marginTop: 4,
    fontSize: 26,
    color: COLORS.EXPENSE,
    fontWeight: "800"
  },
  summaryHint: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY
  },
  actionRowMain: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    alignItems: "center"
  },
  addButtonMain: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 15
  },
  scanButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.CARD,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: `${COLORS.PRIMARY}40`
  },
  scanButtonIcon: {
    fontSize: 20
  },
  premiumHint: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    textAlign: "center",
    marginTop: 6
  },
  exportButton: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT
  },
  exportText: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
    fontSize: 14
  }
});
