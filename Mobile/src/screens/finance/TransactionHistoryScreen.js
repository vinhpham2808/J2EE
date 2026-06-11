import React, { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TransactionCalendarHeader from "../../components/Transactions/TransactionCalendarHeader";
import TransactionGroup from "../../components/Transactions/TransactionGroup";
import AppIcon from "../../components/ui/AppIcon";
import { useAppColors } from "../../constants/colors";
import useTransactionHistory from "../../hooks/useTransactionHistory";
import { getSafeAreaBottom, getSafeAreaTop } from "../../utils/safeArea";

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  const {
    activeType,
    currentMonth,
    daysInMonth,
    filteredTransactions,
    groupedTransactions,
    monthlySummary,
    refreshing,
    searchQuery,
    selectedDay,
    showSearch,
    handleDelete,
    loadData,
    nextMonth,
    prevMonth,
    setActiveType,
    setSearchQuery,
    setSelectedDay,
    setShowSearch
  } = useTransactionHistory();

  const handleAddTransaction = useCallback(() => {
    navigation.navigate(activeType === "income" ? "AddIncome" : "AddExpense");
  }, [activeType, navigation]);

  const handleEditTransaction = useCallback((item) => {
    if (!item?.id) return;
    navigation.navigate(item.type === "income" ? "AddIncome" : "AddExpense", { initialData: item });
  }, [navigation]);

  const renderCalendarDay = ({ item }) => {
    if (item.day === null) return <View style={styles.calendarDayCell} />;

    const dayTransactions = filteredTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt || transaction.date);
      return transactionDate.getDate() === item.day;
    });
    const hasIncome = activeType === "income" && dayTransactions.some((transaction) => transaction.type === "income");
    const hasExpense = activeType === "expense" && dayTransactions.some((transaction) => transaction.type === "expense");
    const isSelected = selectedDay === item.day;

    return (
      <Pressable
        style={[
          styles.calendarDayCell,
          isSelected && {
            backgroundColor: activeType === "expense" ? (colors.ACTION_EXPENSE || "#F97316") : (colors.ACTION_INCOME || "#22C55E"),
            borderRadius: 8
          }
        ]}
        onPress={() => setSelectedDay(isSelected ? null : item.day)}
      >
        <Text style={[styles.dayText, { color: isSelected ? "#FFF" : colors.TEXT }]}>{item.day}</Text>
        <View style={styles.dotsRow}>
          {hasIncome ? <View style={[styles.dot, { backgroundColor: "#22C55E" }]} /> : null}
          {hasExpense ? <View style={[styles.dot, { backgroundColor: "#EF4444" }]} /> : null}
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <TransactionCalendarHeader
      activeType={activeType}
      colors={colors}
      currentMonth={currentMonth}
      daysInMonth={daysInMonth}
      monthlySummary={monthlySummary}
      nextMonth={nextMonth}
      prevMonth={prevMonth}
      renderCalendarDay={renderCalendarDay}
      setActiveType={setActiveType}
      setSelectedDay={setSelectedDay}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.APP_BACKGROUND || "#F2F2F7", paddingTop: getSafeAreaTop(insets, 12) }]}>
      <View style={styles.topHeader}>
        <Text style={[styles.headerTitle, { color: colors.TEXT }]}>Lịch sử</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.actionIcon} onPress={() => setShowSearch((previous) => !previous)}>
            <AppIcon name={showSearch ? "close" : "search-outline"} size={20} color={colors.TEXT} />
          </Pressable>
          <Pressable style={styles.actionIcon} onPress={handleAddTransaction}>
            <AppIcon name="add" size={24} color={colors.TEXT} />
          </Pressable>
        </View>
      </View>

      {showSearch ? (
        <View style={[styles.searchBar, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
          <AppIcon name="search-outline" size={16} color={colors.TEXT_MUTED} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.TEXT }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm kiếm giao dịch..."
            placeholderTextColor={colors.TEXT_MUTED}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <AppIcon name="close-circle" size={16} color={colors.TEXT_MUTED} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <FlatList
        data={groupedTransactions}
        keyExtractor={(item) => item.date.toDateString()}
        renderItem={({ item }) => (
          <TransactionGroup colors={colors} group={item} onDelete={handleDelete} onEdit={handleEditTransaction} />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: getSafeAreaBottom(insets) + 80 }]}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppIcon name="document-text-outline" size={48} color={colors.TEXT_MUTED} />
            <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>Không có giao dịch</Text>
            <Text style={[styles.emptySubtitle, { color: colors.TEXT_SECONDARY }]}>Không tìm thấy giao dịch nào trong khoảng thời gian này.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700"
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  actionIcon: {
    padding: 4
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0
  },
  listContent: {
    paddingBottom: 24
  },
  calendarDayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
    paddingBottom: 4
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500"
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
    height: 4
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18
  }
});
