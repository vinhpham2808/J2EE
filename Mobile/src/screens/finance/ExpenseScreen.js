import React, { useCallback, useContext } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackHeader from "../../components/common/ScreenBackHeader";
import ExpenseEmptyState from "../../components/Expenses/ExpenseEmptyState";
import ExpenseForm from "../../components/Expenses/ExpenseForm";
import ExpenseItem from "../../components/Expenses/ExpenseItem";
import ExpenseListHeader from "../../components/Expenses/ExpenseListHeader";
import { useAppColors } from "../../constants/colors";
import { AuthContext } from "../../contexts/AuthContext";
import useExpenseForm from "../../hooks/useExpenseForm";
import useExpenseReceiptImport from "../../hooks/useExpenseReceiptImport";
import useExpenses from "../../hooks/useExpenses";
import { scale } from "../../utils/layoutScale";
import { getSafeAreaBottom, getSafeAreaContentStyle, getSafeAreaTop } from "../../utils/safeArea";

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
  const title = route.params?.initialData ? "Chỉnh sửa chi tiêu" : "Thêm chi tiêu";

  const { handleScanReceipt, isScanning } = useExpenseReceiptImport({
    isPremium,
    navigation
  });

  const form = useExpenseForm({
    defaultJarId: route.params?.defaultJarId,
    initialData: route.params?.initialData,
    onSaved: () => navigation.goBack()
  });

  return (
    <ExpenseForm
      form={form}
      insetsStyle={getSafeAreaContentStyle(insets)}
      isPremium={isPremium}
      isScanning={isScanning}
      onImportReceipt={handleScanReceipt}
      title={title}
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
    expenses,
    filterType,
    handleExport,
    handleVoiceResult,
    isExporting,
    onDelete,
    onRefresh,
    refreshing,
    setFilterType,
    totalExpense
  } = useExpenses();

  const { handleScanReceipt, isScanning } = useExpenseReceiptImport({
    isPremium,
    navigation
  });

  const navigateToAddExpense = useCallback(
    (initialData) => navigation.navigate("AddExpense", initialData ? { initialData } : undefined),
    [navigation]
  );

  const onVoiceParsed = useCallback(
    (text) => handleVoiceResult(text, navigateToAddExpense),
    [handleVoiceResult, navigateToAddExpense]
  );

  const renderExpense = useCallback(
    ({ item }) => <ExpenseItem item={item} onDelete={onDelete} onEdit={navigateToAddExpense} />,
    [navigateToAddExpense, onDelete]
  );

  const renderHeader = useCallback(
    () => (
      <ExpenseListHeader
        expenses={expenses}
        filterType={filterType}
        isExporting={isExporting}
        isPremium={isPremium}
        isScanning={isScanning}
        onAddExpense={() => navigateToAddExpense()}
        onExport={handleExport}
        onFilterChange={setFilterType}
        onScanReceipt={handleScanReceipt}
        onVoiceResult={onVoiceParsed}
        totalExpense={totalExpense}
      />
    ),
    [
      expenses,
      filterType,
      handleExport,
      handleScanReceipt,
      isExporting,
      isPremium,
      isScanning,
      navigateToAddExpense,
      onVoiceParsed,
      setFilterType,
      totalExpense
    ]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.APP_BACKGROUND || colors.BG, paddingTop: getSafeAreaTop(insets, 12) }]}>
      <ScreenBackHeader title="Lịch sử chi tiêu" />

      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item?.id)}
        renderItem={renderExpense}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: getSafeAreaBottom(insets) + scale(80) },
          !expenses.length && styles.listContentEmpty
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<ExpenseEmptyState />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(16)
  },
  listContent: {
    paddingBottom: scale(24)
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center"
  }
});
