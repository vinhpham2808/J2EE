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

const FILTER_TYPES = {
  current: "current",
  all: "all",
  specific: "specific"
};

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
        <Pressable onPress={() => onDelete(item?.id)} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Xóa</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function IncomeScreen() {
  const navigation = useNavigation();
  const [incomes, setIncomes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState(FILTER_TYPES.current);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const totalIncome = useMemo(() => {
    return incomes.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
  }, [incomes]);

  const fetchIncomes = useCallback(async () => {
    if (filterType === FILTER_TYPES.specific && !selectedMonth.trim()) {
      setIncomes([]);
      return;
    }

    const params = {};
    if (filterType === FILTER_TYPES.all) {
      params.all = true;
    }

    if (filterType === FILTER_TYPES.specific) {
      const [year, month] = selectedMonth.split("-");
      if (!year || !month) {
        setIncomes([]);
        return;
      }

      params.year = Number(year);
      params.month = Number(month);
    }

    try {
      const response = await http.get(API_ENDPOINTS.GET_ALL_INCOMES, { params });
      setIncomes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Fetch incomes error:", error);
    }
  }, [filterType, selectedMonth]);

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

  const onDelete = async (id) => {
    if (!id) return;

    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa khoản thu này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await http.delete(API_ENDPOINTS.DELETE_INCOME(id));
            await fetchIncomes();
            Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.delete.income);
          } catch (error) {
            Alert.alert("Xóa thất bại", getApiErrorMessage(error, "Không thể xóa khoản thu này"));
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
        navigation.navigate("AddIncome", { initialData: data });
      }
    } catch (error) {
      Alert.alert("Lỗi AI", getApiErrorMessage(error, "Không thể phân tích nội dung giọng nói"));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const now = new Date();
      let payload = { month: now.getMonth() + 1, year: now.getFullYear() };
      
      if (filterType === FILTER_TYPES.specific && selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        payload = { month: Number(month), year: Number(year) };
      }

      const res = await http.post(API_ENDPOINTS.EXPORT_INCOME, payload);
      if (res.data && res.data.presignedUrl) {
        await downloadAndShareFile(res.data.presignedUrl, `income_report_${payload.month}_${payload.year}.xlsx`);
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
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Khung thời gian</Text>
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, filterType === FILTER_TYPES.current && styles.filterChipActive]}
            onPress={() => {
              setFilterType(FILTER_TYPES.current);
              setSelectedMonth("");
            }}
          >
            <Text style={[styles.filterChipText, filterType === FILTER_TYPES.current && styles.filterChipTextActive]}>Tháng này</Text>
          </Pressable>

          <Pressable
            style={[styles.filterChip, filterType === FILTER_TYPES.all && styles.filterChipActive]}
            onPress={() => {
              setFilterType(FILTER_TYPES.all);
              setSelectedMonth("");
            }}
          >
            <Text style={[styles.filterChipText, filterType === FILTER_TYPES.all && styles.filterChipTextActive]}>Tất cả</Text>
          </Pressable>

          <Pressable
            style={[styles.filterChip, styles.filterChipLast, filterType === FILTER_TYPES.specific && styles.filterChipActive]}
            onPress={() => setFilterType(FILTER_TYPES.specific)}
          >
            <Text style={[styles.filterChipText, filterType === FILTER_TYPES.specific && styles.filterChipTextActive]}>Chọn tháng</Text>
          </Pressable>
        </View>

        {filterType === FILTER_TYPES.specific ? (
          <TextInput
            style={styles.monthInput}
            value={selectedMonth}
            onChangeText={setSelectedMonth}
            placeholder="YYYY-MM (ví dụ: 2026-03)"
            placeholderTextColor="#98a2b3"
          />
        ) : null}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng thu nhập</Text>
        <Text style={styles.summaryAmount}>{formatMoney(totalIncome)}</Text>
        <Text style={styles.summaryHint}>{incomes.length} giao dịch</Text>

        <View style={styles.actionRowMain}>
          <Pressable style={styles.addButtonMain} onPress={() => navigation.navigate("AddIncome")}>
            <Text style={styles.addButtonText}>+ Thêm thu nhập</Text>
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

      <FlatList
        data={incomes}
        keyExtractor={(item) => String(item?.id)}
        renderItem={({ item }) => <IncomeItem item={item} onDelete={onDelete} />}
        contentContainerStyle={[styles.listContent, !incomes.length && styles.listContentEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          incomes.length ? (
            <View>
              <IncomeExpenseChart data={incomes} title="Tổng quan thu nhập" colorPrimary={COLORS.INCOME} />
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Danh sách thu nhập</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💹</Text>
            <Text style={styles.emptyTitle}>Chưa có dữ liệu thu nhập</Text>
            <Text style={styles.emptyText}>
              {filterType === FILTER_TYPES.specific && !selectedMonth.trim()
                ? "Nhập tháng theo định dạng YYYY-MM để xem dữ liệu."
                : "Hãy thêm khoản thu đầu tiên để theo dõi tài chính rõ ràng hơn."}
            </Text>
            <View style={styles.actionRowMain}>
              <Pressable style={[styles.emptyAction, { flex: 1 }]} onPress={() => navigation.navigate("AddIncome")}>
                <Text style={styles.emptyActionText}>+ Thêm thu nhập</Text>
              </Pressable>
            </View>
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
    paddingTop: 24
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
  monthInput: {
    marginTop: 10,
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: COLORS.TEXT
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
    backgroundColor: "#fef3f2",
    borderColor: "#fecdca",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  deleteText: {
    color: "#b42318",
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