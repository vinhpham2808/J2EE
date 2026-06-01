import React, { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { formatDate, formatMoney, getApiErrorMessage, todayIso } from "../utils/format";
import { PickDateField } from "../utils/pickDate";
import { COLORS } from "../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getSafeAreaBottom, getSafeAreaTop } from "../utils/safeAreaSpacing";

function TransactionItem({ item, type }) {
  return (
    <View style={styles.item}>
      <View>
        <Text style={styles.itemName}>{item?.name || "Giao dịch"}</Text>
        <Text style={styles.itemDate}>{formatDate(item?.date)}</Text>
      </View>
      <Text style={[styles.itemAmount, type === "expense" ? styles.expense : styles.income]}>
        {type === "expense" ? "- " : "+ "}{formatMoney(item?.amount)}
      </Text>
    </View>
  );
}

export default function FilterScreen() {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState("expense");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [keyword, setKeyword] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const onApply = async () => {
    setLoading(true);
    try {
      const response = await http.post(API_ENDPOINTS.APPLY_FILTERS, {
        type,
        startDate,
        endDate,
        keyword,
        sortField,
        sortOrder
      });

      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      Alert.alert("Lọc thất bại", getApiErrorMessage(error, "Không thể lọc dữ liệu"));
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setKeyword("");
    setSortField("date");
    setSortOrder("desc");
    setResults([]);
  };

  return (
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets) }]}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Lọc giao dịch nâng cao</Text>

        <View style={styles.row}>
          <Pressable
            style={[styles.typeButton, type === "expense" && styles.typeButtonActiveExpense]}
            onPress={() => setType("expense")}
          >
            <Text style={[styles.typeText, type === "expense" && styles.typeTextActive]}>Chi tiêu</Text>
          </Pressable>
          <Pressable
            style={[styles.typeButton, type === "income" && styles.typeButtonActiveIncome]}
            onPress={() => setType("income")}
          >
            <Text style={[styles.typeText, type === "income" && styles.typeTextActive]}>Thu nhập</Text>
          </Pressable>
        </View>

        <PickDateField label="Từ ngày" value={startDate} onChange={setStartDate} maximumDate={endDate} />
        <PickDateField label="Đến ngày" value={endDate} onChange={setEndDate} minimumDate={startDate} />

        <TextInput style={styles.input} value={keyword} onChangeText={setKeyword} placeholder="Từ khóa" placeholderTextColor="#98a2b3" />

        <View style={styles.row}>
          <Pressable
            style={[styles.chip, sortField === "date" && styles.chipActive]}
            onPress={() => setSortField("date")}
          >
            <Text style={[styles.chipText, sortField === "date" && styles.chipTextActive]}>Ngày</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, sortField === "amount" && styles.chipActive]}
            onPress={() => setSortField("amount")}
          >
            <Text style={[styles.chipText, sortField === "amount" && styles.chipTextActive]}>Số tiền</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, sortField === "name" && styles.chipActive]}
            onPress={() => setSortField("name")}
          >
            <Text style={[styles.chipText, sortField === "name" && styles.chipTextActive]}>Tên</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Pressable
            style={[styles.chip, sortOrder === "desc" && styles.chipActive]}
            onPress={() => setSortOrder("desc")}
          >
            <Text style={[styles.chipText, sortOrder === "desc" && styles.chipTextActive]}>Giảm dần</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, sortOrder === "asc" && styles.chipActive]}
            onPress={() => setSortOrder("asc")}
          >
            <Text style={[styles.chipText, sortOrder === "asc" && styles.chipTextActive]}>Tăng dần</Text>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={clearFilters}>
            <Text style={styles.secondaryButtonText}>Xóa lọc</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={onApply}>
            <Text style={styles.primaryButtonText}>{loading ? "Đang lọc..." : "Áp dụng"}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, index) => String(item?.id || `${type}-${index}`)}
        renderItem={({ item }) => <TransactionItem item={item} type={type} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: getSafeAreaBottom(insets) }]}
        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có kết quả lọc</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, padding: 16 },
  formCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 12
  },
  formTitle: { color: COLORS.TEXT, fontWeight: "700", fontSize: 16, marginBottom: 10 },
  input: {
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
    color: COLORS.TEXT
  },
  row: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  typeButton: {
    flex: 1,
    minWidth: 120,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 10,
    paddingVertical: 10
  },
  typeButtonActiveExpense: { backgroundColor: COLORS.EXPENSE_LIGHT, borderColor: COLORS.EXPENSE },
  typeButtonActiveIncome: { backgroundColor: COLORS.INCOME_LIGHT, borderColor: COLORS.INCOME },
  typeText: { color: COLORS.TEXT, fontWeight: "600" },
  typeTextActive: { color: COLORS.TEXT, fontWeight: "700" },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: COLORS.CARD
  },
  chipActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.ROSE_MIST },
  chipText: { color: COLORS.TEXT },
  chipTextActive: { color: COLORS.PRIMARY, fontWeight: "700" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 2
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  secondaryButtonText: { color: COLORS.TEXT, fontWeight: "700" },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  primaryButtonText: { color: COLORS.WHITE, fontWeight: "700" },
  listContent: { gap: 10, paddingBottom: 24 },
  item: {
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  itemName: { color: COLORS.TEXT, fontWeight: "700" },
  itemDate: { color: COLORS.TEXT_SECONDARY, marginTop: 3, fontSize: 12 },
  itemAmount: { fontWeight: "700" },
  expense: { color: COLORS.EXPENSE },
  income: { color: COLORS.INCOME },
  emptyText: { textAlign: "center", color: COLORS.TEXT_SECONDARY, marginTop: 20 }
});
