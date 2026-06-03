import React, { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import AiInsightForecastResult from "./AiInsightForecastResult";
import AiInsightMonthNavigator from "./AiInsightMonthNavigator";
import AiInsightStateBlock from "./AiInsightStateBlock";

export default function AiInsightSheet({
  availableMonths = [],
  canGoNext,
  canGoPrev,
  error,
  goToNextMonth,
  goToPrevMonth,
  isIdle,
  isPremium,
  loading,
  onAnalyze,
  onClose,
  onConfirm,
  onRetry,
  result,
  selectedMonth,
  selectedYear,
  visible
}) {
  const monthLabel = useMemo(() => {
    const selected = (availableMonths || []).find(
      (month) => month.month === selectedMonth && month.year === selectedYear
    );
    return selected ? selected.label : `Tháng ${selectedMonth}/${selectedYear}`;
  }, [availableMonths, selectedMonth, selectedYear]);

  const hasData = Boolean(result);

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
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
            <AiInsightMonthNavigator
              canGoNext={canGoNext}
              canGoPrev={canGoPrev}
              disabled={loading}
              goToNextMonth={goToNextMonth}
              goToPrevMonth={goToPrevMonth}
              monthLabel={monthLabel}
            />

            {isPremium && isIdle ? (
              <Text style={styles.idleText}>
                AI sẽ dùng dữ liệu các tháng trước để dự báo hành vi tài chính cho {monthLabel}.
              </Text>
            ) : null}

            {!isPremium ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateIcon}>🔒</Text>
                <Text style={styles.stateText}>Tính năng AI Insight cần gói Premium.</Text>
              </View>
            ) : null}

            {isPremium && !hasData && !loading ? (
              <Pressable style={styles.analyzeBtn} onPress={onAnalyze}>
                <Text style={styles.analyzeBtnText}>✨ Phân tích</Text>
              </Pressable>
            ) : null}

            <AiInsightStateBlock error={error} loading={loading} onRetry={onRetry} />

            {hasData && !loading && !error ? (
              <AiInsightForecastResult
                onClose={onClose}
                onConfirm={onConfirm}
                onRetry={onRetry}
                result={result}
              />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.OVERLAY
  },
  sheet: {
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    maxHeight: "82%",
    width: "90%",
    paddingBottom: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerIcon: {
    fontSize: 18
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.BG,
    alignItems: "center",
    justifyContent: "center"
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY
  },
  body: {
    flexShrink: 1
  },
  bodyContent: {
    padding: 14,
    gap: 12
  },
  idleText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 20
  },
  analyzeBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center"
  },
  analyzeBtnText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: "800"
  },
  stateBox: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    gap: 8
  },
  stateIcon: {
    fontSize: 26
  },
  stateText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 12
  }
});
