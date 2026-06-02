import React, { useContext, useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../components/AuthContext";
import { COLORS } from "../constants/colors";
import {
  TREND_CONFIG,
  CATEGORY_COLORS,
  barChartConfig,
  lineChartConfig,
} from "../constants/forecastConfig";
import { formatMoney, formatDate } from "../utils/format";
import { getSafeAreaContentStyle } from "../utils/safeAreaSpacing";
import useForecastData from "../hooks/useForecastData";
import ForecastPaywall from "../components/Forecast/ForecastPaywall";
import ForecastSummaryCard from "../components/Forecast/ForecastSummaryCard";
import ForecastAnomalyCard from "../components/Forecast/ForecastAnomalyCard";
import ForecastEmptyState from "../components/Forecast/ForecastEmptyState";

// ─── Main Screen ─────────────────────────────────────────────

export default function ForecastScreen() {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(screenWidth - 48, 300);

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

  // ── Paywall ────────────────────────────────────────────────
  if (!isPremium) {
    return <ForecastPaywall />;
  }

  // ── Main Forecast UI ───────────────────────────────────────
  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.monthPickerRow}>
          <Pressable
            style={({ pressed }) => [styles.monthPicker, pressed && styles.monthPickerPressed]}
            onPress={() => setIsMonthPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Chọn tháng dự báo"
          >
            <Text style={styles.monthPickerIcon}>{"\uD83D\uDCC5"}</Text>
            <Text style={styles.monthLabel}>{monthPickerLabel}</Text>
          </Pressable>
          <Text style={styles.monthHint}>{monthPickerHint}</Text>
        </View>

        {/* Loading */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Đang tải dữ liệu dự báo...</Text>
          </View>
        ) : (
          <>
            {/* Summary Cards Row */}
            <View style={styles.summaryRow}>
              <ForecastSummaryCard
                icon="💰"
                label="Dự báo tổng"
                value={formatMoney(totalPredicted)}
                accent={COLORS.EXPENSE}
              />
              <ForecastSummaryCard
                icon={topCategory ? TREND_CONFIG[topCategory.trend]?.icon || "📊" : "📊"}
                label="Tăng mạnh nhất"
                value={topCategory ? topCategory.categoryName : "—"}
                sub={topCategory ? formatMoney(topCategory.predictedAmount) : ""}
                accent={COLORS.WARNING}
              />
              <ForecastSummaryCard
                icon="🚨"
                label="Bất thường"
                value={`${anomalies.length}`}
                accent={anomalies.length > 0 ? COLORS.EXPENSE : COLORS.TEXT_MUTED}
              />
            </View>

            {/* Forecast BarChart */}
            {categories.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Dự báo vs Trung bình lịch sử</Text>
                <View style={styles.chartCard}>
                  <BarChart
                    data={barChartData}
                    width={chartWidth}
                    height={220}
                    chartConfig={barChartConfig}
                    style={styles.chart}
                    fromZero
                    showValuesOnTopOfBars
                    yAxisLabel=""
                    yAxisSuffix="đ"
                  />
                  {/* Legend */}
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: COLORS.PRIMARY }]} />
                      <Text style={styles.legendText}>Dự báo</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: COLORS.INFO }]} />
                      <Text style={styles.legendText}>Trung bình lịch sử</Text>
                    </View>
                  </View>
                </View>

                {/* Category Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                  contentContainerStyle={styles.chipContent}
                >
                  {categories.map((cat, idx) => {
                    const isSelected = cat.categoryId === selectedCategoryId;
                    const accent = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                    const trend = TREND_CONFIG[cat.trend] || TREND_CONFIG.STABLE;
                    return (
                      <Pressable
                        key={cat.categoryId}
                        style={[
                          styles.chip,
                          isSelected && { borderColor: accent, borderWidth: 2 },
                        ]}
                        onPress={() => setSelectedCategoryId(cat.categoryId)}
                      >
                        <Text style={styles.chipIcon}>{trend.icon}</Text>
                        <Text style={[styles.chipLabel, isSelected && { fontWeight: "800" }]}>
                          {cat.categoryName}
                        </Text>
                        <Text style={[styles.chipAmount, { color: trend.color }]}>
                          {formatMoney(cat.predictedAmount)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <ForecastEmptyState message="Chưa có dữ liệu dự báo cho tháng này" />
            )}

            {/* Category Trend LineChart */}
            {selectedCategory && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📈 Xu hướng: {selectedCategory.categoryName}
                </Text>
                {isTrendLoading ? (
                  <View style={styles.trendLoadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                  </View>
                ) : lineChartData ? (
                  <View style={styles.chartCard}>
                    <LineChart
                      data={lineChartData}
                      width={chartWidth}
                      height={220}
                      chartConfig={lineChartConfig}
                      style={styles.chart}
                      bezier
                      fromZero
                      yAxisLabel=""
                      yAxisSuffix="đ"
                    />
                    <Text style={styles.trendNote}>
                      Đường biểu diễn: chi tiêu thực tế 6 tháng gần nhất
                    </Text>
                  </View>
                ) : (
                  <ForecastEmptyState message="Chưa đủ dữ liệu xu hướng cho danh mục này" />
                )}
              </View>
            )}

            {/* Anomalies */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🚨 Cảnh báo tham khảo tháng {selectedMonth}/{selectedYear}
              </Text>
              {anomalies.length > 0 ? (
                <View style={styles.anomalyList}>
                  {anomalies.map((a) => (
                    <ForecastAnomalyCard key={a.transactionId} item={a} />
                  ))}
                </View>
              ) : (
                <ForecastEmptyState message="Không phát hiện giao dịch bất thường trong tháng này" />
              )}
            </View>

            {/* AI Insight */}
            {currentInsight?.narrative ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🤖 Phân tích AI</Text>
                <View style={styles.insightCard}>
                  <Text style={styles.insightText}>{currentInsight.narrative}</Text>
                  {currentInsight.generatedAt ? (
                    <Text style={styles.insightTime}>
                      {formatDate(currentInsight.generatedAt)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : insightError ? (
              <View style={styles.section}>
                <View style={styles.insightFallback}>
                  <Text style={styles.insightFallbackText}>
                    ⚠️ Không thể tạo phân tích AI lúc này. Vui lòng thử lại sau.
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal
        transparent
        visible={isMonthPickerVisible}
        animationType="fade"
        onRequestClose={() => setIsMonthPickerVisible(false)}
      >
        <View style={styles.monthModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsMonthPickerVisible(false)} />
          <View style={styles.monthModalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {monthOptions.map((option) => {
                const active = option.month === selectedMonth && option.year === selectedYear;
                return (
                  <Pressable
                    key={`${option.year}-${option.month}`}
                    style={[styles.monthOption, active && styles.monthOptionActive]}
                    onPress={() => selectMonth(option.month, option.year)}
                  >
                    <Text style={[styles.monthOptionText, active && styles.monthOptionTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────

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


  monthPickerRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  monthPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT,
    width: "62%",
    minWidth: 150,
    maxWidth: 180,
    height: 40,
    paddingHorizontal: 16,
  },
  monthPickerPressed: {
    opacity: 0.78,
  },
  monthPickerIcon: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    marginRight: 8,
    textAlign: "center",
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    textAlign: "center",
  },
  monthHint: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
  },
  monthModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  monthModalCard: {
    width: "100%",
    maxWidth: 340,
    maxHeight: "72%",
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingVertical: 8,
  },
  monthOption: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
  },
  monthOptionActive: {
    backgroundColor: COLORS.ROSE_MIST,
  },
  monthOptionText: {
    color: COLORS.TEXT,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  monthOptionTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "900",
  },

  // Loading
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

  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 10,
  },

  // Chart Card
  chartCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  chart: {
    borderRadius: 12,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600",
  },

  // Trend Note
  trendNote: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 6,
    textAlign: "center",
  },
  trendLoadingWrap: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },

  // Category Chips
  chipScroll: {
    marginTop: 12,
  },
  chipContent: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT,
  },
  chipAmount: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Anomalies
  anomalyList: {
    gap: 8,
  },

  // AI Insight
  insightCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT,
    padding: 14,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.TEXT,
    lineHeight: 21,
  },
  insightTime: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 8,
    textAlign: "right",
  },
  insightFallback: {
    backgroundColor: COLORS.WARNING_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.WARNING,
    padding: 12,
  },
  insightFallbackText: {
    fontSize: 13,
    color: COLORS.TEXT,
    lineHeight: 19,
  },
});
