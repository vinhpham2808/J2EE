import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatJarMoney } from "../../utils/jar";

export default function JarOverview({ jarCount, maxJars, totalBalance, totalPercentage }) {
  const colors = useAppColors();

  return (
    <View style={[styles.overviewContainer, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER, shadowColor: colors.TEXT }]}> 
      <View style={[styles.overviewBox, { borderBottomColor: colors.CARD_BORDER }]}> 
        <Text style={[styles.overviewLabel, { color: colors.TEXT_SECONDARY }]}>Tổng số dư hũ</Text>
        <Text style={[styles.overviewBalance, { color: colors.PRIMARY }]}>{formatJarMoney(totalBalance)}</Text>
      </View>
      <View style={styles.overviewRow}>
        <View style={[styles.smallOverviewBox, { marginRight: 8, backgroundColor: colors.BG }]}> 
          <Text style={[styles.overviewLabel, { color: colors.TEXT_SECONDARY }]}>Số hũ đang dùng</Text>
          <Text style={[styles.overviewValue, { color: colors.TEXT }]}>{jarCount} / {maxJars === Infinity ? "∞" : maxJars}</Text>
        </View>
        <View style={[styles.smallOverviewBox, { backgroundColor: colors.BG }]}> 
          <Text style={[styles.overviewLabel, { color: colors.TEXT_SECONDARY }]}>Tổng phân bổ %</Text>
          <Text style={[styles.overviewValue, { color: colors.TEXT }, totalPercentage > 100 && { color: colors.EXPENSE }]}>{totalPercentage.toFixed(1)}%</Text>
        </View>
      </View>
      {totalPercentage > 100 && (
        <View style={[styles.warningBanner, { backgroundColor: colors.EXPENSE_LIGHT, borderColor: colors.EXPENSE }]}> 
          <Text style={[styles.warningText, { color: colors.EXPENSE }]}>🚨 Tổng tỉ lệ phân bổ đã vượt quá 100%! Vui lòng điều chỉnh lại tỉ lệ các hũ.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overviewContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 12,
    shadowColor: COLORS.TEXT,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 1,
  },
  overviewBox: {
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "700",
  },
  overviewBalance: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.PRIMARY,
    marginTop: 4,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallOverviewBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    paddingVertical: 10,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginTop: 4,
  },
  warningBanner: {
    backgroundColor: COLORS.EXPENSE_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecdca",
    padding: 8,
    marginTop: 12,
  },
  warningText: {
    color: COLORS.EXPENSE,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  }
});
