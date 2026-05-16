import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { formatDate, formatMoney, getApiErrorMessage } from "../utils/format";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import { COLORS } from "../constants/colors";
import VoiceInputButton from "../components/VoiceInputButton";
import { downloadAndShareFile } from "../utils/fileDownload";

/** Highlight keyword trong text */
function HighlightText({ text, keyword }) {
  if (!keyword || !text) {
    return <Text>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${escapeRegex(keyword)})`, "gi"));
  return (
    <Text>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <Text key={i} style={styles.highlight}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Item chi tiêu — hiển thị note nếu có */
function ExpenseItem({ item, onDelete, searchKeyword }) {
  const amount = Number(item?.amount || 0);
  const note = item?.note || "";

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemMain}>
        <View style={styles.iconBubble}>
          <Text style={styles.iconText}>{item?.icon || "💸"}</Text>
        </View>

        <View style={styles.itemContent}>
          {searchKeyword ? (
            <HighlightText text={item?.name || "Chi tiêu"} keyword={searchKeyword} />
          ) : (
            <Text style={styles.itemName}>{item?.name || "Chi tiêu"}</Text>
          )}
          <Text style={styles.itemMeta}>{formatDate(item?.date)} • {item?.categoryName || "Khác"}</Text>
          {note ? (
            <View style={styles.noteRow}>
              <Text style={styles.noteIcon}>📝</Text>
              <Text style={styles.noteText} numberOfLines={2}>
                {note}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>- {formatMoney(amount)}</Text>
        <Pressable onPress={() => onDelete(item?.id)} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Xóa</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ExpenseScreen() {
  const navigation = useNavigation();
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Lọc expenses theo search query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;

    const q = searchQuery.toLowerCase().trim();
    return expenses.filter(
      (item) =>
        (item.name || "").toLowerCase().includes(q) ||
        (item.note || "").toLowerCase().includes(q) ||
        (item.categoryName || "").toLowerCase().includes(q)
    );
  }, [expenses, searchQuery]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
  }, [expenses]);

  const fetchExpenses = useCallback(async () => {
    const response = await http.get(API_ENDPOINTS.GET_ALL_EXPENSE);
    setExpenses(Array.isArray(response.data) ? response.data : []);
  }, []);

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

  const onDelete = async (id) => {
    if (!id) return;

    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa khoản chi này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await http.delete(API_ENDPOINTS.DELETE_EXPENSE(id));
            await fetchExpenses();
            Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.delete.expense);
          } catch (error) {
            Alert.alert("Xóa thất bại", getApiErrorMessage(error, "Không thể xóa khoản chi này"));
          }
        }
      }
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  const handleVoiceResult = async (text) => {
    try {
      const response = await http.post(API_ENDPOINTS.VOICE_PARSE, { text });
      const data = response.data;
      if (data) {
        navigation.navigate("AddExpense", { initialData: data });
      }
    } catch (error) {
      Alert.alert("Lỗi AI", getApiErrorMessage(error, "Không thể phân tích nội dung giọng nói"));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const now = new Date();
      const payload = { month: now.getMonth() + 1, year: now.getFullYear() };
      const res = await http.post(API_ENDPOINTS.EXPORT_EXPENSE, payload);
      if (res.data && res.data.presignedUrl) {
        await downloadAndShareFile(res.data.presignedUrl, `expense_report_${payload.month}_${payload.year}.xlsx`);
      } else {
        throw new Error("Không lấy được link tải file");
      }
    } catch (error) {
      Alert.alert("Lỗi xuất file", getApiErrorMessage(error, "Không thể xuất báo cáo"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
          <Text style={styles.summaryAmount}>{formatMoney(totalExpense)}</Text>
          <Text style={styles.summaryHint}>{expenses.length} giao dịch</Text>
        </View>

        <View style={styles.actionRowMain}>
          <Pressable style={styles.addButtonMain} onPress={() => navigation.navigate("AddExpense")}>
            <Text style={styles.addButtonText}>+ Thêm chi tiêu</Text>
          </Pressable>
          <VoiceInputButton onResult={handleVoiceResult} />
        </View>
        <Pressable 
          style={[styles.exportButton, isExporting && { opacity: 0.7 }]} 
          onPress={handleExport}
          disabled={isExporting}
        >
          <Text style={styles.exportText}>{isExporting ? "⏳ Đang tạo báo cáo..." : "📥 Tải báo cáo tháng này"}</Text>
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm kiếm ghi chú, tên chi tiêu..."
          placeholderTextColor={COLORS.TEXT_MUTED}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")} style={styles.searchClear}>
            <Text style={styles.searchClearText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => String(item?.id)}
        renderItem={({ item }) => (
          <ExpenseItem item={item} onDelete={onDelete} searchKeyword={searchQuery.trim()} />
        )}
        contentContainerStyle={[styles.listContent, !filteredExpenses.length && styles.listContentEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          filteredExpenses.length ? (
            <View>
              <IncomeExpenseChart data={filteredExpenses} title="Tổng quan chi tiêu" colorPrimary={COLORS.EXPENSE} />
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>
                  {searchQuery.trim()
                    ? `Kết quả tìm kiếm (${filteredExpenses.length})`
                    : "Danh sách chi tiêu"}
                </Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? "Không tìm thấy kết quả" : "Chưa có khoản chi nào"}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? "Thử tìm kiếm với từ khóa khác."
                : "Hãy thêm giao dịch đầu tiên để bắt đầu theo dõi chi tiêu dễ hơn."}
            </Text>
            {!searchQuery.trim() && (
              <Pressable style={styles.emptyAction} onPress={() => navigation.navigate("AddExpense")}>
                <Text style={styles.emptyActionText}>+ Thêm chi tiêu</Text>
              </Pressable>
            )}
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
    paddingTop: 50
  },
  summaryCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 12,
    shadowColor: COLORS.TEXT,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  summaryContent: {
    alignItems: "center"
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "700"
  },
  summaryAmount: {
    marginTop: 4,
    fontSize: 26,
    color: COLORS.EXPENSE,
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
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
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
    color: COLORS.EXPENSE,
    fontWeight: "800"
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: COLORS.EXPENSE_LIGHT,
    borderColor: "#fecdca",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  deleteText: {
    color: COLORS.EXPENSE,
    fontWeight: "700",
    fontSize: 12
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
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  emptyActionText: {
    color: COLORS.WHITE,
    fontWeight: "800"
  },

  // ─── Note ──────────────────────────────
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    gap: 4
  },
  noteIcon: {
    fontSize: 11,
    marginTop: 1
  },
  noteText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
    lineHeight: 16
  },

  // ─── Search bar ─────────────────────────
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 12,
    marginBottom: 10
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.TEXT
  },
  searchClear: {
    padding: 6
  },
  searchClearText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY
  },

  // ─── Highlight keyword ──────────────────
  highlight: {
    backgroundColor: "#fff3b0",
    fontWeight: "700",
    color: COLORS.TEXT
  }
});