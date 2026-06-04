import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { COLORS } from "../../constants/colors";
import { barChartConfig } from "../../constants/forecastConfig";

export default function ForecastBarChart({ barChartData, categories }) {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(screenWidth - 48, 300);

  if (!barChartData || categories.length === 0) return null;

  return (
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
});
