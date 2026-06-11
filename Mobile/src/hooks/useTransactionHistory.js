import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { deleteExpenseById, fetchExpensesByFilter } from "../services/expenseService";
import { deleteIncomeById, fetchIncomesByFilter } from "../services/incomeService";
import { getApiErrorMessage } from "../utils/format";

export default function useTransactionHistory() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeType, setActiveType] = useState("expense");

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [expenses, incomes] = await Promise.all([
        fetchExpensesByFilter("all"),
        fetchIncomesByFilter("all")
      ]);

      const merged = [
        ...expenses.map((expense) => ({ ...expense, type: "expense" })),
        ...incomes.map((income) => ({ ...income, type: "income" }))
      ];

      merged.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setAllTransactions(merged);
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được lịch sử giao dịch"));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = useCallback((item) => {
    const isIncome = item.type === "income";
    Alert.alert("Xác nhận", `Bạn có chắc muốn xóa khoản ${isIncome ? "thu nhập" : "chi tiêu"} này?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            if (isIncome) {
              await deleteIncomeById(item.id);
            } else {
              await deleteExpenseById(item.id);
            }
            loadData();
          } catch (error) {
            Alert.alert("Thất bại", getApiErrorMessage(error, "Không thể xóa giao dịch"));
          }
        }
      }
    ]);
  }, [loadData]);

  const nextMonth = () => {
    setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const prevMonth = () => {
    setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const filteredTransactions = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const keyword = searchQuery.toLowerCase().trim();

    return allTransactions.filter((transaction) => {
      if (transaction.type !== activeType) return false;

      const transactionDate = new Date(transaction.createdAt || transaction.date);
      const isSameMonth = transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
      if (!isSameMonth) return false;

      if (!keyword) return true;

      return (
        (transaction.name || "").toLowerCase().includes(keyword) ||
        (transaction.note || "").toLowerCase().includes(keyword) ||
        (transaction.categoryName || "").toLowerCase().includes(keyword)
      );
    });
  }, [activeType, allTransactions, currentMonth, searchQuery]);

  const displayedTransactions = useMemo(() => {
    if (selectedDay === null) return filteredTransactions;
    return filteredTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt || transaction.date);
      return transactionDate.getDate() === selectedDay;
    });
  }, [filteredTransactions, selectedDay]);

  const monthlySummary = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let income = 0;
    let expense = 0;

    allTransactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.createdAt || transaction.date);
      if (transactionDate.getFullYear() !== year || transactionDate.getMonth() !== month) return;
      if (transaction.type === "income") income += Number(transaction.amount || 0);
      else expense += Number(transaction.amount || 0);
    });

    return { income, expense, net: income - expense };
  }, [allTransactions, currentMonth]);

  const groupedTransactions = useMemo(() => groupTransactionsByDate(displayedTransactions), [displayedTransactions]);

  const daysInMonth = useMemo(() => buildDaysInMonth(currentMonth), [currentMonth]);

  return {
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
  };
}

export function buildDaysInMonth(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let index = 0; index < firstDayIndex; index += 1) {
    days.push({ id: `empty-${index}`, day: null });
  }
  for (let day = 1; day <= totalDays; day += 1) {
    days.push({ id: `day-${day}`, day });
  }
  return days;
}

export function groupTransactionsByDate(transactions) {
  const groups = {};
  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.createdAt || transaction.date);
    const dateKey = transactionDate.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = { date: transactionDate, items: [], totalIncome: 0, totalExpense: 0 };
    }
    groups[dateKey].items.push(transaction);
    if (transaction.type === "income") groups[dateKey].totalIncome += Number(transaction.amount || 0);
    else groups[dateKey].totalExpense += Number(transaction.amount || 0);
  });

  return Object.values(groups).sort((a, b) => b.date - a.date);
}
