import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import { clampScale, scale } from "../../utils/layoutScale";
import { formatMoney } from "../../utils/format";
import { formatRelativeTime } from "../../utils/dashboard";
import { DashboardSectionCard, ToggleSectionHeader } from "./DashboardSection";

function TransactionRow({ item }) {
  const colors = useAppColors();
  const isIncome = String(item?.type || "").toUpperCase().includes("INCOME");
  const amountColor = isIncome ? colors.INCOME : colors.EXPENSE;
  const sign = isIncome ? "+" : "-";

  return (
    <View style={[styles.transactionRow, { borderBottomColor: colors.BG }]}> 
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIconWrap, { backgroundColor: colors.ROSE_MIST, borderColor: colors.CARD_BORDER }]}> 
          <Text style={styles.transactionIcon}>{item?.icon || "🧾"}</Text>
        </View>
        <View>
          <Text style={[styles.transactionName, { color: colors.TEXT }]}>{item?.name || "Giao dịch"}</Text>
          <Text style={[styles.transactionDate, { color: colors.TEXT_MUTED }]}>{formatRelativeTime(item?.createdAt || item?.updatedAt || item?.date)}</Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, { color: amountColor }]}>{sign}{formatMoney(item?.amount)}</Text>
    </View>
  );
}

export default function RecentTransactionsSection({ canToggle, expanded, onToggle, transactions }) {
  const colors = useAppColors();

  return (
    <>
      <ToggleSectionHeader title="Giao dịch gần đây" visible={canToggle} expanded={expanded} onPress={onToggle} />
      <DashboardSectionCard>
        {transactions.length ? (
          transactions.map((item) => <TransactionRow key={item.id || `${item.name}-${item.date}`} item={item} />)
        ) : (
          <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>Chưa có giao dịch gần đây.</Text>
        )}
      </DashboardSectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: scale(8)
  },
  transactionIconWrap: {
    width: scale(36),
    aspectRatio: 1,
    borderRadius: scale(10),
    backgroundColor: COLORS.ROSE_MIST,
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(10),
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  transactionIcon: {
    fontSize: clampScale(16, 14, 18)
  },
  transactionName: {
    color: COLORS.TEXT,
    fontWeight: "700",
    fontSize: clampScale(14, 12, 16)
  },
  transactionDate: {
    color: COLORS.TEXT_MUTED,
    marginTop: scale(2),
    fontSize: clampScale(12, 10, 14)
  },
  transactionAmount: {
    fontWeight: "800",
    fontSize: clampScale(13, 11, 15)
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    paddingVertical: scale(16)
  }
});
