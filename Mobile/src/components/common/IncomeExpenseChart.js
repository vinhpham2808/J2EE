import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { COLORS, useAppColors } from "../../constants/colors";

const screenWidth = Dimensions.get("window").width;

const IncomeExpenseChart = ({ data, title, colorPrimary }) => {
  const colors = useAppColors();
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Group data by date
    const grouped = data.reduce((acc, item) => {
      // item.date might be "YYYY-MM-DD"
      // we extract "DD/MM"
      if (!item.date) return acc;
      const dateParts = item.date.split("T")[0].split("-");
      if (dateParts.length < 3) return acc;
      
      const key = `${dateParts[2]}/${dateParts[1]}`;
      
      if (!acc[key]) {
        acc[key] = { label: key, rawDate: item.date, amount: 0 };
      }
      acc[key].amount += Number(item.amount || 0);
      return acc;
    }, {});

    const values = Object.values(grouped).sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
    
    if (values.length === 0) return null;

    // To prevent too many labels on the X-axis, extract just the day or filter them
    const labels = values.map(v => v.label);
    const datasets = [{ data: values.map(v => v.amount) }];

    return { labels, datasets };
  }, [data]);

  if (!chartData) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>
        <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>Chưa có dữ liệu để vẽ biểu đồ.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>
      <Text style={[styles.title, { color: colorPrimary }]}>{title}</Text>
      
      <LineChart
        data={{
          labels: chartData.labels.length > 6 ? chartData.labels.filter((l, i) => i % Math.ceil(chartData.labels.length / 6) === 0 || i === chartData.labels.length - 1) : chartData.labels,
          datasets: chartData.datasets
        }}
        width={screenWidth - 60}
        height={220}
        chartConfig={{
          backgroundColor: colors.CARD,
          backgroundGradientFrom: colors.CARD,
          backgroundGradientTo: colors.CARD,
          decimalPlaces: 0,
          color: (opacity = 1) => colorPrimary,
          labelColor: () => colors.TEXT_SECONDARY,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: colorPrimary
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 12,
    alignItems: "center"
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  emptyContainer: {
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 24,
    marginBottom: 12,
    alignItems: "center"
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14
  }
});

export default IncomeExpenseChart;
