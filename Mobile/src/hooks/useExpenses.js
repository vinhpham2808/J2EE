import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { deleteExpenseById, exportExpenseReport, fetchExpensesByFilter, parseExpenseVoice } from "../services/expenseService";
import { getApiErrorMessage } from "../utils/format";

export const EXPENSE_FILTER_TYPES = {
  current: "current",
  all: "all"
};

export default function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState(EXPENSE_FILTER_TYPES.current);
  const [isExporting, setIsExporting] = useState(false);

  const totalExpense = useMemo(() => expenses.reduce((sum, item) => sum + Number(item?.amount || 0), 0), [expenses]);

  const fetchExpenses = useCallback(async () => {
    const data = await fetchExpensesByFilter(filterType);
    setExpenses(data);
  }, [filterType]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchExpenses();
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được danh sách chi tiêu"));
    } finally {
      setRefreshing(false);
    }
  }, [fetchExpenses]);

  const onDelete = useCallback(
    async (id) => {
      if (!id) return;

      Alert.alert("Xác nhận", "Bạn có chắc muốn xóa khoản chi này?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpenseById(id);
              await fetchExpenses();
              Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.delete.expense);
            } catch (error) {
              Alert.alert("Xóa thất bại", getApiErrorMessage(error, "Không thể xóa khoản chi này"));
            }
          }
        }
      ]);
    },
    [fetchExpenses]
  );

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  const handleVoiceResult = useCallback(async (text, onParsed) => {
    try {
      const data = await parseExpenseVoice(text);
      if (data) {
        onParsed?.(data);
      }
    } catch (error) {
      Alert.alert("Lỗi AI", getApiErrorMessage(error, "Không thể phân tích nội dung giọng nói"));
    }
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportExpenseReport(filterType);
    } catch (error) {
      Alert.alert("Lỗi xuất file", getApiErrorMessage(error, "Không thể xuất báo cáo"));
    } finally {
      setIsExporting(false);
    }
  }, [filterType]);

  return {
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
  };
}
