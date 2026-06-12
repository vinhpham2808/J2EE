import React from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatMoney } from "../../utils/format";
import VoiceInputButton from "../common/VoiceInputButton";

const ALL_EXPENSE_FILTER = "all";
const MIC_ICON = require("../../assets/accessories/mic.png");
const CAMERA_ICON = require("../../assets/accessories/camera.png");

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
  const colors = useAppColors();

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER, shadowColor: colors.TEXT }]}>
      <View style={styles.summaryContent}>
        <Text style={[styles.summaryLabel, { color: colors.TEXT_SECONDARY }]}>Tổng chi tiêu</Text>
        <Text style={[styles.summaryAmount, { color: colors.EXPENSE }]}>{formatMoney(totalExpense)}</Text>
        <Text style={[styles.summaryHint, { color: colors.TEXT_SECONDARY }]}>{expenseCount} giao dịch</Text>
      </View>

      <View style={styles.actionRowMain}>
        <Pressable style={[styles.addButtonMain, { backgroundColor: colors.PRIMARY, shadowColor: colors.PRIMARY }]} onPress={onAddExpense}>
          <Text style={styles.addButtonText}>+ Thêm chi tiêu</Text>
        </Pressable>
        <VoiceInputButton iconSource={MIC_ICON} noBackground onResult={onVoiceResult} />
        <Pressable
          style={[styles.scanButton, { backgroundColor: colors.CARD }, isScanning && { opacity: 0.6 }]}
          onPress={onScanReceipt}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color={colors.PRIMARY} size="small" />
          ) : (
            <Image source={CAMERA_ICON} style={styles.scanButtonIcon} resizeMode="contain" />
          )}
        </Pressable>
      </View>

      {!isPremium && (
        <Text style={[styles.premiumHint, { color: colors.TEXT_MUTED }]}>🔒 Quét hóa đơn là tính năng Premium</Text>
      )}

      <Pressable
        style={[styles.exportButton, { backgroundColor: colors.BG, borderColor: colors.PRIMARY_LIGHT }, isExporting && { opacity: 0.7 }]}
        onPress={onExport}
        disabled={isExporting}
      >
        <Text style={[styles.exportText, { color: colors.PRIMARY }]}>
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
    alignItems: "center"
  },
  scanButtonIcon: {
    width: 24,
    height: 24
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
