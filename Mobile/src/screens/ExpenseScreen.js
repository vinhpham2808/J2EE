import React, { useCallback, useContext } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../components/AuthContext";
import ExpenseEmptyState from "../components/Expenses/ExpenseEmptyState";
import ExpenseFilterTabs from "../components/Expenses/ExpenseFilterTabs";
import ExpenseForm from "../components/Expenses/ExpenseForm";
import ExpenseItem from "../components/Expenses/ExpenseItem";
import ExpenseListOverview from "../components/Expenses/ExpenseListOverview";
import ExpenseSearchBar from "../components/Expenses/ExpenseSearchBar";
import ExpenseSummaryActions from "../components/Expenses/ExpenseSummaryActions";
import QuickExpenseTemplates from "../components/QuickExpenseTemplates";
import { COLORS } from "../constants/colors";
import useExpenseReceiptImport from "../hooks/useExpenseReceiptImport";
import useExpenseForm from "../hooks/useExpenseForm";
import useExpenses from "../hooks/useExpenses";
import { getSafeAreaBottom, getSafeAreaContentStyle, getSafeAreaTop } from "../utils/safeAreaSpacing";

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
        <ExpenseFilterTabs filterType={filterType} onChange={setFilterType} />
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
      totalExpense
    ]
  );

  return (
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets) }]}>
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
          <ExpenseEmptyState hasSearch={Boolean(searchKeyword)} onAddExpense={() => navigateToAddExpense()} />
        }
      />
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
  }
});
