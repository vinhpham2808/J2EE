import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { formatInsightMoney, getTrendColor, getTrendText } from "./aiInsightFormatters";

export default function AiInsightForecastResult({ onClose, onConfirm, onRetry, result }) {
  const categories = result?.categories || [];
  const anomalies = result?.anomalies || [];
  const topRiskCategory = result?.topRiskCategory;

  if (!result) {
    return null;
  }

  return (
    <View style={styles.results}>
      <Text style={styles.kicker}>
        Dự báo tháng {result.month}/{result.year}
      </Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng chi tiêu dự kiến</Text>
        <Text style={styles.totalValue}>{formatInsightMoney(result.totalPredictedExpense)}</Text>
      </View>

      {topRiskCategory ? (
        <View style={styles.riskRow}>
          <Text style={styles.riskIcon}>⚠</Text>
          <View style={styles.riskBody}>
            <Text style={styles.riskLabel}>Danh mục có nguy cơ tăng mạnh</Text>
            <Text style={styles.riskName}>{topRiskCategory.categoryName}</Text>
            <Text style={styles.riskDetail}>
              Dự kiến: {formatInsightMoney(topRiskCategory.predictedAmount)} · {getTrendText(topRiskCategory.trend)}
            </Text>
          </View>
        </View>
      ) : null}

      {anomalies.length > 0 ? (
        <View style={styles.anomalyRow}>
          <Text style={styles.anomalyIcon}>🚨</Text>
          <Text style={styles.anomalyText}>Phát hiện {anomalies.length} giao dịch bất thường</Text>
        </View>
      ) : null}

      {categories.length > 0 ? (
        <View style={styles.catSection}>
          <Text style={styles.sectionTitle}>Dự báo theo danh mục</Text>
          {categories.slice(0, 6).map((category, index) => (
            <View key={category.categoryId || index} style={styles.catRow}>
              <View style={[styles.dot, { backgroundColor: getTrendColor(category.trend) }]} />
              <Text style={styles.catName}>{category.categoryName}</Text>
              <Text style={styles.catAmount}>{formatInsightMoney(category.predictedAmount)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {result.narrative ? (
        <View style={styles.narrativeBox}>
          <Text style={styles.narrativeTitle}>🤖 Phân tích AI</Text>
          <Text style={styles.narrativeText}>{result.narrative}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable style={[styles.actionBtn, styles.reBtn]} onPress={onRetry}>
          <Text style={styles.reBtnText}>Phân tích lại</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.confirmBtn]} onPress={onConfirm || onClose}>
          <Text style={styles.confirmBtnText}>Xác nhận</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  results: {
    gap: 10
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    textAlign: "center"
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  totalLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600"
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.EXPENSE
  },
  riskRow: {
    flexDirection: "row",
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFE082"
  },
  riskIcon: {
    fontSize: 16,
    marginTop: 1
  },
  riskBody: {
    flex: 1
  },
  riskLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600"
  },
  riskName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginTop: 2
  },
  riskDetail: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 2
  },
  anomalyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2"
  },
  anomalyIcon: {
    fontSize: 14
  },
  anomalyText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.EXPENSE,
    fontWeight: "600"
  },
  catSection: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 8
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  catName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT,
    fontWeight: "600"
  },
  catAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT
  },
  narrativeBox: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  narrativeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT,
    marginBottom: 6
  },
  narrativeText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20
  },
  actionRow: {
    flexDirection: "row",
    gap: 10
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  reBtn: {
    backgroundColor: COLORS.BG,
    borderColor: COLORS.CARD_BORDER
  },
  reBtnText: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: "700"
  },
  confirmBtn: {
    backgroundColor: COLORS.ROSE_MIST,
    borderColor: COLORS.CARD_BORDER
  },
  confirmBtnText: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: "700"
  }
});
