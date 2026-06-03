import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { formatJarMoney } from "../../utils/jarUtils";

export default function JarOverview({ jarCount, maxJars, totalBalance, totalPercentage }) {
  return (
    <View style={styles.overviewContainer}>
      <View style={styles.overviewBox}>
        <Text style={styles.overviewLabel}>Tổng số dư hũ</Text>
        <Text style={styles.overviewBalance}>{formatJarMoney(totalBalance)}</Text>
      </View>
      <View style={styles.overviewRow}>
        <View style={[styles.smallOverviewBox, { marginRight: 8 }]}>
          <Text style={styles.overviewLabel}>Số hũ đang dùng</Text>
          <Text style={styles.overviewValue}>{jarCount} / {maxJars === Infinity ? "∞" : maxJars}</Text>
        </View>
        <View style={styles.smallOverviewBox}>
          <Text style={styles.overviewLabel}>Tổng phân bổ %</Text>
          <Text style={[styles.overviewValue, totalPercentage > 100 && { color: COLORS.EXPENSE }]}>{totalPercentage.toFixed(1)}%</Text>
        </View>
      </View>
      {totalPercentage > 100 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>🚨 Tổng tỉ lệ phân bổ đã vượt quá 100%! Vui lòng điều chỉnh lại tỉ lệ các hũ.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overviewContainer: { backgroundColor: COLORS.WHITE, borderRadius: 18, borderWidth: 1, borderColor: COLORS.CARD_BORDER, padding: 14, marginBottom: 12, shadowColor: COLORS.TEXT, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  overviewBox: { alignItems: "center", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.CARD_BORDER, marginBottom: 12 },
  overviewLabel: { fontSize: 12, color: COLORS.TEXT_SECONDARY, fontWeight: "700" },
  overviewBalance: { fontSize: 26, fontWeight: "800", color: COLORS.PRIMARY, marginTop: 4 },
  overviewRow: { flexDirection: "row", justifyContent: "space-between" },
  smallOverviewBox: { flex: 1, alignItems: "center", backgroundColor: COLORS.BG, borderRadius: 12, paddingVertical: 10 },
  overviewValue: { fontSize: 16, fontWeight: "800", color: COLORS.TEXT, marginTop: 4 },
  warningBanner: { backgroundColor: COLORS.EXPENSE_LIGHT, borderRadius: 10, borderWidth: 1, borderColor: "#fecdca", padding: 8, marginTop: 12 },
  warningText: { color: COLORS.EXPENSE, fontSize: 11, fontWeight: "600", textAlign: "center" }
});
