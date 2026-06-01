import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable, 
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../../constants/colors";

export default function AiInsightSheet({
  visible,
  onClose,
  selectedMonth,
  selectedYear,
  availableMonths = [],
  goToPrevMonth,
  goToNextMonth,
  canGoPrev,
  canGoNext,
  result,
  loading,
  error,
  isIdle,
  isPremium,
  onAnalyze,
  onRetry,
  onConfirm,
}) {
  const monthLabel = useMemo(() => {
    const selected = (availableMonths || []).find(
      (m) => m.month === selectedMonth && m.year === selectedYear
    );
    return selected ? selected.label : `Thang ${selectedMonth}/${selectedYear}`;
  }, [availableMonths, selectedMonth, selectedYear]);

  const categories = result?.categories || [];
  const anomalies = result?.anomalies || [];
  const topRiskCategory = result?.topRiskCategory;
  const hasData = !!result;

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerIcon}>✨</Text>
              <Text style={styles.headerTitle}>AI Insight</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <Text style={styles.closeBtnText}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* Month Picker */}
            <View style={styles.monthRow}>
              <Pressable onPress={goToPrevMonth} disabled={!canGoPrev || loading} style={[styles.arrow, (!canGoPrev || loading) && styles.arrowOff]}>
                <Text style={styles.arrowText}>‹</Text>
              </Pressable>
              <Text style={styles.monthLabel}>{monthLabel}</Text>
              <Pressable onPress={goToNextMonth} disabled={!canGoNext || loading} style={[styles.arrow, (!canGoNext || loading) && styles.arrowOff]}>
                <Text style={styles.arrowText}>›</Text>
              </Pressable>
            </View>

            {/* Idle */}
            {isPremium && isIdle && (
              <Text style={styles.idleText}>
                AI sẽ dùng dữ liệu các tháng trước để dự báo hành vi tài chính cho {monthLabel}.
              </Text>
            )}

            {/* Not Premium */}
            {!isPremium && (
              <View style={styles.stateBox}>
                <Text style={styles.stateIcon}>🔒</Text>
                <Text style={styles.stateText}>Tính năng AI Insight cần gói Premium.</Text>
              </View>
            )}

            {/* Analyze Button */}
            {isPremium && !hasData && !loading && (
              <Pressable style={styles.analyzeBtn} onPress={onAnalyze}>
                <Text style={styles.analyzeBtnText}>✨ Phân tích</Text>
              </Pressable>
            )}

            {/* Loading */}
            {loading && (
              <View style={styles.stateBox}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={styles.stateText}>Đang phân tích...</Text>
              </View>
            )}

            {/* Error */}
            {!loading && error && (
              <View style={styles.stateBox}>
                <Text style={styles.stateIcon}>⚠</Text>
                <Text style={styles.stateText}>{error}</Text>
                <Pressable style={styles.retryBtn} onPress={onRetry}>
                  <Text style={styles.retryBtnText}>Thu lai</Text>
                </Pressable>
              </View>
            )}

            {/* Results */}
            {hasData && !loading && !error && (
              <View style={styles.results}>
                <Text style={styles.kicker}>
                  Du bao thang {result.month}/{result.year}
                </Text>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tong chi tieu du kien</Text>
                  <Text style={styles.totalValue}>{fmt(result.totalPredictedExpense)}</Text>
                </View>

                {topRiskCategory && (
                  <View style={styles.riskRow}>
                    <Text style={styles.riskIcon}>⚠</Text>
                    <View style={styles.riskBody}>
                      <Text style={styles.riskLabel}>Danh muc co nguy co tang manh</Text>
                      <Text style={styles.riskName}>{topRiskCategory.categoryName}</Text>
                      <Text style={styles.riskDetail}>
                        Du kien: {fmt(topRiskCategory.predictedAmount)} · {trendText(topRiskCategory.trend)}
                      </Text>
                    </View>
                  </View>
                )}

                {anomalies.length > 0 && (
                  <View style={styles.anomalyRow}>
                    <Text style={styles.anomalyIcon}>🚨</Text>
                    <Text style={styles.anomalyText}>
                      Phat hien {anomalies.length} giao dich bat thuong
                    </Text>
                  </View>
                )}

                {categories.length > 0 && (
                  <View style={styles.catSection}>
                    <Text style={styles.sectionTitle}>Du bao theo danh muc</Text>
                    {categories.slice(0, 6).map((c, i) => (
                      <View key={c.categoryId || i} style={styles.catRow}>
                        <View style={[styles.dot, { backgroundColor: trendColor(c.trend) }]} />
                        <Text style={styles.catName}>{c.categoryName}</Text>
                        <Text style={styles.catAmount}>{fmt(c.predictedAmount)}</Text>
                      </View>
                    ))}
                  </View>
                )}

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
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function fmt(v) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(v || 0));
  } catch {
    return `${v || 0} VND`;
  }
}

function trendText(t) {
  if (t === "UP") return "🔺 Tang";
  if (t === "DOWN") return "🔻 Giam";
  return "➖ On dinh";
}

function trendColor(t) {
  if (t === "UP") return COLORS.EXPENSE;
  if (t === "DOWN") return COLORS.INCOME;
  return COLORS.INFO;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.OVERLAY },
  sheet: { backgroundColor: COLORS.CARD, borderRadius: 20, maxHeight: "82%", width: "90%", paddingBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.CARD_BORDER },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIcon: { fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: COLORS.TEXT },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.BG, alignItems: "center", justifyContent: "center" },
  closeBtnText: { fontSize: 18, fontWeight: "700", color: COLORS.TEXT_SECONDARY },
  body: { flexShrink: 1 },
  bodyContent: { padding: 14, gap: 12 },

  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  arrow: { paddingHorizontal: 10, paddingVertical: 6 },
  arrowOff: { opacity: 0.3 },
  arrowText: { fontSize: 22, fontWeight: "700", color: COLORS.PRIMARY },
  monthLabel: { fontSize: 15, fontWeight: "800", color: COLORS.TEXT, minWidth: 120, textAlign: "center" },

  idleText: { fontSize: 13, color: COLORS.TEXT_SECONDARY, textAlign: "center", lineHeight: 20 },

  analyzeBtn: { backgroundColor: COLORS.PRIMARY, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  analyzeBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800" },

  stateBox: { alignItems: "center", paddingVertical: 20, backgroundColor: COLORS.BG, borderRadius: 12, borderWidth: 1, borderColor: COLORS.CARD_BORDER, gap: 8 },
  stateIcon: { fontSize: 26 },
  stateText: { color: COLORS.TEXT_SECONDARY, fontSize: 13, textAlign: "center", paddingHorizontal: 12 },

  retryBtn: { marginTop: 4, backgroundColor: COLORS.ROSE_MIST, paddingHorizontal: 18, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: COLORS.CARD_BORDER },
  retryBtnText: { color: COLORS.PRIMARY, fontSize: 13, fontWeight: "700" },

  results: { gap: 10 },
  kicker: { fontSize: 13, fontWeight: "700", color: COLORS.PRIMARY, textAlign: "center" },

  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.BG, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.CARD_BORDER },
  totalLabel: { fontSize: 13, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  totalValue: { fontSize: 17, fontWeight: "800", color: COLORS.EXPENSE },

  riskRow: { flexDirection: "row", backgroundColor: "#FFF8E1", borderRadius: 10, padding: 10, gap: 8, borderWidth: 1, borderColor: "#FFE082" },
  riskIcon: { fontSize: 16, marginTop: 1 },
  riskBody: { flex: 1 },
  riskLabel: { fontSize: 11, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  riskName: { fontSize: 14, fontWeight: "800", color: COLORS.TEXT, marginTop: 2 },
  riskDetail: { fontSize: 11, color: COLORS.TEXT_MUTED, marginTop: 2 },

  anomalyRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFEBEE", borderRadius: 10, padding: 10, gap: 8, borderWidth: 1, borderColor: "#FFCDD2" },
  anomalyIcon: { fontSize: 14 },
  anomalyText: { flex: 1, fontSize: 12, color: COLORS.EXPENSE, fontWeight: "600" },

  catSection: { backgroundColor: COLORS.BG, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.CARD_BORDER },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.TEXT, marginBottom: 8 },
  catRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.CARD_BORDER, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  catName: { flex: 1, fontSize: 13, color: COLORS.TEXT, fontWeight: "600" },
  catAmount: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT },

  narrativeBox: { backgroundColor: COLORS.BG, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.CARD_BORDER },
  narrativeTitle: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT, marginBottom: 6 },
  narrativeText: { fontSize: 13, color: COLORS.TEXT_SECONDARY, lineHeight: 20 },

  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 44, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  reBtn: { backgroundColor: COLORS.BG, borderColor: COLORS.CARD_BORDER },
  reBtnText: { fontSize: 13, color: COLORS.PRIMARY, fontWeight: "700" },
  confirmBtn: { backgroundColor: COLORS.ROSE_MIST, borderColor: COLORS.CARD_BORDER },
  confirmBtnText: { fontSize: 13, color: COLORS.PRIMARY, fontWeight: "700" },
});
