import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchMonthlyForecast,
  fetchAnomalies,
  fetchCategoryTrend,
  fetchInsights,
} from "../services/forecastService";
import { getAiForecastDraft } from "../services/forecastDraftCacheService";
import {
  getRouteForecastMonth,
  buildForecastFromDraft,
  buildInsightFromDraft,
} from "../utils/forecast";
import {
  buildForecastBarChartData,
  buildMonthOptions,
  buildTrendLineChartData,
  getForecastRequestKey,
  getMonthPickerState,
  getTopGrowthCategory
} from "./forecastDataUtils";

/**
 * Custom hook encapsulating all forecast data fetching, state management,
 * and derived computations for the ForecastScreen.
 *
 * @param {object}  options
 * @param {object}  options.route         - React Navigation route object
 * @param {boolean} options.isPremium     - Whether user has PREMIUM plan
 * @param {number}  options.currentMonth  - Current month (1-12)
 * @param {number}  options.currentYear   - Current year
 */
export default function useForecastData({ route, isPremium, currentMonth, currentYear }) {
  // ── Route-driven initial state ─────────────────────────────
  const initialRouteForecast = getRouteForecastMonth(route.params);
  const initialRouteForecastKey = initialRouteForecast
    ? getForecastRequestKey(initialRouteForecast.year, initialRouteForecast.month, route.params?.draftSavedAt || "")
    : "";

  const [selectedMonth, setSelectedMonth] = useState(
    initialRouteForecast?.month || currentMonth
  );
  const [selectedYear, setSelectedYear] = useState(
    initialRouteForecast?.year || currentYear
  );
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // ── Data states ────────────────────────────────────────────
  const [monthlyForecast, setMonthlyForecast] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [categoryTrend, setCategoryTrend] = useState(null);
  const [insights, setInsights] = useState(null);

  // ── Loading states ─────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [insightError, setInsightError] = useState(false);

  // ── Request dedup refs ─────────────────────────────────────
  const forecastRequestKeyRef = useRef("");
  const anomalyRequestKeyRef = useRef("");
  const categoryTrendRequestKeyRef = useRef("");
  const insightRequestKeyRef = useRef("");
  const appliedRouteForecastKeyRef = useRef(initialRouteForecastKey);

  // ── Derived ────────────────────────────────────────────────
  const isCurrentMonthSelected =
    selectedMonth === currentMonth && selectedYear === currentYear;

  const routeForecast = useMemo(
    () => getRouteForecastMonth(route.params),
    [route.params?.month, route.params?.year]
  );
  const routeForecastKey = routeForecast
    ? getForecastRequestKey(routeForecast.year, routeForecast.month, route.params?.draftSavedAt || "")
    : "";

  // ── Sync from route params ─────────────────────────────────
  useEffect(() => {
    if (!routeForecast) return;
    if (appliedRouteForecastKeyRef.current === routeForecastKey) return;

    appliedRouteForecastKeyRef.current = routeForecastKey;
    setSelectedMonth(routeForecast.month);
    setSelectedYear(routeForecast.year);
    setIsMonthPickerVisible(false);
  }, [routeForecast, routeForecastKey]);

  // ── Fetch Monthly Forecast ─────────────────────────────────
  const loadMonthlyForecast = useCallback(async () => {
    if (!isPremium) return;
    const requestKey = getForecastRequestKey(selectedYear, selectedMonth);
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
      setSelectedCategoryId(
        forecast.categories.length > 0 ? forecast.categories[0].categoryId : null
      );
      setInsights(buildInsightFromDraft(draft));
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchMonthlyForecast(selectedYear, selectedMonth);
      if (forecastRequestKeyRef.current !== requestKey) return;
      setMonthlyForecast(data);
      const cats = data?.categories || [];
      setSelectedCategoryId(cats.length > 0 ? cats[0].categoryId : null);
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
    const requestKey = getForecastRequestKey(selectedYear, selectedMonth);
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
  const loadCategoryTrend = useCallback(
    async (categoryId) => {
      if (!categoryId || !isPremium) return;
      const requestKey = getForecastRequestKey(selectedYear, selectedMonth, categoryId);
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
    },
    [isPremium, selectedMonth, selectedYear]
  );

  // ── Fetch AI Insights ──────────────────────────────────────
  const loadInsights = useCallback(
    async (forecastData) => {
      if (!forecastData?.categories?.length || !isPremium) return;
      if (forecastData.year === currentYear && forecastData.month === currentMonth) return;

      const forecastKey = getForecastRequestKey(forecastData.year, forecastData.month);
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
    },
    [currentMonth, currentYear, isPremium]
  );

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
    return getTopGrowthCategory(categories);
  }, [categories]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.categoryId === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const currentInsight = useMemo(() => {
    if (insights?.year !== selectedYear || insights?.month !== selectedMonth) return null;
    return insights;
  }, [insights, selectedYear, selectedMonth]);

  // ── Month picker options ───────────────────────────────────
  const { isNextMonthSelected, monthPickerLabel, monthPickerHint } = useMemo(
    () => getMonthPickerState({ currentMonth, currentYear, selectedMonth, selectedYear }),
    [currentMonth, currentYear, selectedMonth, selectedYear]
  );

  const monthOptions = useMemo(() => {
    return buildMonthOptions(currentYear, currentMonth);
  }, [currentMonth, currentYear]);

  // ── BarChart Data ──────────────────────────────────────────
  const barChartData = useMemo(() => {
    return buildForecastBarChartData(categories);
  }, [categories]);

  // ── LineChart Data ─────────────────────────────────────────
  const lineChartData = useMemo(() => {
    return buildTrendLineChartData(categoryTrend);
  }, [categoryTrend]);

  // ── Month selection callback ───────────────────────────────
  const selectMonth = useCallback((month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setIsMonthPickerVisible(false);
  }, []);

  // ── Return ─────────────────────────────────────────────────
  return {
    // Core states
    selectedMonth,
    selectedYear,
    isMonthPickerVisible,
    setIsMonthPickerVisible,
    selectedCategoryId,
    setSelectedCategoryId,
    // Data
    monthlyForecast,
    anomalies,
    categoryTrend,
    insights,
    // Loading
    isLoading,
    isTrendLoading,
    insightError,
    // Derived
    categories,
    totalPredicted,
    topCategory,
    selectedCategory,
    currentInsight,
    isCurrentMonthSelected,
    isNextMonthSelected,
    monthPickerLabel,
    monthPickerHint,
    monthOptions,
    barChartData,
    lineChartData,
    // Callbacks
    selectMonth,
  };
}
