import React, { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IncomeForm from "../components/Incomes/IncomeForm";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import VoiceInputButton from "../components/VoiceInputButton";
import { COLORS } from "../constants/colors";
import useIncomeForm from "../hooks/useIncomeForm";
import useIncomes, { INCOME_FILTER_TYPES } from "../hooks/useIncomes";
import { formatDate, formatMoney } from "../utils/format";
import { getSafeAreaBottom, getSafeAreaContentStyle, getSafeAreaTop } from "../utils/safeAreaSpacing";

function IncomeItem({ item, onDelete }) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemMain}>
        <View style={styles.iconBubble}>
          <Text style={styles.iconText}>{item?.icon || "💰"}</Text>
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item?.name || "Thu nhập"}</Text>
          <Text style={styles.itemMeta}>{formatDate(item?.date)} • {item?.categoryName || "Khác"}</Text>
        </View>
      </View>

      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>+ {formatMoney(item?.amount)}</Text>
        <Pressable
          onPress={() => onDelete(item?.id)}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Xóa thu nhập"
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
}

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

  return (
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets) }]}>
      <FlatList
        data={incomes}
        keyExtractor={(item) => String(item?.id)}
        renderItem={({ item }) => <IncomeItem item={item} onDelete={onDelete} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: getSafeAreaBottom(insets) },
          !incomes.length && styles.listContentEmpty
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            {/* Filter Card */}
            <View style={styles.filterCard}>
              <Text style={styles.filterTitle}>Khung thời gian</Text>
              <View style={styles.filterRow}>
                <Pressable
                  style={[styles.filterChip, filterType === INCOME_FILTER_TYPES.current && styles.filterChipActive]}
                  onPress={() => {
                    setFilterType(INCOME_FILTER_TYPES.current);
                  }}
                >
                  <Text style={[styles.filterChipText, filterType === INCOME_FILTER_TYPES.current && styles.filterChipTextActive]}>Tháng này</Text>
                </Pressable>

                <Pressable
                  style={[styles.filterChip, styles.filterChipLast, filterType === INCOME_FILTER_TYPES.all && styles.filterChipActive]}
                  onPress={() => {
                    setFilterType(INCOME_FILTER_TYPES.all);
                  }}
                >
                  <Text style={[styles.filterChipText, filterType === INCOME_FILTER_TYPES.all && styles.filterChipTextActive]}>Tất cả</Text>
                </Pressable>
              </View>
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Tổng thu nhập</Text>
              <Text style={styles.summaryAmount}>{formatMoney(totalIncome)}</Text>
              <Text style={styles.summaryHint}>{incomes.length} giao dịch</Text>

              <View style={styles.actionRowMain}>
                <Pressable style={styles.addButtonMain} onPress={() => navigateToAddIncome()}>
                  <Text style={styles.addButtonText}>+ Thêm thu nhập</Text>
                </Pressable>
                <VoiceInputButton onResult={onVoiceParsed} />
              </View>
              <Pressable 
                style={[styles.exportButton, isExporting && { opacity: 0.7 }]} 
                onPress={handleExport}
                disabled={isExporting}
              >
                <Text style={styles.exportText}>
                  {isExporting
                    ? "Đang tạo báo cáo..."
                    : filterType === INCOME_FILTER_TYPES.all
                      ? "Tải báo cáo tất cả tháng"
                      : "Tải báo cáo tháng này"}
                </Text>
              </Pressable>
            </View>

            {/* Charts & Header */}
            {incomes.length ? (
              <View>
                <IncomeExpenseChart data={incomes} title="Tổng quan thu nhập" colorPrimary={COLORS.INCOME} />
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>Danh sách thu nhập</Text>
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💹</Text>
            <Text style={styles.emptyTitle}>Chưa có dữ liệu thu nhập</Text>
            <Text style={styles.emptyText}>
              Hãy thêm khoản thu đầu tiên để theo dõi tài chính rõ ràng hơn.
            </Text>
          </View>
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
    paddingTop: 16
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
  summaryCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 14,
    shadowColor: COLORS.TEXT,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  summaryLabel: {
    fontSize: 13,
    color: "#667085",
    fontWeight: "700"
  },
  summaryAmount: {
    marginTop: 4,
    fontSize: 26,
    color: COLORS.INCOME,
    fontWeight: "800"
  },
  summaryHint: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY
  },
  actionRowMain: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    alignItems: "center"
  },
  addButtonMain: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 15
  },
  exportButton: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT
  },
  exportText: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
    fontSize: 14
  },
  listContent: {
    paddingBottom: 24
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center"
  },
  listHeader: {
    marginBottom: 8
  },
  listTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 16
  },
  itemCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  itemMain: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.ROSE_MIST,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  iconText: {
    fontSize: 18
  },
  itemContent: {
    flex: 1
  },
  itemName: {
    fontWeight: "700",
    color: COLORS.TEXT,
    fontSize: 15
  },
  itemMeta: {
    marginTop: 4,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12
  },
  itemRight: {
    alignItems: "flex-end"
  },
  itemAmount: {
    color: COLORS.INCOME,
    fontWeight: "800"
  },
  deleteButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  deleteIcon: {
    color: "#b42318",
    fontSize: 14,
    lineHeight: 16
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
    backgroundColor: "#15803d",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  emptyActionText: {
    color: "#ffffff",
    fontWeight: "800"
  }
});
