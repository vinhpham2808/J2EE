import React, { useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { formatDate, formatMoney, getApiErrorMessage } from "../utils/format";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import { COLORS } from "../constants/colors";
import { CategoryVectorIcon, getIconColor } from "../utils/VectorIcons";
import VoiceInputButton from "../components/VoiceInputButton";
import { downloadAndShareFile } from "../utils/fileDownload";
import { AuthContext } from "../components/AuthContext";
import { analyzeReceiptFile } from "../services/receiptImportService";
import ShowMoreButton, { useVisibleItems } from "../components/ShowMoreButton";
import QuickExpenseTemplates from "../components/QuickExpenseTemplates";
import { getSafeAreaBottom, getSafeAreaTop } from "../utils/safeAreaSpacing";

const FILTER_TYPES = {
  current: "current",
  all: "all"
};

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
  const iconColor = getIconColor(item?.icon);

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemMain}>
        <View style={[styles.iconBubble, { backgroundColor: iconColor + "18" }]}>
          <CategoryVectorIcon iconValue={item?.icon} size={18} color={iconColor} />
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
        <Pressable
          onPress={() => onDelete(item?.id)}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Xóa chi tiêu"
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ExpenseScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState(FILTER_TYPES.current);
  const [isExporting, setIsExporting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const subscriptionPlan = String(user?.subscriptionPlan || "FREE").toUpperCase();
  const isPremium = subscriptionPlan === "PREMIUM";

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

  const {
    visibleItems: visibleExpenses,
    canToggle: canToggleExpenses,
    expanded: expandedExpenses,
    toggle: toggleExpenses
  } = useVisibleItems(filteredExpenses, {
    initialCount: 3,
    mode: "toggle",
    resetKey: `${filterType}|${searchQuery.trim()}`
  });

  const fetchExpenses = useCallback(async () => {
    const params = {};
    if (filterType === FILTER_TYPES.all) {
      params.all = true;
    }

    const response = await http.get(API_ENDPOINTS.GET_ALL_EXPENSE, { params });
    setExpenses(Array.isArray(response.data) ? response.data : []);
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

  /** Điều hướng sang ReceiptPreviewScreen với kết quả phân tích */
  const navigateToPreview = async (fileAsset) => {
    setIsScanning(true);
    try {
      const analyzeResult = await analyzeReceiptFile(fileAsset);
      if (!analyzeResult?.items?.length) {
        Alert.alert(
          "Không nhận diện được",
          "Gemini không tìm thấy khoản chi nào trong tệp. Hãy thử tệp khác hoặc nhập tay."
        );
        return;
      }
      navigation.navigate("ReceiptPreview", { analyzeResult });
    } catch (error) {
      Alert.alert(
        "Lỗi phân tích",
        getApiErrorMessage(error, "Không thể phân tích hóa đơn. Vui lòng thử lại.")
      );
    } finally {
      setIsScanning(false);
    }
  };

  /** Chụp ảnh bằng camera */
  const handlePickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền bị từ chối", "Cần cấp quyền camera để chụp hóa đơn.");
      return;
    }
    let result;
    try {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: false,
      });
    } catch (e) {
      Alert.alert("Lỗi", "Không thể mở camera: " + (e.message || ""));
      return;
    }
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.uri) return;
    await navigateToPreview(asset);
  };

  /** Chọn ảnh từ thư viện */
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền bị từ chối", "Cần cấp quyền thư viện ảnh để chọn hóa đơn.");
      return;
    }
    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: false,
      });
    } catch (e) {
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh: " + (e.message || ""));
      return;
    }
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];

    const MAX_SIZE = 10 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > MAX_SIZE) {
      Alert.alert("Ảnh quá lớn", "Vui lòng chọn ảnh dưới 10 MB.");
      return;
    }
    await navigateToPreview(asset);
  };

  /** Chọn file PDF từ bộ nhớ */
  const handlePickPdf = async () => {
    let result;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
    } catch (e) {
      Alert.alert("Lỗi", "Không thể mở trình chọn file: " + (e.message || ""));
      return;
    }

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];

    const MAX_SIZE = 10 * 1024 * 1024;
    if (asset.size && asset.size > MAX_SIZE) {
      Alert.alert("File quá lớn", "Vui lòng chọn file PDF dưới 10 MB.");
      return;
    }

    await navigateToPreview({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || "application/pdf",
    });
  };

  const handleScanReceipt = async () => {
    // Premium gate
    if (!isPremium) {
      Alert.alert(
        "Tính năng Premium",
        "Quét hóa đơn bằng ảnh / PDF là tính năng dành riêng cho gói Premium.\n\nHãy nâng cấp tài khoản để sử dụng.",
        [
          { text: "Để sau", style: "cancel" },
          { text: "Nâng cấp", onPress: () => navigation.navigate("Payment") },
        ]
      );
      return;
    }

    Alert.alert("📎 Nhập từ hóa đơn", "Chọn nguồn tệp hóa đơn:", [
      { text: "📷 Chụp ảnh", onPress: handlePickCamera },
      { text: "🖼️ Chọn ảnh từ thư viện", onPress: handlePickImage },
      { text: "📄 Chọn file PDF", onPress: handlePickPdf },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const now = new Date();
      const isAllReport = filterType === FILTER_TYPES.all;
      const payload = isAllReport
        ? { all: true, month: now.getMonth() + 1, year: now.getFullYear() }
        : { month: now.getMonth() + 1, year: now.getFullYear() };
      const res = await http.post(API_ENDPOINTS.EXPORT_EXPENSE, payload);
      if (res.data && res.data.presignedUrl) {
        const fileName = isAllReport
          ? "expense_report_all_months.xlsx"
          : `expense_report_${payload.month}_${payload.year}.xlsx`;
        await downloadAndShareFile(res.data.presignedUrl, fileName);
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
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets) }]}>
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Khung thời gian</Text>
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, filterType === FILTER_TYPES.current && styles.filterChipActive]}
            onPress={() => setFilterType(FILTER_TYPES.current)}
          >
            <Text style={[styles.filterChipText, filterType === FILTER_TYPES.current && styles.filterChipTextActive]}>
              Tháng này
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterChip, styles.filterChipLast, filterType === FILTER_TYPES.all && styles.filterChipActive]}
            onPress={() => setFilterType(FILTER_TYPES.all)}
          >
            <Text style={[styles.filterChipText, filterType === FILTER_TYPES.all && styles.filterChipTextActive]}>
              Tất cả
            </Text>
          </Pressable>
        </View>
      </View>

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
          <Pressable
            style={[styles.scanButton, isScanning && { opacity: 0.6 }]}
            onPress={handleScanReceipt}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color={COLORS.PRIMARY} size="small" />
            ) : (
              <Text style={styles.scanButtonIcon}>📷</Text>
            )}
          </Pressable>
        </View>
        {!isPremium && (
          <Text style={styles.premiumHint}>
            🔒 Quét hóa đơn là tính năng Premium
          </Text>
        )}
        <Pressable 
          style={[styles.exportButton, isExporting && { opacity: 0.7 }]} 
          onPress={handleExport}
          disabled={isExporting}
        >
          <Text style={styles.exportText}>
            {isExporting
              ? "Đang tạo báo cáo..."
              : filterType === FILTER_TYPES.all
                ? "Tải báo cáo tất cả tháng"
                : "Tải báo cáo tháng này"}
          </Text>
        </Pressable>
      </View>

      <QuickExpenseTemplates onRefreshList={fetchExpenses} />

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
        data={visibleExpenses}
        keyExtractor={(item) => String(item?.id)}
        renderItem={({ item }) => (
          <ExpenseItem item={item} onDelete={onDelete} searchKeyword={searchQuery.trim()} />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: getSafeAreaBottom(insets) }, !filteredExpenses.length && styles.listContentEmpty]}
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
                <ShowMoreButton 
                  visible={canToggleExpenses} 
                  expanded={expandedExpenses} 
                  onPress={toggleExpenses} 
                />
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
  scanButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.CARD,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY + "40",
  },
  scanButtonIcon: {
    fontSize: 20,
  },
  premiumHint: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    textAlign: "center",
    marginTop: 6,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  deleteIcon: {
    color: COLORS.EXPENSE,
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
