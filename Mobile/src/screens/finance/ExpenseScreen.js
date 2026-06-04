import React, { useCallback, useContext } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../contexts/AuthContext";
import ExpenseForm from "../../components/Expenses/ExpenseForm";
import ExpenseItem from "../../components/Expenses/ExpenseItem";
import ExpenseListOverview from "../../components/Expenses/ExpenseListOverview";
import ExpenseSummaryActions from "../../components/Expenses/ExpenseSummaryActions";
import QuickExpenseTemplates from "../../components/Expenses/QuickExpenseTemplates";
import { COLORS, useAppColors } from "../../constants/colors";
import useExpenseReceiptImport from "../../hooks/useExpenseReceiptImport";
import useExpenseForm from "../../hooks/useExpenseForm";
import useExpenses from "../../hooks/useExpenses";
import { getSafeAreaBottom, getSafeAreaContentStyle, getSafeAreaTop } from "../../utils/safeArea";

const EXPENSE_FILTER_TYPES = {
  current: "current",
  all: "all"
};

const FILTER_OPTIONS = [
  { label: "Tháng này", value: EXPENSE_FILTER_TYPES.current },
  { label: "Tất cả", value: EXPENSE_FILTER_TYPES.all }
];

export default function ExpenseScreen() {
  const route = useRoute();

  if (route.name === "AddExpense") {
    return <ExpenseFormRoute />;
  }

  return <ExpenseListRoute />;
}

function ExpenseFormRoute() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const subscriptionPlan = String(user?.subscriptionPlan || "FREE").toUpperCase();
  const isPremium = subscriptionPlan === "PREMIUM";

  const { handleScanReceipt, isScanning } = useExpenseReceiptImport({
    isPremium,
    navigation
  });

  const expenseForm = useExpenseForm({
    defaultJarId: route.params?.defaultJarId,
    initialData: route.params?.initialData,
    onSaved: () => navigation.goBack()
  });

  return (
    <ExpenseForm
      form={expenseForm}
      insetsStyle={getSafeAreaContentStyle(insets)}
      isPremium={isPremium}
      isScanning={isScanning}
      onImportReceipt={handleScanReceipt}
    />
  );
}

function ExpenseListRoute() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const { user } = useContext(AuthContext);
  const subscriptionPlan = String(user?.subscriptionPlan || "FREE").toUpperCase();
  const isPremium = subscriptionPlan === "PREMIUM";

  const {
    canToggleExpenses,
    expandedExpenses,
    expenses,
    fetchExpenses,
    filteredExpenses,
    filterType,
    handleExport,
    handleVoiceResult,
    isExporting,
    onDelete,
    onRefresh,
    refreshing,
    searchQuery,
    setFilterType,
    setSearchQuery,
    toggleExpenses,
    totalExpense,
    visibleExpenses
  } = useExpenses();

  const { handleScanReceipt, isScanning } = useExpenseReceiptImport({
    isPremium,
    navigation
  });

  const searchKeyword = searchQuery.trim();

  const navigateToAddExpense = useCallback(
    (initialData) => {
      navigation.navigate("AddExpense", initialData ? { initialData } : undefined);
    },
    [navigation]
  );

  const onVoiceParsed = useCallback(
    (text) => handleVoiceResult(text, navigateToAddExpense),
    [handleVoiceResult, navigateToAddExpense]
  );

  const renderExpense = useCallback(
    ({ item }) => (
      <ExpenseItem item={item} onDelete={onDelete} searchKeyword={searchKeyword} />
    ),
    [onDelete, searchKeyword]
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <ExpenseFilterTabs colors={colors} filterType={filterType} onChange={setFilterType} />
        <ExpenseSummaryActions
          expenseCount={expenses.length}
          filterType={filterType}
          isExporting={isExporting}
          isPremium={isPremium}
          isScanning={isScanning}
          onAddExpense={() => navigateToAddExpense()}
          onExport={handleExport}
          onScanReceipt={handleScanReceipt}
          onVoiceResult={onVoiceParsed}
          totalExpense={totalExpense}
        />
        <QuickExpenseTemplates onRefreshList={fetchExpenses} />
        <ExpenseSearchBar
          colors={colors}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />
        <ExpenseListOverview
          canToggle={canToggleExpenses}
          expanded={expandedExpenses}
          expenses={filteredExpenses}
          onToggle={toggleExpenses}
          searchKeyword={searchKeyword}
        />
      </View>
    ),
    [
      canToggleExpenses,
      expandedExpenses,
      expenses.length,
      fetchExpenses,
      filterType,
      filteredExpenses,
      handleExport,
      handleScanReceipt,
      isExporting,
      isPremium,
      isScanning,
      navigateToAddExpense,
      onVoiceParsed,
      searchKeyword,
      searchQuery,
      setFilterType,
      setSearchQuery,
      toggleExpenses,
      totalExpense,
      colors
    ]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.BG, paddingTop: getSafeAreaTop(insets) }]}>
      <FlatList
        data={visibleExpenses}
        keyExtractor={(item) => String(item?.id)}
        renderItem={renderExpense}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: getSafeAreaBottom(insets) },
          !filteredExpenses.length && styles.listContentEmpty
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <ExpenseEmptyState colors={colors} hasSearch={Boolean(searchKeyword)} onAddExpense={() => navigateToAddExpense()} />
        }
      />
    </View>
  );
}

function ExpenseFilterTabs({ colors, filterType, onChange }) {
  return (
    <View style={[styles.filterCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>
      <Text style={[styles.filterTitle, { color: colors.TEXT }]}>Khung thời gian</Text>
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((option, index) => {
          const isActive = filterType === option.value;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.filterChip,
                { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER },
                index === FILTER_OPTIONS.length - 1 && styles.filterChipLast,
                isActive && { backgroundColor: colors.ROSE_MIST, borderColor: colors.PRIMARY }
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.filterChipText, { color: isActive ? colors.PRIMARY : colors.TEXT }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ExpenseSearchBar({ colors, value, onChangeText, onClear }) {
  return (
    <View style={[styles.searchBar, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={[styles.searchInput, { color: colors.TEXT }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Tìm kiếm ghi chú, tên chi tiêu..."
        placeholderTextColor={colors.TEXT_MUTED}
      />
      {value ? (
        <Pressable onPress={onClear} style={styles.searchClear}>
          <Text style={[styles.searchClearText, { color: colors.TEXT_SECONDARY }]}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ExpenseEmptyState({ colors, hasSearch, onAddExpense }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🧾</Text>
      <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>
        {hasSearch ? "Không tìm thấy kết quả" : "Chưa có khoản chi nào"}
      </Text>
      <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
        {hasSearch
          ? "Thử tìm kiếm với từ khóa khác."
          : "Hãy thêm giao dịch đầu tiên để bắt đầu theo dõi chi tiêu dễ hơn."}
      </Text>
      {!hasSearch && (
        <Pressable style={styles.emptyAction} onPress={onAddExpense}>
          <Text style={styles.emptyActionText}>+ Thêm chi tiêu</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
    padding: 16,
    paddingTop: 50
  },
  header: {
    marginBottom: 12
  },
  listContent: {
    paddingBottom: 24
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center"
  },
  filterCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 12
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 10
  },
  filterRow: {
    flexDirection: "row"
  },
  filterChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginRight: 8
  },
  filterChipLast: {
    marginRight: 0
  },
  filterChipActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.ROSE_MIST
  },
  filterChipText: {
    color: COLORS.TEXT,
    fontWeight: "700",
    fontSize: 12
  },
  filterChipTextActive: {
    color: COLORS.PRIMARY
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 12,
    marginBottom: 10
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.TEXT
  },
  searchClear: {
    padding: 6
  },
  searchClearText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 6
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 19,
    marginBottom: 14
  },
  emptyAction: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  emptyActionText: {
    color: COLORS.WHITE,
    fontWeight: "800"
  }
});
