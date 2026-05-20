import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../constants/colors";

/**
 * Bottom Sheet hiển thị AI Insight.
 *
 * Props:
 *  - visible: boolean
 *  - onClose: () => void
 *  - insight: string | null       — nội dung insight cơ bản
 *  - loading: boolean             — đang tải insight cơ bản
 *  - error: string | null         — lỗi khi tải insight cơ bản
 *  - isPremium: boolean           — user có gói PREMIUM không
 *  - detailedInsight: object | null
 *  - detailedLoading: boolean
 *  - detailedError: string | null
 *  - showDetailed: boolean
 *  - onLoadDetailed: () => void   — gọi API detailed
 *  - onRetry: () => void          — thử lại insight cơ bản
 */
export default function AiInsightSheet({
  visible,
  onClose,
  insight,
  loading,
  error,
  isPremium,
  detailedInsight,
  detailedLoading,
  detailedError,
  showDetailed,
  onLoadDetailed,
  onRetry,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Sheet */}
        <View style={[styles.sheet, { paddingBottom: Math.max(insets?.bottom || 0, 16) }]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Text style={styles.headerIcon}>✨</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Insight</Text>
                <Text style={styles.headerSubtitle}>Phân tích tài chính tháng này</Text>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ── Loading ──────────────────────────────── */}
            {loading && (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={styles.stateText}>Đang phân tích thói quen chi tiêu của bạn...</Text>
              </View>
            )}

            {/* ── Error ────────────────────────────────── */}
            {!loading && error && (
              <View style={styles.stateCard}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={onRetry}>
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </Pressable>
              </View>
            )}

            {/* ── Basic Insight ────────────────────────── */}
            {!loading && !error && insight && (
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightKicker}>Tóm tắt AI</Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Trực tiếp</Text>
                  </View>
                </View>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            )}

            {/* ── No data ──────────────────────────────── */}
            {!loading && !error && !insight && (
              <View style={styles.stateCard}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyText}>
                  Tháng này bạn chưa có đủ dữ liệu để AI phân tích.
                </Text>
              </View>
            )}

            {/* ── Detailed Section ─────────────────────── */}
            {!loading && !error && insight && (
              <View style={styles.detailedSection}>
                {!isPremium ? (
                  /* Locked for non-Premium */
                  <View style={styles.lockedCard}>
                    <Text style={styles.lockedIcon}>🔒</Text>
                    <Text style={styles.lockedTitle}>Phân tích chuyên sâu</Text>
                    <Text style={styles.lockedText}>
                      Nâng cấp lên Premium để xem dự báo dòng tiền, phân tích rủi ro và
                      khuyến nghị cá nhân hóa.
                    </Text>
                  </View>
                ) : !showDetailed ? (
                  /* Show detailed button */
                  <Pressable
                    style={styles.detailedButton}
                    onPress={onLoadDetailed}
                    disabled={detailedLoading}
                  >
                    <Text style={styles.detailedButtonText}>
                      {detailedLoading ? "Đang tải..." : "Xem phân tích chi tiết"}
                    </Text>
                    <Text style={styles.detailedArrow}>→</Text>
                  </Pressable>
                ) : detailedLoading ? (
                  /* Detailed loading */
                  <View style={styles.detailedLoadingCard}>
                    <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                    <Text style={styles.detailedLoadingText}>
                      Đang trích xuất dữ liệu tài chính sâu hơn...
                    </Text>
                  </View>
                ) : detailedError ? (
                  /* Detailed error */
                  <View style={styles.detailedErrorCard}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{detailedError}</Text>
                  </View>
                ) : detailedInsight ? (
                  /* Detailed insight content */
                  <View style={styles.detailedContent}>
                    {/* Forecast */}
                    {detailedInsight.forecast && (
                      <View style={styles.detailPanel}>
                        <View style={styles.detailPanelHeader}>
                          <Text style={styles.detailKicker}>Dự báo</Text>
                          <View
                            style={[
                              styles.riskBadge,
                              {
                                backgroundColor:
                                  detailedInsight.forecast.riskLevel === "CAO"
                                    ? COLORS.EXPENSE_LIGHT
                                    : detailedInsight.forecast.riskLevel === "TRUNG_BÌNH"
                                    ? COLORS.WARNING_LIGHT
                                    : COLORS.INCOME_LIGHT,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.riskText,
                                {
                                  color:
                                    detailedInsight.forecast.riskLevel === "CAO"
                                      ? COLORS.EXPENSE
                                      : detailedInsight.forecast.riskLevel === "TRUNG_BÌNH"
                                      ? COLORS.WARNING
                                      : COLORS.INCOME,
                                },
                              ]}
                            >
                              {detailedInsight.forecast.riskLevel === "CAO"
                                ? "Rủi ro: Cao"
                                : detailedInsight.forecast.riskLevel === "TRUNG_BÌNH"
                                ? "Rủi ro: Trung bình"
                                : "Rủi ro: Thấp"}
                            </Text>
                          </View>
                        </View>
                        {detailedInsight.forecast.riskMessage && (
                          <Text style={styles.detailText}>
                            {detailedInsight.forecast.riskMessage}
                          </Text>
                        )}
                        <View style={styles.metricRow}>
                          <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>Thu nhập dự kiến</Text>
                            <Text style={[styles.metricValue, { color: COLORS.INCOME }]}>
                              {formatMoneyLocal(detailedInsight.forecast.predictedNextMonthIncome)}
                            </Text>
                          </View>
                          <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>Chi tiêu dự kiến</Text>
                            <Text style={[styles.metricValue, { color: COLORS.EXPENSE }]}>
                              {formatMoneyLocal(detailedInsight.forecast.predictedNextMonthExpense)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Advice */}
                    {detailedInsight.detailedAdvice && (
                      <View style={styles.detailPanel}>
                        <Text style={styles.detailKicker}>Khuyến nghị</Text>
                        <Text style={styles.detailTitle}>Bước tiếp theo cá nhân hóa</Text>
                        <Text style={styles.adviceText}>
                          "{detailedInsight.detailedAdvice}"
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Local format helper (avoid import cycle) ─────────────────
function formatMoneyLocal(value) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return `${value || 0} VND`;
  }
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: COLORS.OVERLAY,
  },
  sheet: {
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    width: "100%",
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.CARD_BORDER,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.ROSE_MIST,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  headerIcon: {
    fontSize: 18,
  },
  headerTitle: {
    color: COLORS.TEXT,
    fontSize: 16,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: COLORS.TEXT_MUTED,
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BG,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: "700",
  },

  body: {
    flexShrink: 1,
  },
  bodyContent: {
    padding: 16,
    gap: 12,
  },

  // State cards
  stateCard: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: COLORS.BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  stateText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  errorIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  errorText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: COLORS.ROSE_MIST,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  retryButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },

  // Insight card
  insightCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  insightKicker: {
    color: COLORS.PRIMARY,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.INCOME_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.INCOME,
    marginRight: 4,
  },
  liveText: {
    color: COLORS.INCOME,
    fontSize: 10,
    fontWeight: "700",
  },
  insightText: {
    color: COLORS.TEXT,
    fontSize: 14,
    lineHeight: 22,
  },

  // Detailed section
  detailedSection: {
    marginTop: 4,
  },

  // Locked card
  lockedCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  lockedIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  lockedTitle: {
    color: COLORS.TEXT,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  lockedText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },

  // Detailed button
  detailedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.ROSE_MIST,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    gap: 6,
  },
  detailedButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: "700",
  },
  detailedArrow: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: "700",
  },

  // Detailed loading
  detailedLoadingCard: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: COLORS.BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  detailedLoadingText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 8,
  },

  // Detailed error
  detailedErrorCard: {
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: COLORS.BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },

  // Detailed content
  detailedContent: {
    gap: 12,
  },
  detailPanel: {
    backgroundColor: COLORS.BG,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  detailPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailKicker: {
    color: COLORS.PRIMARY,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  detailTitle: {
    color: COLORS.TEXT,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  detailText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  riskText: {
    fontSize: 10,
    fontWeight: "700",
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  metricLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  adviceText: {
    color: COLORS.TEXT,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
    paddingLeft: 12,
  },
});
