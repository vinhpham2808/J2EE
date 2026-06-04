import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, useAppColors } from "../../constants/colors";
import { getSafeAreaContentStyle } from "../../utils/safeArea";
import useMonthlyReport from "../../hooks/useMonthlyReport";
import MonthNavigator from "../../components/Report/MonthNavigator";
import ReportMetricCard from "../../components/Report/ReportMetricCard";
import CategoryBreakdownCard from "../../components/Report/CategoryBreakdownCard";
import ReportAdviceCard from "../../components/Report/ReportAdviceCard";
import BudgetGoalProgressCard from "../../components/Report/BudgetGoalProgressCard";

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const {
    selectedMonth,
    selectedYear,
    report,
    loading,
    error,
    goToPrevMonth,
    goToNextMonth,
  } = useMonthlyReport();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.BG }]}
      contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}
      showsVerticalScrollIndicator={false}
    >
      <MonthNavigator
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT_SECONDARY }]}>Đang lập báo cáo chi tiết...</Text>
        </View>
      ) : error || !report ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[styles.errorText, { color: colors.TEXT_SECONDARY }]}> 
            {error || "Chưa có dữ liệu giao dịch trong tháng này để tạo báo cáo."}
          </Text>
        </View>
      ) : (
        <View style={styles.reportContainer}>
          <ReportMetricCard report={report} />
          <CategoryBreakdownCard categories={report.categoryBreakdown} />
          <ReportAdviceCard
            strengths={report.strengths}
            improvements={report.improvements}
          />
          <BudgetGoalProgressCard
            budgetsOnTrack={report.budgetsOnTrack}
            totalBudgets={report.totalBudgets}
            completedGoalsThisMonth={report.completedGoalsThisMonth}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  reportContainer: {
    gap: 16,
  },
});
