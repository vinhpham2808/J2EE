import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { COLORS } from "../../constants/colors";
import { lineChartConfig } from "../../utils/forecast";
import ForecastEmptyState from "./ForecastEmptyState";

export default function ForecastTrendChart({
  categoryName,
  lineChartData,
  isTrendLoading,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(screenWidth - 48, 300);

  if (!categoryName) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        📈 Xu hướng: {categoryName}
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
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 10,
  },
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
});
