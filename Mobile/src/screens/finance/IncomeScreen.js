import React, { useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IncomeEmptyState from "../../components/Incomes/IncomeEmptyState";
import IncomeForm from "../../components/Incomes/IncomeForm";
import IncomeItem from "../../components/Incomes/IncomeItem";
import IncomeListHeader from "../../components/Incomes/IncomeListHeader";
import { COLORS, useAppColors } from "../../constants/colors";
import useIncomeForm from "../../hooks/useIncomeForm";
import useIncomes from "../../hooks/useIncomes";
import { getSafeAreaBottom, getSafeAreaContentStyle, getSafeAreaTop } from "../../utils/safeArea";

export default function IncomeScreen() {
  const route = useRoute();

  if (route.name === "AddIncome") {
    return <IncomeFormRoute />;
  }

  return <IncomeListRoute />;
}

function IncomeFormRoute() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const form = useIncomeForm({
    initialData: route.params?.initialData,
    onSaved: () => navigation.goBack()
  });

  return <IncomeForm form={form} insetsStyle={getSafeAreaContentStyle(insets)} />;
}

function IncomeListRoute() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const {
    filterType,
    handleExport,
    handleVoiceResult,
    incomes,
    isExporting,
    onDelete,
    onRefresh,
    refreshing,
    setFilterType,
    totalIncome
  } = useIncomes();

  const navigateToAddIncome = useCallback(
    (initialData) => navigation.navigate("AddIncome", initialData ? { initialData } : undefined),
    [navigation]
  );

  const onVoiceParsed = useCallback(
    (text) => handleVoiceResult(text, navigateToAddIncome),
    [handleVoiceResult, navigateToAddIncome]
  );

  const renderIncome = useCallback(
    ({ item }) => <IncomeItem item={item} onDelete={onDelete} />,
    [onDelete]
  );

  const renderHeader = useCallback(
    () => (
      <IncomeListHeader
        filterType={filterType}
        incomes={incomes}
        isExporting={isExporting}
        onAddIncome={() => navigateToAddIncome()}
        onExport={handleExport}
        onFilterChange={setFilterType}
        onVoiceResult={onVoiceParsed}
        totalIncome={totalIncome}
      />
    ),
    [filterType, handleExport, incomes, isExporting, navigateToAddIncome, onVoiceParsed, setFilterType, totalIncome]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.BG, paddingTop: getSafeAreaTop(insets) }]}> 
      <FlatList
        data={incomes}
        keyExtractor={(item) => String(item?.id)}
        renderItem={renderIncome}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: getSafeAreaBottom(insets) },
          !incomes.length && styles.listContentEmpty
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<IncomeEmptyState />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
    padding: 16,
    paddingTop: 16
  },
  listContent: {
    paddingBottom: 24
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center"
  }
});
