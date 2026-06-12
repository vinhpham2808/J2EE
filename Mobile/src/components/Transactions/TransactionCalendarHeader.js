import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import AmountText from "../ui/AmountText";
import AppIcon from "../ui/AppIcon";

export default function TransactionCalendarHeader({
  activeType,
  colors,
  currentMonth,
  daysInMonth,
  monthlySummary,
  nextMonth,
  prevMonth,
  renderCalendarDay,
  setActiveType,
  setSelectedDay,
  showTypeTabs = true,
  summaryMode = "combined"
}) {
  const monthYearStr = `Tháng ${currentMonth.getMonth() + 1}, ${currentMonth.getFullYear()}`;
  const isDark = colors.BG === "#0F0D0C";
  const isExpenseOnly = summaryMode === "expense";

  return (
    <View style={styles.listHeader}>
      {showTypeTabs ? (
        <View style={[styles.segmentContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }]}> 
          <Pressable
            style={[
              styles.segmentButton,
              activeType === "expense" && [styles.segmentButtonActive, { backgroundColor: colors.ACTION_EXPENSE || "#F97316" }]
            ]}
            onPress={() => {
              setActiveType("expense");
              setSelectedDay(null);
            }}
          >
            <Text style={[styles.segmentButtonText, activeType === "expense" ? styles.segmentButtonTextActive : { color: colors.TEXT_SECONDARY }]}> 
              Chi tiêu
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentButton,
              activeType === "income" && [styles.segmentButtonActive, { backgroundColor: colors.ACTION_INCOME || "#22C55E" }]
            ]}
            onPress={() => {
              setActiveType("income");
              setSelectedDay(null);
            }}
          >
            <Text style={[styles.segmentButtonText, activeType === "income" ? styles.segmentButtonTextActive : { color: colors.TEXT_SECONDARY }]}> 
              Thu nhập
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.monthSelector, { borderColor: colors.BORDER, backgroundColor: colors.CARD }]}>
        <Pressable onPress={prevMonth} style={styles.monthNavBtn}>
          <AppIcon name="chevron-back" size={20} color={colors.TEXT} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.TEXT }]}>{monthYearStr}</Text>
        <Pressable onPress={nextMonth} style={styles.monthNavBtn}>
          <AppIcon name="chevron-forward" size={20} color={colors.TEXT} />
        </Pressable>
      </View>

      <View style={[styles.calendarCard, { backgroundColor: colors.CARD, borderColor: colors.BORDER }]}>
        <View style={styles.weekdayRow}>
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((weekday) => (
            <Text key={weekday} style={[styles.weekdayText, { color: colors.TEXT_MUTED || "#B8A6AC" }]}>{weekday}</Text>
          ))}
        </View>

        <FlatList
          data={daysInMonth}
          renderItem={renderCalendarDay}
          keyExtractor={(item) => item.id}
          numColumns={7}
          scrollEnabled={false}
          style={styles.calendarGrid}
        />
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
        <View style={styles.summaryCol}>
          <Text style={[styles.summaryLabel, { color: colors.TEXT_SECONDARY }]}>{activeType === "income" ? "Thu nhập" : "Chi phí"}</Text>
          <AmountText value={activeType === "income" ? monthlySummary.income : monthlySummary.expense} type={activeType} style={styles.summaryValue} />
        </View>
        {!isExpenseOnly ? (
          <>
            <View style={[styles.summaryDivider, { backgroundColor: colors.SEPARATOR }]} />
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: colors.TEXT_SECONDARY }]}>Số dư ròng</Text>
              <AmountText value={monthlySummary.net} type={monthlySummary.net >= 0 ? "income" : "expense"} style={styles.summaryValue} />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    marginBottom: 18
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1
  },
  segmentContainer: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    marginBottom: 14
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 12
  },
  segmentButtonActive: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 1.5
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: "750"
  },
  segmentButtonTextActive: {
    color: "#FFF"
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center"
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "800"
  },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 8,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    marginBottom: 10
  },
  weekdayText: {
    width: "14%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600"
  },
  calendarGrid: {
    marginBottom: 2
  },
  summaryCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8
  },
  summaryCol: {
    flex: 1,
    alignItems: "center"
  },
  summaryDivider: {
    width: 1,
    height: "80%",
    alignSelf: "center"
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 5
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "800"
  }
});
