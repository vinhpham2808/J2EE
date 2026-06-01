import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { formatCurrencyInput, formatDate, formatMoney, getApiErrorMessage, parseCurrencyInput, todayIso } from "../utils/format";
import { fetchCategoriesByType } from "../services/categoryService";
import { confirmReceiptImport } from "../services/receiptImportService";
import { PickDateField } from "../utils/pickDate";
import { CategoryVectorIcon, getIconColor } from "../utils/VectorIcons";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { getSafeAreaBottom, getSafeAreaTop } from "../utils/safeAreaSpacing";

// ═══════════════════════════════════════════════════════════
// Category Picker Modal cho từng item
// ═══════════════════════════════════════════════════════════
function CategoryPickerModal({ visible, categories, selectedId, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Chọn danh mục</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.pickerClose}>Đóng</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.pickerList}>
            {categories.map((cat) => {
              const isSel = String(cat.id) === String(selectedId);
              const iconColor = getIconColor(cat.icon);
              return (
                <Pressable
                  key={String(cat.id)}
                  style={[styles.pickerItem, isSel && styles.pickerItemActive]}
                  onPress={() => {
                    onSelect(String(cat.id));
                    onClose();
                  }}
                >
                  <View style={[styles.pickerIconBubble, { backgroundColor: iconColor + "18" }]}>
                    <CategoryVectorIcon iconValue={cat.icon} size={18} color={iconColor} />
                  </View>
                  <Text style={[styles.pickerItemText, isSel && styles.pickerItemTextActive]}>
                    {cat.name}
                  </Text>
                  {isSel && <Text style={styles.pickerCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// Item Row — editable receipt line item
// ═══════════════════════════════════════════════════════════
function ReceiptItemRow({ item, index, categories, onUpdate, onDelete }) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedCat = categories.find((c) => String(c.id) === String(item.categoryId));

  const handleAmountChange = (text) => {
    onUpdate(index, { ...item, amount: parseCurrencyInput(text) });
  };

  const handleNameChange = (text) => {
    onUpdate(index, { ...item, name: text });
  };

  const handleCategorySelect = (catId) => {
    const cat = categories.find((c) => String(c.id) === String(catId));
    onUpdate(index, {
      ...item,
      categoryId: catId ? Number(catId) : null,
      icon: cat?.icon || item.icon,
    });
  };

  const handleDateChange = (newDate) => {
    onUpdate(index, { ...item, date: newDate });
  };

  const iconColor = getIconColor(item.icon || selectedCat?.icon);

  return (
    <View style={styles.itemCard}>
      {/* Item Header */}
      <View style={styles.itemHeader}>
        <View style={styles.itemIndexBadge}>
          <Text style={styles.itemIndexText}>#{index + 1}</Text>
        </View>

        <Pressable onPress={() => onDelete(index)} style={styles.itemDeleteBtn}>
          <Text style={styles.itemDeleteText}>✕ Xóa</Text>
        </Pressable>
      </View>

      {/* Name */}
      <Text style={styles.fieldLabel}>Tên khoản chi</Text>
      <TextInput
        style={styles.textInput}
        value={item.name || ""}
        onChangeText={handleNameChange}
        placeholder="VD: Cơm trưa, Xăng xe..."
        placeholderTextColor={COLORS.TEXT_MUTED}
      />

      {/* Amount */}
      <Text style={styles.fieldLabel}>Số tiền (VNĐ)</Text>
      <TextInput
        style={styles.textInput}
        value={item.amount ? formatCurrencyInput(String(item.amount)) : ""}
        onChangeText={handleAmountChange}
        placeholder="0"
        placeholderTextColor={COLORS.TEXT_MUTED}
        keyboardType="numeric"
      />

      {/* Category + Date row */}
      <View style={styles.fieldRow}>
        <View style={styles.fieldHalf}>
          <Text style={styles.fieldLabel}>Danh mục</Text>
          <Pressable style={styles.categoryBtn} onPress={() => setPickerVisible(true)}>
            {selectedCat ? (
              <View style={styles.categoryBtnContent}>
                <View style={[styles.catIconSm, { backgroundColor: iconColor + "18" }]}>
                  <CategoryVectorIcon iconValue={selectedCat.icon} size={14} color={iconColor} />
                </View>
                <Text style={styles.categoryBtnText} numberOfLines={1}>
                  {selectedCat.name}
                </Text>
              </View>
            ) : (
              <Text style={styles.categoryBtnPlaceholder}>Chọn...</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.fieldHalf}>
          <PickDateField
            label="Ngày"
            value={item.date || todayIso()}
            onChange={handleDateChange}
          />
        </View>
      </View>

      {/* Category Hint (từ AI) */}
      {item.categoryHint && !item.categoryId && (
        <Text style={styles.hintText}>
          💡 Gợi ý: {item.categoryHint}
        </Text>
      )}

      <CategoryPickerModal
        visible={pickerVisible}
        categories={categories}
        selectedId={item.categoryId}
        onSelect={handleCategorySelect}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════════
export default function ReceiptPreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const analyzeResult = route.params?.analyzeResult;
  const merchant = analyzeResult?.merchant || "";
  const location = analyzeResult?.location || "";
  const receiptDate = analyzeResult?.receiptDate || todayIso();
  const initialItems = analyzeResult?.items || [];

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // States for Spending Jars
  const [jars, setJars] = useState([]);
  const [jarId, setJarId] = useState("");
  const [jarsLoading, setJarsLoading] = useState(true);

  // Normalize initial items
  useEffect(() => {
    if (initialItems.length > 0) {
      setItems(
        initialItems.map((it) => ({
          name: it.name || "",
          amount: it.amount ? Number(it.amount) : 0,
          categoryId: it.categoryId ? Number(it.categoryId) : null,
          categoryHint: it.categoryHint || "",
          icon: it.icon || "",
          date: it.date || receiptDate || todayIso(),
        }))
      );
    }
  }, [initialItems.length]);

  // Fetch expense categories
  useEffect(() => {
    const load = async () => {
      setCategoriesLoading(true);
      try {
        const data = await fetchCategoriesByType("expense");
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        // silently fail — categories just won't show in picker
      } finally {
        setCategoriesLoading(false);
      }
    };
    load();
  }, []);

  // Fetch Jars on mount
  useEffect(() => {
    const fetchJars = async () => {
      setJarsLoading(true);
      try {
        const res = await http.get(API_ENDPOINTS.GET_JARS);
        const data = Array.isArray(res.data) ? res.data : [];
        setJars(data);

        if (data.length > 0) {
          const parentWallet = data.find((j) => j.name === "Ví tổng");
          if (parentWallet) {
            setJarId(String(parentWallet.id));
          } else {
            setJarId(String(data[0].id));
          }
        }
      } catch (error) {
        console.error("Lỗi tải danh sách hũ:", error);
      } finally {
        setJarsLoading(false);
      }
    };

    fetchJars();
  }, []);

  // Total
  const totalAmount = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0),
    [items]
  );

  // Update single item
  const handleUpdateItem = (index, updated) => {
    setItems((prev) => prev.map((it, i) => (i === index ? updated : it)));
  };

  // Delete item
  const handleDeleteItem = (index) => {
    Alert.alert("Xóa mục này?", "Bạn sẽ không thể hoàn tác sau khi xác nhận.", [
      { text: "Giữ lại", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => setItems((prev) => prev.filter((_, i) => i !== index)),
      },
    ]);
  };

  // Validate
  const validateItems = () => {
    if (items.length === 0) {
      Alert.alert("Không có mục nào", "Hóa đơn cần ít nhất 1 khoản chi để lưu.");
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name || !it.name.trim()) {
        Alert.alert("Thiếu tên", `Khoản chi #${i + 1} chưa có tên.`);
        return false;
      }
      if (!it.amount || Number(it.amount) <= 0) {
        Alert.alert("Số tiền không hợp lệ", `Khoản chi #${i + 1} cần số tiền > 0.`);
        return false;
      }
      if (!it.categoryId) {
        Alert.alert("Thiếu danh mục", `Khoản chi #${i + 1} chưa chọn danh mục.`);
        return false;
      }
    }

    return true;
  };

  // Confirm
  const handleConfirm = async () => {
    if (!validateItems()) return;

    setSubmitting(true);
    try {
      const payload = {
        merchant,
        location,
        receiptDate,
        jarId: jarId ? Number(jarId) : null,
        items: items.map((it) => ({
          name: it.name.trim(),
          amount: Number(it.amount),
          categoryId: Number(it.categoryId),
          icon: it.icon || "",
          date: it.date || receiptDate,
        })),
      };

      const result = await confirmReceiptImport(payload);
      const count = result?.importedCount || items.length;

      Alert.alert(
        "✅ Nhập hóa đơn thành công",
        `Đã lưu ${count} khoản chi từ hóa đơn${merchant ? ` "${merchant}"` : ""}.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Lỗi xác nhận", getApiErrorMessage(error, "Không thể lưu hóa đơn. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  // Edge case: no items from backend
  if (!initialItems.length && !submitting) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🧾</Text>
        <Text style={styles.emptyTitle}>Không nhận diện được khoản chi</Text>
        <Text style={styles.emptyText}>
          Gemini không tìm thấy mặt hàng nào trong ảnh.{"\n"}
          Hãy thử lại với ảnh rõ hơn hoặc nhập tay.
        </Text>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets) }]}>
      {/* Header Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          🧾 {merchant || "Hóa đơn"}
        </Text>
        {location ? <Text style={styles.summaryLocation}>📍 {location}</Text> : null}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryDate}>📅 {formatDate(receiptDate)}</Text>
          <Text style={styles.summaryCount}>{items.length} mục</Text>
        </View>
        <Text style={styles.summaryTotal}>Tổng: {formatMoney(totalAmount)}</Text>
      </View>

      {/* Item List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: getSafeAreaBottom(insets) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hũ chi tiêu liên kết */}
        <View style={styles.jarsCard}>
          <Text style={styles.jarsLabel}>Hũ chi tiêu áp dụng</Text>
          {jarsLoading ? (
            <Text style={styles.mutedText}>Đang tải danh sách hũ...</Text>
          ) : jars.length === 0 ? (
            <Text style={styles.mutedText}>Không tìm thấy hũ chi tiêu nào.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.jarsRow}
            >
              {jars.map((j) => {
                const isSelected = String(j.id) === jarId;
                return (
                  <Pressable
                    key={j.id}
                    onPress={() => setJarId(isSelected ? "" : String(j.id))}
                    style={[
                      styles.jarItem,
                      isSelected && {
                        borderColor: j.color || COLORS.PRIMARY,
                        backgroundColor: (j.color || COLORS.PRIMARY) + "12",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.jarEmojiBox,
                        { backgroundColor: (j.color || COLORS.PRIMARY) + "18" },
                      ]}
                    >
                      <Text style={styles.jarEmoji}>{j.icon || "🏺"}</Text>
                    </View>
                    <Text
                      style={[
                        styles.jarName,
                        isSelected && {
                          color: j.color || COLORS.PRIMARY,
                          fontWeight: "800",
                        },
                      ]}
                    >
                      {j.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {items.map((item, index) => (
          <ReceiptItemRow
            key={index}
            item={item}
            index={index}
            categories={categories}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </ScrollView>

      {/* Confirm + Back buttons */}
      <View style={styles.footer}>
        <Pressable
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.WHITE} size="small" />
          ) : (
            <Text style={styles.confirmButtonText}>
              ✅ Xác nhận lưu ({items.length} mục)
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.BG,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.TEXT, marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  backButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  backButtonText: { color: COLORS.WHITE, fontWeight: "700", fontSize: 15 },

  // Summary
  summaryCard: {
    backgroundColor: COLORS.CARD,
    margin: 16,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16,
  },
  summaryTitle: { fontSize: 18, fontWeight: "800", color: COLORS.TEXT, marginBottom: 4 },
  summaryLocation: { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginBottom: 6 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryDate: { fontSize: 13, color: COLORS.TEXT_SECONDARY },
  summaryCount: { fontSize: 13, color: COLORS.PRIMARY, fontWeight: "600" },
  summaryTotal: { fontSize: 20, fontWeight: "800", color: COLORS.EXPENSE },

  // List
  list: { flex: 1 },
  listContent: { padding: 16, paddingTop: 8, gap: 12, paddingBottom: 24 },

  // Item Card
  itemCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  itemIndexBadge: {
    backgroundColor: COLORS.PRIMARY + "18",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  itemIndexText: { fontSize: 12, fontWeight: "700", color: COLORS.PRIMARY },
  itemDeleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.EXPENSE_LIGHT,
  },
  itemDeleteText: { fontSize: 12, fontWeight: "600", color: COLORS.EXPENSE },

  // Fields
  fieldLabel: { fontSize: 12, fontWeight: "600", color: COLORS.TEXT_SECONDARY, marginBottom: 4, marginTop: 8 },
  textInput: {
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.TEXT,
  },
  fieldRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  fieldHalf: { flex: 1 },

  // Category btn
  categoryBtn: {
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    minHeight: 42,
  },
  categoryBtnContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  catIconSm: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBtnText: { fontSize: 13, color: COLORS.TEXT, flex: 1 },
  categoryBtnPlaceholder: { fontSize: 13, color: COLORS.TEXT_MUTED },

  // Hint
  hintText: { fontSize: 12, color: COLORS.WARNING, marginTop: 6, fontStyle: "italic" },

  // Category Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "65%",
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
  },
  pickerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.TEXT },
  pickerClose: { fontSize: 14, fontWeight: "600", color: COLORS.PRIMARY },
  pickerList: { padding: 8 },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 10,
  },
  pickerItemActive: { backgroundColor: COLORS.ROSE_MIST },
  pickerIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerItemText: { fontSize: 14, color: COLORS.TEXT, flex: 1 },
  pickerItemTextActive: { fontWeight: "700", color: COLORS.PRIMARY },
  pickerCheck: { fontSize: 16, color: COLORS.PRIMARY, fontWeight: "700" },

  // Footer
  footer: {
    padding: 16,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: COLORS.CARD_BORDER,
    gap: 10,
  },
  confirmButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  confirmButtonText: { color: COLORS.WHITE, fontWeight: "800", fontSize: 16 },
  cancelButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  cancelButtonText: { color: COLORS.TEXT_SECONDARY, fontWeight: "600", fontSize: 14 },

  // Jars Selector Styles
  jarsCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 4,
  },
  jarsLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  mutedText: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  jarsRow: {
    flexDirection: "row",
    gap: 8,
  },
  jarItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  jarEmojiBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  jarEmoji: {
    fontSize: 12,
  },
  jarName: {
    fontSize: 12,
    color: COLORS.TEXT,
    fontWeight: "600",
  },
});
