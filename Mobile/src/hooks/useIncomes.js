import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { deleteIncomeById, exportIncomeReport, fetchIncomesByFilter, parseIncomeVoice } from "../services/incomeService";
import { getApiErrorMessage } from "../utils/format";

export const INCOME_FILTER_TYPES = {
  current: "current",
  all: "all"
};

export default function useIncomes() {
  const [incomes, setIncomes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState(INCOME_FILTER_TYPES.current);
  const [isExporting, setIsExporting] = useState(false);

  const totalIncome = useMemo(() => incomes.reduce((sum, item) => sum + Number(item?.amount || 0), 0), [incomes]);

  const fetchIncomes = useCallback(async () => {
    const data = await fetchIncomesByFilter(filterType);
    setIncomes(data);
  }, [filterType]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchIncomes();
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được danh sách thu nhập"));
    } finally {
      setRefreshing(false);
    }
  }, [fetchIncomes]);

  const onDelete = useCallback(
    async (id) => {
      if (!id) return;

      Alert.alert("Xác nhận", "Bạn có chắc muốn xóa khoản thu này?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteIncomeById(id);
              await fetchIncomes();
              Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.delete.income);
            } catch (error) {
              Alert.alert("Xóa thất bại", getApiErrorMessage(error, "Không thể xóa khoản thu này"));
            }
          }
        }
      ]);
    },
    [fetchIncomes]
  );

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  const handleVoiceResult = useCallback(async (text, onParsed) => {
    try {
      const data = await parseIncomeVoice(text);
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
      await exportIncomeReport(filterType);
    } catch (error) {
      Alert.alert("Lỗi xuất file", getApiErrorMessage(error, "Không thể xuất báo cáo"));
    } finally {
      setIsExporting(false);
    }
  }, [filterType]);

  return {
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
  };
}
