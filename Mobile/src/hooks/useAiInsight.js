import { useCallback, useContext, useMemo, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { fetchAiForecast } from "../services/aiInsightService";
import { saveAiForecastDraft } from "../services/forecastDraftCacheService";

export function useAiInsight() {
  const { user } = useContext(AuthContext);

  const [visible, setVisible] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const nextMonthDate = useMemo(
    () => new Date(currentYear, currentMonth, 1),
    [currentMonth, currentYear]
  );
  const defaultForecastMonth = nextMonthDate.getMonth() + 1;
  const defaultForecastYear = nextMonthDate.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(defaultForecastMonth);
  const [selectedYear, setSelectedYear] = useState(defaultForecastYear);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subscriptionPlan = String(user?.subscriptionPlan || "FREE").toUpperCase();
  const subscriptionStatus = String(user?.subscriptionStatus || "INACTIVE").toUpperCase();
  const isPremium =
    (subscriptionPlan === "PREMIUM" || subscriptionPlan === "BASIC") &&
    subscriptionStatus === "ACTIVE";

  const availableMonths = useMemo(() => {
    const months = [];
    for (let i = 1; i <= 6; i++) {
      const d = new Date(currentYear, currentMonth - 1 + i, 1);
      months.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: `Th\u00E1ng ${d.getMonth() + 1}/${d.getFullYear()}`,
      });
    }
    return months;
  }, [currentMonth, currentYear]);

  const openSheet = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
    setSelectedMonth(defaultForecastMonth);
    setSelectedYear(defaultForecastYear);
    setVisible(true);
  }, [defaultForecastMonth, defaultForecastYear]);

  const closeSheet = useCallback(() => {
    setVisible(false);
    setResult(null);
    setError(null);
    setLoading(false);
    setSelectedMonth(defaultForecastMonth);
    setSelectedYear(defaultForecastYear);
  }, [defaultForecastMonth, defaultForecastYear]);

  const canGoPrev = useMemo(() => {
    return availableMonths.findIndex(
      (m) => m.month === selectedMonth && m.year === selectedYear
    ) > 0;
  }, [selectedMonth, selectedYear, availableMonths]);

  const canGoNext = useMemo(() => {
    const idx = availableMonths.findIndex(
      (m) => m.month === selectedMonth && m.year === selectedYear
    );
    return idx >= 0 && idx < availableMonths.length - 1;
  }, [selectedMonth, selectedYear, availableMonths]);

  const goToPrevMonth = useCallback(() => {
    const idx = availableMonths.findIndex(
      (m) => m.month === selectedMonth && m.year === selectedYear
    );
    if (idx > 0) {
      setSelectedMonth(availableMonths[idx - 1].month);
      setSelectedYear(availableMonths[idx - 1].year);
    }
  }, [selectedMonth, selectedYear, availableMonths]);

  const goToNextMonth = useCallback(() => {
    const idx = availableMonths.findIndex(
      (m) => m.month === selectedMonth && m.year === selectedYear
    );
    if (idx < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[idx + 1].month);
      setSelectedYear(availableMonths[idx + 1].year);
    }
  }, [selectedMonth, selectedYear, availableMonths]);

  const analyze = useCallback(async () => {
    if (loading) return;
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      setError("AI Insight chỉ dự báo từ tháng tiếp theo.");
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await fetchAiForecast(selectedYear, selectedMonth);
      if (data?.error || data?.message) {
        setError(data.message || data.error || "Kh\u00F4ng th\u1EC3 t\u1EA1o d\u1EF1 b\u00E1o AI.");
      } else {
        setResult(data);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "H\u1EC7 th\u1ED1ng AI \u0111ang b\u1EA3o tr\u00EC, b\u1EA1n quay l\u1EA1i sau nh\u00E9.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, loading, currentMonth, currentYear]);

  const retry = useCallback(() => {
    setError(null);
    setResult(null);
    analyze();
  }, [analyze]);

  const confirmAnalysis = useCallback(() => {
    const draft = saveAiForecastDraft(result, selectedYear, selectedMonth);
    closeSheet();
    return draft;
  }, [closeSheet, result, selectedMonth, selectedYear]);

  return {
    visible,
    openSheet,
    closeSheet,
    selectedMonth,
    selectedYear,
    availableMonths,
    goToPrevMonth,
    goToNextMonth,
    canGoPrev,
    canGoNext,
    result,
    loading,
    error,
    analyze,
    retry,
    confirmAnalysis,
    isIdle: !loading && !result && !error,
    isPremium,
    subscriptionPlan,
  };
}
