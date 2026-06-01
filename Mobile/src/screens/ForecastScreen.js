import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../components/AuthContext";
import { COLORS } from "../constants/colors";
import { formatMoney, formatDate } from "../utils/format";
import { getAiForecastDraft } from "../ai-insight/services/forecastDraftCache";
import { getSafeAreaContentStyle } from "../utils/safeAreaSpacing";
import {
  fetchMonthlyForecast,
  fetchAnomalies,
  fetchCategoryTrend,
  fetchInsights,
} from "../services/forecastService";

// ─── Constants ───────────────────────────────────────────────
const TREND_CONFIG = {
  UP: { label: "Tăng", color: COLORS.EXPENSE, icon: "🔺" },
  DOWN: { label: "Giảm", color: COLORS.INCOME, icon: "🔻" },
  STABLE: { label: "Ổn định", color: COLORS.INFO, icon: "➖" },
};

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const SHORT_MONTHS = [
  "T1", "T2", "T3", "T4", "T5", "T6",
  "T7", "T8", "T9", "T10", "T11", "T12",
];

const CATEGORY_COLORS = [
  COLORS.PRIMARY, COLORS.GOLD, COLORS.INFO, COLORS.INCOME,
  COLORS.EXPENSE, COLORS.WARNING, COLORS.PRIMARY_DARK, COLORS.PRIMARY_LIGHT,
];

// ─── Chart Config ────────────────────────────────────────────
function getRouteForecastMonth(params) {
  const year = Number(params?.year);
  const month = Number(params?.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

function buildForecastFromDraft(draft) {
  return {
    year: draft.year,
    month: draft.month,
    categories: Array.isArray(draft.categories) ? draft.categories : [],
  };
}

function buildInsightFromDraft(draft) {
  if (!draft?.narrative) return null;
  return {
    narrative: draft.narrative,
    generatedAt: draft.generatedAt,
    year: draft.year,
    month: draft.month,
  };
}

const barChartConfig = {
  backgroundColor: COLORS.CARD,
  backgroundGradientFrom: COLORS.CARD,
  backgroundGradientTo: COLORS.CARD,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(232, 89, 122, ${opacity})`,
  labelColor: () => COLORS.TEXT_SECONDARY,
  barPercentage: 0.5,
  propsForLabels: { fontSize: 10 },
  propsForBackgroundLines: {
    strokeDasharray: "4 4",
    stroke: COLORS.CARD_BORDER,
    strokeWidth: 1,
  },
};

const lineChartConfig = {
  backgroundColor: COLORS.CARD,
  backgroundGradientFrom: COLORS.CARD,
  backgroundGradientTo: COLORS.CARD,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(232, 89, 122, ${opacity})`,
  labelColor: () => COLORS.TEXT_SECONDARY,
  propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.PRIMARY },
  propsForLabels: { fontSize: 10 },
  propsForBackgroundLines: {
    strokeDasharray: "4 4",
    stroke: COLORS.CARD_BORDER,
    strokeWidth: 1,
  },
};

// ─── Sub-components ──────────────────────────────────────────

function SummaryCard({ icon, label, value, sub, accent }) {
  return (
    <View style={[styles.summaryCard, accent ? { borderColor: accent, borderWidth: 1.5 } : null]}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, accent ? { color: accent } : null]} numberOfLines={1}>
        {value}
      </Text>
      {sub ? <Text style={styles.summarySub}>{sub}</Text> : null}
    </View>
  );
}

function AnomalyCard({ item }) {
  const amount = Number(item?.amount || 0);
  const meanAmount = Number(item?.meanAmount || 0);
  const deviation = meanAmount > 0
    ? Math.round((amount / meanAmount - 1) * 100)
    : 0;

  return (
    <View style={styles.anomalyCard}>
      <View style={styles.anomalyLeft}>
        <Text style={styles.anomalyIcon}>⚠️</Text>
        <View style={styles.anomalyInfo}>
          <Text style={styles.anomalyCategory}>{item?.categoryName || "Không rõ"}</Text>
          <Text style={styles.anomalyDate}>{formatDate(item?.date)}</Text>
        </View>
      </View>
      <View style={styles.anomalyRight}>
        <Text style={styles.anomalyAmount}>{formatMoney(amount)}</Text>
        <Text style={styles.anomalyDeviation}>
          {deviation > 0 ? `Cao hơn ${deviation}% so với TB` : "Bất thường"}
        </Text>
      </View>
    </View>
  );
}

// ─── Paywall Component ───────────────────────────────────────

function ForecastPaywall() {
  const navigation = useNavigation();
  return (
    <View style={styles.paywallContainer}>
      <Text style={styles.paywallIcon}>🔮</Text>
      <Text style={styles.paywallTitle}>Dự báo & Phát hiện bất thường</Text>
      <Text style={styles.paywallDesc}>
        Dự đoán chi tiêu tháng tới theo danh mục, phát hiện giao dịch bất thường,{'\n'}
        và nhận phân tích AI chuyên sâu về tài chính của bạn.
      </Text>
      <View style={styles.paywallFeatures}>
        <Text style={styles.paywallFeature}>📊 Dự báo chi tiêu theo danh mục</Text>
        <Text style={styles.paywallFeature}>📈 Biểu đồ xu hướng 6 tháng</Text>
        <Text style={styles.paywallFeature}>🚨 Cảnh báo giao dịch bất thường</Text>
        <Text style={styles.paywallFeature}>🤖 Phân tích AI chuyên sâu</Text>
      </View>
      <Pressable
        style={styles.paywallButton}
        onPress={() => navigation.navigate("Payment")}
      >
        <Text style={styles.paywallButtonText}>Nâng cấp lên PREMIUM</Text>
      </Pressable>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────

function EmptyState({ message }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyText}>{message || "Chưa có dữ liệu"}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────

export default function ForecastScreen() {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const isPremium = String(user?.subscriptionPlan || "").toUpperCase() === "PREMIUM";
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(screenWidth - 48, 300);

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  const initialRouteForecast = getRouteForecastMonth(route.params);
  const initialRouteForecastKey = initialRouteForecast
    ? `${initialRouteForecast.year}-${initialRouteForecast.month}-${route.params?.draftSavedAt || ""}`
    : "";
  const [selectedMonth, setSelectedMonth] = useState(initialRouteForecast?.month || currentMonth);
  const [selectedYear, setSelectedYear] = useState(initialRouteForecast?.year || currentYear);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [monthlyForecast, setMonthlyForecast] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [categoryTrend, setCategoryTrend] = useState(null);
  const [insights, setInsights] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [insightError, setInsightError] = useState(false);
  const forecastRequestKeyRef = useRef("");
  const anomalyRequestKeyRef = useRef("");
  const categoryTrendRequestKeyRef = useRef("");
  const insightRequestKeyRef = useRef("");
  const appliedRouteForecastKeyRef = useRef(initialRouteForecastKey);
  const isCurrentMonthSelected =
    selectedMonth === currentMonth && selectedYear === currentYear;
  const routeForecast = useMemo(
    () => getRouteForecastMonth(route.params),
    [route.params?.month, route.params?.year]
  );
  const routeForecastKey = routeForecast
    ? `${routeForecast.year}-${routeForecast.month}-${route.params?.draftSavedAt || ""}`
    : "";

  useEffect(() => {
    if (!routeForecast) return;
    if (appliedRouteForecastKeyRef.current === routeForecastKey) return;

    appliedRouteForecastKeyRef.current = routeForecastKey;
    setSelectedMonth(routeForecast.month);
    setSelectedYear(routeForecast.year);
    setIsMonthPickerVisible(false);
  }, [routeForecast, routeForecastKey]);

  // ── Fetch Monthly Forecast ──────────────────────────────────
  const loadMonthlyForecast = useCallback(async () => {
    if (!isPremium) return;
    const requestKey = `${selectedYear}-${selectedMonth}`;
    forecastRequestKeyRef.current = requestKey;
    insightRequestKeyRef.current = requestKey;
    setIsLoading(true);
    setMonthlyForecast(null);
    setSelectedCategoryId(null);
    setCategoryTrend(null);
    setInsights(null);
    setInsightError(false);

    const draft = getAiForecastDraft(selectedYear, selectedMonth);
    if (draft) {
      const forecast = buildForecastFromDraft(draft);
      setMonthlyForecast(forecast);
      setSelectedCategoryId(forecast.categories.length > 0 ? forecast.categories[0].categoryId : null);
      setInsights(buildInsightFromDraft(draft));
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchMonthlyForecast(selectedYear, selectedMonth);
      if (forecastRequestKeyRef.current !== requestKey) return;
      setMonthlyForecast(data);
      const categories = data?.categories || [];
      setSelectedCategoryId(categories.length > 0 ? categories[0].categoryId : null);
    } catch {
      if (forecastRequestKeyRef.current !== requestKey) return;
      setMonthlyForecast(null);
      setSelectedCategoryId(null);
      setCategoryTrend(null);
    } finally {
      if (forecastRequestKeyRef.current === requestKey) {
        setIsLoading(false);
      }
    }
  }, [selectedYear, selectedMonth, isPremium]);

  // ── Fetch Anomalies ────────────────────────────────────────
  const loadAnomalies = useCallback(async () => {
    if (!isPremium) return;
    const requestKey = `${selectedYear}-${selectedMonth}`;
    anomalyRequestKeyRef.current = requestKey;
    setAnomalies([]);

    const draft = getAiForecastDraft(selectedYear, selectedMonth);
    if (draft) {
      setAnomalies(Array.isArray(draft.anomalies) ? draft.anomalies : []);
      return;
    }

    try {
      const data = await fetchAnomalies(selectedYear, selectedMonth);
      if (anomalyRequestKeyRef.current !== requestKey) return;
      setAnomalies(data);
    } catch {
      if (anomalyRequestKeyRef.current !== requestKey) return;
      setAnomalies([]);
    }
  }, [selectedYear, selectedMonth, isPremium]);

  // ── Fetch Category Trend ───────────────────────────────────
  const loadCategoryTrend = useCallback(async (categoryId) => {
    if (!categoryId || !isPremium) return;
    const requestKey = `${selectedYear}-${selectedMonth}-${categoryId}`;
    categoryTrendRequestKeyRef.current = requestKey;
    setIsTrendLoading(true);
    try {
      const data = await fetchCategoryTrend(categoryId, 6);
      if (categoryTrendRequestKeyRef.current !== requestKey) return;
      setCategoryTrend(data);
    } catch {
      if (categoryTrendRequestKeyRef.current !== requestKey) return;
      setCategoryTrend(null);
    } finally {
      if (categoryTrendRequestKeyRef.current === requestKey) {
        setIsTrendLoading(false);
      }
    }
  }, [isPremium, selectedMonth, selectedYear]);

  // ── Fetch AI Insights ──────────────────────────────────────
  const loadInsights = useCallback(async (forecastData) => {
    if (!forecastData?.categories?.length || !isPremium) return;
    if (forecastData.year === currentYear && forecastData.month === currentMonth) return;

    const forecastKey = `${forecastData.year}-${forecastData.month}`;
    insightRequestKeyRef.current = forecastKey;
    setInsights(null);
    setInsightError(false);
    try {
      const data = await fetchInsights(forecastData);
      if (insightRequestKeyRef.current !== forecastKey) return;
      setInsights({ ...data, year: forecastData.year, month: forecastData.month });
      setInsightError(false);
    } catch {
      if (insightRequestKeyRef.current !== forecastKey) return;
      setInsights(null);
      setInsightError(true);
    }
  }, [currentMonth, currentYear, isPremium]);

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    loadMonthlyForecast();
    loadAnomalies();
  }, [loadMonthlyForecast, loadAnomalies]);

  useEffect(() => {
    const draft = getAiForecastDraft(selectedYear, selectedMonth);
    if (draft) {
      setInsights(buildInsightFromDraft(draft));
      setInsightError(false);
      return;
    }

    if (
      monthlyForecast?.year === selectedYear &&
      monthlyForecast?.month === selectedMonth &&
      monthlyForecast?.categories?.length > 0 &&
      !isCurrentMonthSelected
    ) {
      loadInsights(monthlyForecast);
    } else {
      setInsights(null);
      setInsightError(false);
    }
  }, [isCurrentMonthSelected, monthlyForecast, selectedYear, selectedMonth, loadInsights]);

  useEffect(() => {
    loadCategoryTrend(selectedCategoryId);
  }, [selectedCategoryId, loadCategoryTrend]);

  // ── Derived Data ───────────────────────────────────────────
  const categories = useMemo(
    () => monthlyForecast?.categories || [],
    [monthlyForecast]
  );

  const totalPredicted = useMemo(
    () => categories.reduce((sum, c) => sum + Number(c?.predictedAmount || 0), 0),
    [categories]
  );

  const topCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return [...categories]
      .filter((c) => c?.trend === "UP")
      .sort((a, b) => Number(b?.predictedAmount || 0) - Number(a?.predictedAmount || 0))[0] || null;
  }, [categories]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.categoryId === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const currentInsight = useMemo(() => {
    if (insights?.year !== selectedYear || insights?.month !== selectedMonth) return null;
    return insights;
  }, [insights, selectedYear, selectedMonth]);

  const nextMonthDate = useMemo(
    () => new Date(currentYear, currentMonth, 1),
    [currentMonth, currentYear]
  );

  const isNextMonthSelected =
    selectedMonth === nextMonthDate.getMonth() + 1 &&
    selectedYear === nextMonthDate.getFullYear();

  const monthPickerLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
  const monthPickerHint = isNextMonthSelected
    ? "Dự báo cho tháng tiếp theo"
    : `Dự báo cho tháng ${selectedMonth}/${selectedYear}`;

  const monthOptions = useMemo(() => {
    const options = [];
    for (let offset = 0; offset <= 6; offset += 1) {
      const d = new Date(currentYear, currentMonth - 1 + offset, 1);
      options.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
      });
    }
    return options;
  }, [currentMonth, currentYear]);

  // ── BarChart Data ──────────────────────────────────────────
  const barChartData = useMemo(() => {
    if (categories.length === 0) return null;
    const maxBars = Math.min(categories.length, 8);
    const displayCats = categories.slice(0, maxBars);
    return {
      labels: displayCats.map((c) => {
        const name = c?.categoryName || "";
        return name.length > 6 ? name.slice(0, 5) + "…" : name;
      }),
      datasets: [
        {
          data: displayCats.map((c) => Number(c?.predictedAmount || 0)),
          color: (opacity = 1) => `rgba(232, 89, 122, ${opacity})`,
        },
        {
          data: displayCats.map((c) => Number(c?.historicalAverage || 0)),
          color: (opacity = 1) => `rgba(107, 155, 210, ${opacity})`,
        },
      ],
    };
  }, [categories]);

  // ── LineChart Data ─────────────────────────────────────────
  const lineChartData = useMemo(() => {
    const points = categoryTrend?.dataPoints || [];
    if (points.length === 0) return null;
    return {
      labels: points.map((p) => {
        const parts = (p?.yearMonth || "").split("-");
        const m = parseInt(parts[1] || "0", 10);
        return m >= 1 && m <= 12 ? SHORT_MONTHS[m - 1] : "";
      }),
      datasets: [
        {
          data: points.map((p) => Number(p?.actual || 0)),
          color: (opacity = 1) => `rgba(232, 89, 122, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [categoryTrend]);

  const selectMonth = useCallback((month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setIsMonthPickerVisible(false);
  }, []);

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
            accessibilityLabel="Chon thang du bao"
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
            <SummaryCard
              icon="💰"
              label="Dự báo tổng"
              value={formatMoney(totalPredicted)}
              accent={COLORS.EXPENSE}
            />
            <SummaryCard
              icon={topCategory ? TREND_CONFIG[topCategory.trend]?.icon || "📊" : "📊"}
              label="Tăng mạnh nhất"
              value={topCategory ? topCategory.categoryName : "—"}
              sub={topCategory ? formatMoney(topCategory.predictedAmount) : ""}
              accent={COLORS.WARNING}
            />
            <SummaryCard
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
            <EmptyState message="Chưa có dữ liệu dự báo cho tháng này" />
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
                <EmptyState message="Chưa đủ dữ liệu xu hướng cho danh mục này" />
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
                  <AnomalyCard key={a.transactionId} item={a} />
                ))}
              </View>
            ) : (
              <EmptyState message="Không phát hiện giao dịch bất thường trong tháng này" />
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
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    alignItems: "center",
  },
  summaryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600",
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginTop: 2,
    textAlign: "center",
  },
  summarySub: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 1,
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
  anomalyCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  anomalyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  anomalyIcon: {
    fontSize: 22,
  },
  anomalyInfo: {
    flex: 1,
  },
  anomalyCategory: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT,
  },
  anomalyDate: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  anomalyRight: {
    alignItems: "flex-end",
  },
  anomalyAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.EXPENSE,
  },
  anomalyDeviation: {
    fontSize: 11,
    color: COLORS.WARNING,
    fontWeight: "600",
    marginTop: 2,
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

  // Paywall
  paywallContainer: {
    flex: 1,
    backgroundColor: COLORS.BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  paywallIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  paywallTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.TEXT,
    textAlign: "center",
    marginBottom: 12,
  },
  paywallDesc: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
  },
  paywallFeatures: {
    alignSelf: "stretch",
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  paywallFeature: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: "600",
  },
  paywallButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  paywallButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
});
