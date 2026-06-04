import React, { useContext, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../contexts/AuthContext";
import { COLORS, useAppColors } from "../../constants/colors";
import { TREND_CONFIG } from "../../utils/forecast";
import { formatMoney } from "../../utils/format";
import { getSafeAreaContentStyle } from "../../utils/safeArea";
import useForecastData from "../../hooks/useForecastData";
import ForecastPaywall from "../../components/Forecast/ForecastPaywall";
import ForecastSummaryCard from "../../components/Forecast/ForecastSummaryCard";
import ForecastMonthPicker from "../../components/Forecast/ForecastMonthPicker";
import ForecastBarChart from "../../components/Forecast/ForecastBarChart";
import ForecastCategoryChips from "../../components/Forecast/ForecastCategoryChips";
import ForecastTrendChart from "../../components/Forecast/ForecastTrendChart";
import ForecastAnomalySection from "../../components/Forecast/ForecastAnomalySection";
import ForecastAISection from "../../components/Forecast/ForecastAISection";
import ForecastEmptyState from "../../components/Forecast/ForecastEmptyState";

export default function ForecastScreen() {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const { user } = useContext(AuthContext);
  const isPremium = String(user?.subscriptionPlan || "").toUpperCase() === "PREMIUM";

  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const {
    selectedMonth,
    selectedYear,
    isMonthPickerVisible,
    setIsMonthPickerVisible,
    selectedCategoryId,
    setSelectedCategoryId,
    anomalies,
    isLoading,
    isTrendLoading,
    insightError,
    categories,
    totalPredicted,
    topCategory,
    selectedCategory,
    currentInsight,
    monthPickerLabel,
    monthPickerHint,
    monthOptions,
    barChartData,
    lineChartData,
    selectMonth,
  } = useForecastData({ route, isPremium, currentMonth, currentYear });

  if (!isPremium) {
    return <ForecastPaywall />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.BG }]}
      contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}
      showsVerticalScrollIndicator={false}
    >
      <ForecastMonthPicker
        label={monthPickerLabel}
        hint={monthPickerHint}
        visible={isMonthPickerVisible}
        options={monthOptions}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onOpen={() => setIsMonthPickerVisible(true)}
        onSelect={selectMonth}
        onClose={() => setIsMonthPickerVisible(false)}
      />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT_SECONDARY }]}>Đang tải dữ liệu dự báo...</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <ForecastSummaryCard
              icon="💰"
              label="Dự báo tổng"
              value={formatMoney(totalPredicted)}
              accent={colors.EXPENSE}
            />
            <ForecastSummaryCard
              icon={topCategory ? TREND_CONFIG[topCategory.trend]?.icon || "📊" : "📊"}
              label="Tăng mạnh nhất"
              value={topCategory ? topCategory.categoryName : "—"}
              sub={topCategory ? formatMoney(topCategory.predictedAmount) : ""}
              accent={colors.WARNING}
            />
            <ForecastSummaryCard
              icon="🚨"
              label="Bất thường"
              value={`${anomalies.length}`}
              accent={anomalies.length > 0 ? colors.EXPENSE : colors.TEXT_MUTED}
            />
          </View>

          {categories.length > 0 ? (
            <>
              <ForecastBarChart barChartData={barChartData} categories={categories} />
              <ForecastCategoryChips
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
              />
            </>
          ) : (
            <ForecastEmptyState message="Chưa có dữ liệu dự báo cho tháng này" />
          )}

          <ForecastTrendChart
            categoryName={selectedCategory?.categoryName}
            lineChartData={lineChartData}
            isTrendLoading={isTrendLoading}
          />

          <ForecastAnomalySection
            anomalies={anomalies}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />

          <ForecastAISection
            narrative={currentInsight?.narrative}
            generatedAt={currentInsight?.generatedAt}
            hasError={insightError}
          />
        </>
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
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
});
