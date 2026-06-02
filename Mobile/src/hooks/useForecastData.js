import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchMonthlyForecast,
  fetchAnomalies,
  fetchCategoryTrend,
  fetchInsights,
} from "../services/forecastService";
import { getAiForecastDraft } from "../ai-insight/services/forecastDraftCache";
import {
  getRouteForecastMonth,
  buildForecastFromDraft,
  buildInsightFromDraft,
} from "../constants/forecastConfig";

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
    ? `${initialRouteForecast.year}-${initialRouteForecast.month}-${route.params?.draftSavedAt || ""}`
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
    ? `${routeForecast.year}-${routeForecast.month}-${route.params?.draftSavedAt || ""}`
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
  const loadCategoryTrend = useCallback(
    async (categoryId) => {
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
    },
    [isPremium, selectedMonth, selectedYear]
  );

  // ── Fetch AI Insights ──────────────────────────────────────
  const loadInsights = useCallback(
    async (forecastData) => {
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
    if (categories.length === 0) return null;
    return (
      [...categories]
        .filter((c) => c?.trend === "UP")
        .sort(
          (a, b) =>
            Number(b?.predictedAmount || 0) - Number(a?.predictedAmount || 0)
        )[0] || null
    );
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
  const nextMonthDate = useMemo(
    () => new Date(currentYear, currentMonth, 1),
    [currentMonth, currentYear]
  );

  const isNextMonthSelected =
    selectedMonth === nextMonthDate.getMonth() + 1 &&
    selectedYear === nextMonthDate.getFullYear();

  const monthPickerLabel = `${MONTH_LABELS[selectedMonth - 1]} ${selectedYear}`;
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
        label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
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
        return m >= 1 && m <= 12 ? SHORT_MONTH_LABELS[m - 1] : "";
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

// Local month labels (avoid circular dependency with forecastConfig)
const MONTH_LABELS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const SHORT_MONTH_LABELS = [
  "T1", "T2", "T3", "T4", "T5", "T6",
  "T7", "T8", "T9", "T10", "T11", "T12",
];
