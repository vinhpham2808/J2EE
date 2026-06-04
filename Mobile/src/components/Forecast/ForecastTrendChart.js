import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { COLORS, useAppColors } from "../../constants/colors";
import ForecastEmptyState from "./ForecastEmptyState";

export default function ForecastTrendChart({
  categoryName,
  lineChartData,
  isTrendLoading,
}) {
  const colors = useAppColors();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(screenWidth - 48, 300);
  const chartConfig = {
    backgroundColor: colors.CARD,
    backgroundGradientFrom: colors.CARD,
    backgroundGradientTo: colors.CARD,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(232, 89, 122, ${opacity})`,
    labelColor: () => colors.TEXT_SECONDARY,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.PRIMARY,
    },
    propsForLabels: { fontSize: 10 },
    propsForBackgroundLines: {
      strokeDasharray: "4 4",
      stroke: colors.CARD_BORDER,
      strokeWidth: 1,
    },
  };

  if (!categoryName) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT }]}> 
        📈 Xu hướng: {categoryName}
      </Text>
      {isTrendLoading ? (
        <View style={styles.trendLoadingWrap}>
          <ActivityIndicator size="small" color={colors.PRIMARY} />
        </View>
      ) : lineChartData ? (
        <View style={[styles.chartCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
          <LineChart
            data={lineChartData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            bezier
            fromZero
            yAxisLabel=""
            yAxisSuffix="đ"
          />
          <Text style={[styles.trendNote, { color: colors.TEXT_MUTED }]}> 
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
