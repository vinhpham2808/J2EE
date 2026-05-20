import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList
} from "react-native";
import { COLORS } from "../constants/colors";
import { formatMoney } from "../utils/format";
import { fetchCurrentMonthReport, fetchReportByMonth } from "../services/reportService";

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

function GradeBadge({ grade, label }) {
  const getGradeColor = (g) => {
    switch (g) {
      case "A": return { text: COLORS.INCOME, bg: COLORS.INCOME_LIGHT };
      case "B": return { text: COLORS.INFO, bg: COLORS.INFO_LIGHT };
      case "C": return { text: COLORS.WARNING, bg: COLORS.WARNING_LIGHT };
      case "D": return { text: COLORS.PRIMARY, bg: COLORS.ROSE_MIST };
      case "F":
      default: return { text: COLORS.EXPENSE, bg: COLORS.EXPENSE_LIGHT };
    }
  };

  const colors = getGradeColor(grade);

  return (
    <View style={[styles.gradeCard, { backgroundColor: colors.bg, borderColor: colors.text }]}>
      <Text style={[styles.gradeLetter, { color: colors.text }]}>{grade || "C"}</Text>
      <Text style={[styles.gradeLabel, { color: colors.text }]}>{label || "Khá"}</Text>
    </View>
  );
}

function MetricRow({ label, value, prevValue, type }) {
  const isIncome = type === "income";
  const color = isIncome ? COLORS.INCOME : COLORS.EXPENSE;
  const isSavings = type === "savings";

  return (
    <View style={styles.metricRow}>
      <View style={styles.metricLeft}>
        <Text style={styles.metricLabel}>{label}</Text>
        {prevValue !== undefined && (
          <Text style={styles.prevText}>Tháng trước: {formatMoney(prevValue)}</Text>
        )}
      </View>
      <Text style={[styles.metricValue, { color: isSavings ? COLORS.PRIMARY : color }]}>
        {formatMoney(value)}
      </Text>
    </View>
  );
}

export default function ReportsScreen() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchReportByMonth(selectedYear, selectedMonth);
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.message || "Không thể tải báo cáo tháng.");
      }
    } catch (err) {
      setError("Không có dữ liệu báo cáo cho tháng này.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <Pressable onPress={goToPrevMonth} style={styles.arrowButton}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTHS[selectedMonth - 1]} {selectedYear}
        </Text>
        <Pressable onPress={goToNextMonth} style={styles.arrowButton}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang lập báo cáo chi tiết...</Text>
        </View>
      ) : error || !report ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.errorText}>{error || "Chưa có dữ liệu giao dịch trong tháng này để tạo báo cáo."}</Text>
        </View>
      ) : (
        <View style={styles.reportContainer}>
          {/* Grade Section */}
          <View style={styles.gradeSection}>
            <GradeBadge grade={report.grade} label={report.gradeLabel} />
            <View style={styles.gradeIntro}>
              <Text style={styles.savingsRateText}>
                Tỷ lệ tiết kiệm: {Math.round(report.savingsRate * 100)}%
              </Text>
              <Text style={styles.spendingChangeText}>
                {report.spendingChangePercent > 0
                  ? `Chi tiêu tăng ${Math.round(report.spendingChangePercent)}% so với tháng trước`
                  : report.spendingChangePercent < 0
                    ? `Chi tiêu giảm ${Math.round(Math.abs(report.spendingChangePercent))}% so với tháng trước`
                    : "Mức chi tiêu tương đương tháng trước"}
              </Text>
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Chỉ số tài chính</Text>
            <MetricRow label="Tổng thu nhập" value={report.totalIncome} prevValue={report.prevMonthIncome} type="income" />
            <MetricRow label="Tổng chi tiêu" value={report.totalExpense} prevValue={report.prevMonthExpense} type="expense" />
            <View style={styles.divider} />
            <MetricRow label="Tiết kiệm tích lũy" value={report.savings} prevValue={report.prevMonthSavings} type="savings" />
          </View>

          {/* Category Breakdown */}
          {report.categoryBreakdown && report.categoryBreakdown.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📂 Chi tiêu theo danh mục</Text>
              {report.categoryBreakdown.map((item, idx) => (
                <View key={idx} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryIcon}>{item.icon || "🧾"}</Text>
                      <Text style={styles.categoryName}>{item.name}</Text>
                    </View>
                    <Text style={styles.categoryAmount}>{formatMoney(item.amount)}</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${item.percent}%`, backgroundColor: item.color || COLORS.PRIMARY }]} />
                    <Text style={styles.percentText}>{Math.round(item.percent)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Strengths & Improvements */}
          {((report.strengths && report.strengths.length > 0) || (report.improvements && report.improvements.length > 0)) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💡 Đánh giá & Khuyên nghị</Text>

              {report.strengths && report.strengths.map((str, idx) => (
                <View key={`str-${idx}`} style={styles.tipRow}>
                  <Text style={styles.tipIcon}>🌟</Text>
                  <Text style={styles.tipText}>{str}</Text>
                </View>
              ))}

              {report.improvements && report.improvements.map((imp, idx) => (
                <View key={`imp-${idx}`} style={styles.tipRow}>
                  <Text style={styles.tipIcon}>⚠️</Text>
                  <Text style={styles.tipText}>{imp}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Budgets & Goals */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Tiến độ Ngân sách & Mục tiêu</Text>
            <View style={styles.goalStatusRow}>
              <View style={styles.goalStatusItem}>
                <Text style={styles.goalStatusValue}>{report.budgetsOnTrack} / {report.totalBudgets}</Text>
                <Text style={styles.goalStatusLabel}>Ngân sách an toàn</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.goalStatusItem}>
                <Text style={styles.goalStatusValue}>{report.completedGoalsThisMonth}</Text>
                <Text style={styles.goalStatusLabel}>Mục tiêu hoàn thành</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  arrowButton: {
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  arrowText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.PRIMARY
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    minWidth: 120,
    textAlign: "center"
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  errorText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 20
  },
  reportContainer: {
    gap: 16
  },
  gradeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16
  },
  gradeCard: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center"
  },
  gradeLetter: {
    fontSize: 32,
    fontWeight: "900"
  },
  gradeLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: -2
  },
  gradeIntro: {
    flex: 1
  },
  savingsRateText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT
  },
  spendingChangeText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4
  },
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 14
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8
  },
  metricLeft: {
    flex: 1
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT
  },
  prevText: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 2
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "800"
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.CARD_BORDER,
    marginVertical: 10
  },
  categoryItem: {
    marginBottom: 12
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  categoryIcon: {
    fontSize: 16
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    flex: 1
  },
  percentText: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "right"
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginVertical: 6
  },
  tipIcon: {
    fontSize: 16,
    marginTop: 1
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18
  },
  goalStatusRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  goalStatusItem: {
    flex: 1,
    alignItems: "center"
  },
  goalStatusValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.PRIMARY
  },
  goalStatusLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    fontWeight: "600"
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.CARD_BORDER
  }
});
