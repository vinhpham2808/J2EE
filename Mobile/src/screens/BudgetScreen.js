import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import http from "../services/http";
import { fetchCategoriesByType } from "../services/categoryService";
import { API_ENDPOINTS } from "../constants/api";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { formatCurrencyInput, formatMoney, getApiErrorMessage, parseCurrencyInput } from "../utils/format";
import { COLORS } from "../constants/colors";
import { CategoryVectorIcon, getIconColor } from "../utils/VectorIcons";
import { getSafeAreaBottom, getSafeAreaTop } from "../utils/safeAreaSpacing";

function getBudgetVisual(progressRatio) {
  if (progressRatio >= 1) {
    return {
      color: COLORS.EXPENSE,
      bg: COLORS.EXPENSE_LIGHT,
      border: "#fecdca",
      label: "Vượt hạn mức"
    };
  }

  if (progressRatio >= 0.8) {
    return {
      color: COLORS.WARNING,
      bg: COLORS.WARNING_LIGHT,
      border: "#fedf89",
      label: "Sắp chạm hạn mức"
    };
  }

  return {
    color: COLORS.INCOME,
    bg: COLORS.INCOME_LIGHT,
    border: "#abefc6",
    label: "Trong giới hạn"
  };
}

function CategoryChip({ category, active, onPress }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <CategoryVectorIcon iconValue={category?.icon} size={16} color={getIconColor(category?.icon)} />
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {category?.name || "Danh mục"}
      </Text>
    </Pressable>
  );
}

function BudgetCard({ item, onDelete }) {
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

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const [categoryId, setCategoryId] = useState("");
  const [amountLimit, setAmountLimit] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [submitting, setSubmitting] = useState(false);

  const summary = useMemo(() => {
    const totalLimit = budgets.reduce((sum, item) => sum + Number(item?.amountLimit || 0), 0);
    const totalSpent = budgets.reduce((sum, item) => sum + Number(item?.totalSpent || 0), 0);
    const warningCount = budgets.filter((item) => {
      const limit = Number(item?.amountLimit || 0);
      const spent = Number(item?.totalSpent || 0);
      return limit > 0 && spent / limit >= 0.8;
    }).length;

    return {
      totalLimit,
      totalSpent,
      warningCount
    };
  }, [budgets]);

  const fetchData = useCallback(async () => {
    const [budgetRes, categoryData] = await Promise.all([
      http.get(API_ENDPOINTS.GET_BUDGETS),
      fetchCategoriesByType("expense")
    ]);

    const budgetData = Array.isArray(budgetRes.data) ? budgetRes.data : [];

    setBudgets(budgetData);
    setCategories(categoryData);

    if (categoryData.length > 0 && !categoryId) {
      setCategoryId(String(categoryData[0].id));
    }
  }, [categoryId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được dữ liệu ngân sách"));
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  const onSave = async () => {
    const limit = parseCurrencyInput(amountLimit);
    const selectedMonth = Number(month);
    const selectedYear = Number(year);

    if (!categoryId) {
      Alert.alert("Thiếu danh mục", "Vui lòng chọn danh mục.");
      return;
    }

    if (!amountLimit.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Hạn mức.");
      return;
    }

    if (!month.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Tháng.");
      return;
    }

    if (!year.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Năm.");
      return;
    }

    if (!Number.isFinite(limit) || limit <= 0) {
      Alert.alert("Sai dữ liệu", "Vui lòng nhập hạn mức hợp lệ > 0.");
      return;
    }

    if (!Number.isFinite(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
      Alert.alert("Sai tháng", "Tháng cần nằm trong khoảng 1 đến 12.");
      return;
    }

    if (!Number.isFinite(selectedYear) || selectedYear < 2000 || selectedYear > 2100) {
      Alert.alert("Sai năm", "Năm không hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      await http.post(API_ENDPOINTS.SET_BUDGET, {
        categoryId: Number(categoryId),
        amountLimit: limit,
        month: selectedMonth,
        year: selectedYear
      });

      setAmountLimit("");
      await fetchData();
      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.update.budget);
    } catch (error) {
      Alert.alert("Lưu thất bại", getApiErrorMessage(error, "Không thể cập nhật ngân sách"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    if (!id) return;

    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa hạn mức này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await http.delete(API_ENDPOINTS.DELETE_BUDGET(id));
            await fetchData();
            Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.delete.budget);
          } catch (error) {
            Alert.alert("Xóa thất bại", getApiErrorMessage(error, "Không thể xóa ngân sách"));
          }
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets) }]}>
      <View style={styles.overviewCard}>
        <Text style={styles.overviewTitle}>Ngân sách tháng</Text>
        <Text style={styles.overviewLimit}>Hạn mức: {formatMoney(summary.totalLimit)}</Text>
        <Text style={styles.overviewSpent}>Đã chi: {formatMoney(summary.totalSpent)}</Text>
        <Text style={styles.overviewHint}>{summary.warningCount} mục đang gần/vượt hạn mức</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Thiết lập hạn mức</Text>
        <Text style={styles.formSubTitle}>Chọn danh mục chi tiêu và nhập giới hạn theo tháng.</Text>

        <Text style={styles.label}>Danh mục chi</Text>
        <View style={styles.chipRow}>
          {categories.map((category) => {
            const active = String(category.id) === String(categoryId);
            return (
              <CategoryChip
                key={String(category.id)}
                category={category}
                active={active}
                onPress={() => setCategoryId(String(category.id))}
              />
            );
          })}
        </View>

        <Text style={styles.label}>Hạn mức (VND)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amountLimit}
          onChangeText={(value) => setAmountLimit(formatCurrencyInput(value))}
          placeholder="Ví dụ: 3.000.000"
          placeholderTextColor="#98a2b3"
        />

        <View style={styles.dateRow}>
          <View style={[styles.dateCol, styles.dateColLeft]}>
            <Text style={styles.label}>Tháng</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={month}
              onChangeText={setMonth}
              placeholder="1-12"
              placeholderTextColor="#98a2b3"
            />
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Năm</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={year}
              onChangeText={setYear}
              placeholder="2026"
              placeholderTextColor="#98a2b3"
            />
          </View>
        </View>

        <Pressable style={[styles.saveButton, submitting && styles.saveButtonDisabled]} onPress={onSave} disabled={submitting}>
          <Text style={styles.saveButtonText}>{submitting ? "Đang lưu..." : "Lưu hạn mức"}</Text>
        </Pressable>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => String(item?.id)}
        renderItem={({ item }) => <BudgetCard item={item} onDelete={onDelete} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: getSafeAreaBottom(insets) }, !budgets.length && styles.listContentEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          budgets.length ? (
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Danh sách hạn mức</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>Chưa có hạn mức nào</Text>
            <Text style={styles.emptyText}>Hãy tạo hạn mức đầu tiên để kiểm soát chi tiêu tốt hơn trong tháng.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f7",
    padding: 16,
    paddingTop: 16
  },
  overviewCard: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  overviewTitle: {
    color: COLORS.PEACH,
    fontWeight: "700",
    fontSize: 13
  },
  overviewLimit: {
    marginTop: 6,
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 20
  },
  overviewSpent: {
    marginTop: 2,
    color: COLORS.PEACH,
    fontWeight: "700"
  },
  overviewHint: {
    marginTop: 8,
    color: COLORS.ROSE_MIST,
    fontSize: 12
  },
  formCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 12
  },
  formTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 4
  },
  formSubTitle: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 10,
    fontSize: 12
  },
  label: {
    color: COLORS.TEXT,
    marginBottom: 6,
    fontWeight: "700"
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: COLORS.CARD,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "48%"
  },
  chipActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.ROSE_MIST
  },
  chipIcon: {
    marginRight: 5
  },
  chipText: {
    color: COLORS.TEXT,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1
  },
  chipTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "800"
  },
  input: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
    color: COLORS.TEXT
  },
  dateRow: {
    flexDirection: "row"
  },
  dateCol: {
    flex: 1
  },
  dateColLeft: {
    marginRight: 8
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800"
  },
  listContent: {
    paddingBottom: 30
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
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  itemHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8
  },
  itemIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.ROSE_MIST,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },
  itemIconText: {
    fontSize: 18
  },
  itemHeaderTextWrap: {
    flex: 1
  },
  itemName: {
    color: COLORS.TEXT,
    fontWeight: "800",
    marginBottom: 2
  },
  itemSubTitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12
  },
  deleteButton: {
    backgroundColor: COLORS.EXPENSE_LIGHT,
    borderWidth: 1,
    borderColor: "#fecdca",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  deleteText: {
    color: COLORS.EXPENSE,
    fontWeight: "700",
    fontSize: 12
  },
  statsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  statRight: {
    alignItems: "flex-end"
  },
  statLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12
  },
  statValue: {
    color: COLORS.TEXT,
    marginTop: 2,
    fontWeight: "700"
  },
  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.CARD_BORDER,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%"
  },
  progressFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700"
  },
  progressPercent: {
    fontWeight: "800"
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
    lineHeight: 19
  }
});
