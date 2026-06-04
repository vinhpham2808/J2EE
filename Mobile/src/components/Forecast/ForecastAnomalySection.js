import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import ForecastAnomalyCard from "./ForecastAnomalyCard";
import ForecastEmptyState from "./ForecastEmptyState";

export default function ForecastAnomalySection({
  anomalies,
  selectedMonth,
  selectedYear,
}) {
  const colors = useAppColors();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT }]}> 
        🚨 Cảnh báo tham khảo tháng {selectedMonth}/{selectedYear}
      </Text>
      {anomalies.length > 0 ? (
        <View style={styles.anomalyList}>
          {anomalies.map((a) => (
            <ForecastAnomalyCard key={a.transactionId} item={a} />
          ))}
        </View>
      ) : (
        <ForecastEmptyState message="Không phát hiện giao dịch bất thường trong tháng này" />
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
  anomalyList: {
    gap: 8,
  },
});
