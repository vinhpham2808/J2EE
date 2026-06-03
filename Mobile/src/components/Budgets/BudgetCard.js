import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { getBudgetVisual } from "../../utils/budgetUtils";
import { formatMoney } from "../../utils/format";
import { CategoryVectorIcon, getIconColor } from "../../utils/VectorIcons";

export default function BudgetCard({ item, onDelete }) {
  const limit = Number(item?.amountLimit || 0);
  const spent = Number(item?.totalSpent || 0);
  const ratio = limit > 0 ? spent / limit : 0;
  const progress = Math.min(100, ratio * 100);
  const visual = getBudgetVisual(ratio);
  const now = new Date();
  const month = Number(item?.month || now.getMonth() + 1);
  const year = Number(item?.year || now.getFullYear());
  const iconColor = getIconColor(item?.categoryIcon);

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderLeft}>
          <View style={[styles.itemIconBubble, { backgroundColor: iconColor + "18" }]}>
            <CategoryVectorIcon iconValue={item?.categoryIcon} size={18} color={iconColor} />
          </View>
          <View style={styles.itemHeaderTextWrap}>
            <Text style={styles.itemName}>{item?.categoryName || "Ngân sách"}</Text>
            <Text style={styles.itemSubTitle}>Tháng {month}/{year}</Text>
          </View>
        </View>
        <Pressable style={styles.deleteButton} onPress={() => onDelete(item?.id)}>
          <Text style={styles.deleteText}>Xóa</Text>
        </Pressable>
      </View>
      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statLabel}>Đã chi</Text>
          <Text style={styles.statValue}>{formatMoney(spent)}</Text>
        </View>
        <View style={styles.statRight}>
          <Text style={styles.statLabel}>Hạn mức</Text>
          <Text style={styles.statValue}>{formatMoney(limit)}</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: visual.color }]} />
      </View>
      <View style={styles.progressFooter}>
        <View style={[styles.statusBadge, { backgroundColor: visual.bg, borderColor: visual.border }]}> 
          <Text style={[styles.statusBadgeText, { color: visual.color }]}>{visual.label}</Text>
        </View>
        <Text style={[styles.progressPercent, { color: visual.color }]}>{progress.toFixed(0)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemCard: { backgroundColor: COLORS.CARD, borderWidth: 1, borderColor: COLORS.CARD_BORDER, borderRadius: 14, padding: 12, marginBottom: 10 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 },
  itemIconBubble: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.ROSE_MIST, justifyContent: "center", alignItems: "center", marginRight: 10 },
  itemHeaderTextWrap: { flex: 1 },
  itemName: { color: COLORS.TEXT, fontWeight: "800", marginBottom: 2 },
  itemSubTitle: { color: COLORS.TEXT_SECONDARY, fontSize: 12 },
  deleteButton: { backgroundColor: COLORS.EXPENSE_LIGHT, borderWidth: 1, borderColor: "#fecdca", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  deleteText: { color: COLORS.EXPENSE, fontWeight: "700", fontSize: 12 },
  statsRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  statRight: { alignItems: "flex-end" },
  statLabel: { color: COLORS.TEXT_SECONDARY, fontSize: 12 },
  statValue: { color: COLORS.TEXT, marginTop: 2, fontWeight: "700" },
  progressTrack: { marginTop: 10, height: 8, borderRadius: 8, backgroundColor: COLORS.CARD_BORDER, overflow: "hidden" },
  progressFill: { height: "100%" },
  progressFooter: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  progressPercent: { fontWeight: "800" }
});
