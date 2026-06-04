import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { deleteBudgetById, fetchBudgets, saveBudget } from "../services/budgetService";
import { fetchCategoriesByType } from "../services/categoryService";
import { formatCurrencyInput, getApiErrorMessage, parseCurrencyInput } from "../utils/format";
import { summarizeBudgets } from "../utils/budget";

export default function useBudget() {
  const now = new Date();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amountLimit, setAmountLimit] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [submitting, setSubmitting] = useState(false);

  const summary = useMemo(() => summarizeBudgets(budgets), [budgets]);

  const fetchData = useCallback(async () => {
    const [budgetData, categoryData] = await Promise.all([
      fetchBudgets(),
      fetchCategoriesByType("expense")
    ]);

    setBudgets(budgetData);
    setCategories(categoryData);
    setCategoryId((current) => current || (categoryData.length > 0 ? String(categoryData[0].id) : ""));
  }, []);

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

  const setFormattedAmountLimit = useCallback((value) => {
    setAmountLimit(formatCurrencyInput(value));
  }, []);

  const onSave = useCallback(async () => {
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
      await saveBudget({
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
  }, [amountLimit, categoryId, fetchData, month, year]);

  const onDelete = useCallback(
    async (id) => {
      if (!id) return;

      Alert.alert("Xác nhận", "Bạn có chắc muốn xóa hạn mức này?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBudgetById(id);
              await fetchData();
              Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.delete.budget);
            } catch (error) {
              Alert.alert("Xóa thất bại", getApiErrorMessage(error, "Không thể xóa ngân sách"));
            }
          }
        }
      ]);
    },
    [fetchData]
  );

  return {
    amountLimit,
    budgets,
    categories,
    categoryId,
    month,
    onDelete,
    onRefresh,
    onSave,
    refreshing,
    setAmountLimit: setFormattedAmountLimit,
    setCategoryId,
    setMonth,
    setYear,
    submitting,
    summary,
    year
  };
}
