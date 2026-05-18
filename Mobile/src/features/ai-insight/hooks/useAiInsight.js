import { useCallback, useContext, useState } from "react";
import { AuthContext } from "../../../components/AuthContext";
import { fetchAiInsight, fetchDetailedAiInsight } from "../services/aiInsightApi";

/**
 * Custom hook for AI Insight feature.
 *
 * Manages:
 *  - Basic AI insight loading & data
 *  - Detailed AI insight loading & data
 *  - Sheet / modal visibility
 *  - Premium access check
 */
export function useAiInsight() {
  const { user } = useContext(AuthContext);

  const [visible, setVisible] = useState(false);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [detailedInsight, setDetailedInsight] = useState(null);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedError, setDetailedError] = useState(null);
  const [showDetailed, setShowDetailed] = useState(false);

  // ── Permission ──────────────────────────────────────────
  const subscriptionPlan = String(user?.subscriptionPlan || "FREE").toUpperCase();
  const isPremium = subscriptionPlan === "PREMIUM";

  // ── Open sheet ───────────────────────────────────────────
  const openSheet = useCallback(async () => {
    setVisible(true);
    setError(null);
    setShowDetailed(false);
    setDetailedInsight(null);
    setDetailedError(null);

    // If already have data, just show the sheet
    if (insight) return;

    setLoading(true);
    try {
      const data = await fetchAiInsight();
      if (data?.error) {
        setInsight(data);
        setError(data.insight || data.message || "Không thể tải phân tích AI.");
      } else if (data?.insight) {
        setInsight(data);
      } else {
        setInsight(null);
        setError("Chưa có dữ liệu để phân tích. Hãy thêm giao dịch đầu tiên!");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Hệ thống AI đang bảo trì, bạn quay lại sau nhé.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [insight]);

  // ── Close sheet ─────────────────────────────────────────
  const closeSheet = useCallback(() => {
    setVisible(false);
  }, []);

  // ── Load detailed insight ───────────────────────────────
  const loadDetailed = useCallback(async () => {
    if (detailedLoading) return;

    if (!isPremium) {
      // Should not reach here, but as safety
      setDetailedError("Tính năng này yêu cầu gói Premium.");
      return;
    }

    setShowDetailed(true);
    setDetailedLoading(true);
    setDetailedError(null);

    try {
      const data = await fetchDetailedAiInsight();
      if (data?.error || data?.status === "insufficient_data") {
        setDetailedError(data?.message || "Chưa đủ dữ liệu để phân tích chi tiết.");
        setDetailedInsight(null);
      } else {
        setDetailedInsight(data);
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        setDetailedError("Bạn cần nâng cấp lên gói Premium để xem phân tích chi tiết.");
      } else {
        setDetailedError(
          err?.response?.data?.message || err?.message || "Không thể tải phân tích chi tiết."
        );
      }
    } finally {
      setDetailedLoading(false);
    }
  }, [detailedLoading, isPremium]);

  // ── Retry basic insight ─────────────────────────────────
  const retry = useCallback(async () => {
    setInsight(null);
    setError(null);
    setLoading(true);
    try {
      const data = await fetchAiInsight();
      if (data?.error) {
        setInsight(data);
        setError(data.insight || data.message || "Không thể tải phân tích AI.");
      } else if (data?.insight) {
        setInsight(data);
      } else {
        setInsight(null);
        setError("Chưa có dữ liệu để phân tích.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Sheet state
    visible,
    openSheet,
    closeSheet,

    // Basic insight
    insight: insight?.insight || null,
    insightStatus: insight?.status || null,
    loading,
    error,

    // Detailed insight
    detailedInsight,
    detailedLoading,
    detailedError,
    showDetailed,
    loadDetailed,

    // Permission
    isPremium,
    subscriptionPlan,

    // Retry
    retry,
  };
}
