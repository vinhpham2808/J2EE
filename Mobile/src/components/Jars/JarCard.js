import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { formatJarMoney, getJarActualPercent, getJarProgressWidth } from "../../utils/jar";

export default function JarCard({ item, totalBalance, onPress }) {
  const colors = useAppColors();
  const { name, icon, color, targetPercentage, currentBalance } = item;
  const actualPercent = getJarActualPercent(currentBalance, totalBalance);
  const progressWidth = getJarProgressWidth(currentBalance, totalBalance);
  const isNegative = currentBalance < 0;
  const isMet = parseFloat(actualPercent) >= (targetPercentage ?? 0);

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]} onPress={onPress}>
      <View style={[styles.cardAccentBar, { backgroundColor: color || COLORS.PRIMARY }]} />
      <View style={styles.cardHeader}>
        <View style={styles.cardInfoCol}>
          <View style={[styles.iconContainer, { backgroundColor: (color || COLORS.PRIMARY) + "18" }]}>
            <Text style={styles.iconText}>{icon || "🏺"}</Text>
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={[styles.cardName, { color: colors.TEXT }]} numberOfLines={1}>{name}</Text>
            <Text style={[styles.cardTarget, { color: colors.TEXT_SECONDARY }]}>Mục tiêu: {targetPercentage ?? 0}%</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isMet ? colors.INCOME_LIGHT : colors.WARNING_LIGHT, borderColor: isMet ? colors.INCOME : colors.WARNING }]}> 
          <Text style={[styles.statusBadgeText, { color: isMet ? colors.INCOME : colors.WARNING }]}> 
            {isMet ? "📈 Đạt mục tiêu" : "📉 Dưới mục tiêu"}
          </Text>
        </View>
      </View>
      <Text style={[styles.cardBalance, { color: colors.TEXT }, isNegative && { color: colors.EXPENSE }]}>{formatJarMoney(currentBalance)}</Text>
      <View style={styles.progressRow}>
        <Text style={[styles.progressLabel, { color: colors.TEXT_MUTED }]}>Tỷ trọng thực tế</Text>
        <Text style={[styles.progressValue, { color: color || COLORS.PRIMARY }]}>{actualPercent}% / {targetPercentage ?? 0}%</Text>
      </View>
      <View style={[styles.progressBarBg, { backgroundColor: colors.CARD_BORDER }]}> 
        <View style={[styles.progressBarFill, { width: `${progressWidth}%`, backgroundColor: isNegative ? colors.EXPENSE : color || colors.PRIMARY }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
  },
  cardAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfoCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconText: {
    fontSize: 20,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.TEXT,
  },
  cardTarget: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardBalance: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginTop: 10,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.CARD_BORDER,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  }
});
