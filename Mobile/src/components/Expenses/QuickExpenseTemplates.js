import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../../services/apiClient";
import { API_ENDPOINTS } from "../../constants/api";
import { COLORS, useAppColors } from "../../constants/colors";
import { fetchCategoriesByType } from "../../services/categoryService";
import { formatMoney, todayIso } from "../../utils/format";
import { JarPickerModal, TemplateFormModal } from "./QuickExpenseTemplateModals";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STORAGE_KEY = "quick_expense_templates";

const DEFAULT_TEMPLATES = [
  { id: "t1", emoji: "🍚", name: "Ăn cơm",   amount: 50000,  categoryId: null, jarId: null },
  { id: "t2", emoji: "☕", name: "Cà phê",    amount: 35000,  categoryId: null, jarId: null },
  { id: "t3", emoji: "⛽", name: "Xăng xe",   amount: 100000, categoryId: null, jarId: null },
  { id: "t4", emoji: "🛒", name: "Siêu thị",  amount: 200000, categoryId: null, jarId: null },
  { id: "t5", emoji: "🧋", name: "Trà sữa",   amount: 45000,  categoryId: null, jarId: null },
  { id: "t6", emoji: "🍜", name: "Bún phở",   amount: 60000,  categoryId: null, jarId: null },
];

export default function QuickExpenseTemplates({ onRefreshList }) {
  const colors = useAppColors();
  const [templates, setTemplates] = useState([]);
  const [jars, setJars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  // Modals state
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null); // null, or custom template

  // Fetch local templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        setTemplates(saved ? JSON.parse(saved) : DEFAULT_TEMPLATES);
      } catch {
        setTemplates(DEFAULT_TEMPLATES);
      }
    };
    loadTemplates();
  }, []);

  // Fetch jars and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jarsRes, catsRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.GET_JARS),
          fetchCategoriesByType("expense"),
        ]);
        setJars(Array.isArray(jarsRes.data) ? jarsRes.data : []);
        setCategories(Array.isArray(catsRes) ? catsRes : []);
      } catch (err) {
        console.error("Lỗi tải thông tin mẫu chi tiêu:", err);
      }
    };
    fetchData();
  }, []);

  // Save templates helper
  const saveTemplates = async (newTemplates) => {
    setTemplates(newTemplates);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
    } catch (err) {
      console.error("Lỗi lưu mẫu chi tiêu:", err);
    }
  };

  const handleUse = (template) => {
    if (loadingId) return;
    if (jars.length > 0) {
      setPendingTemplate(template);
    } else {
      submitExpense(template, null);
    }
  };

  const submitExpense = async (template, selectedJarId) => {
    setLoadingId(template.id);
    const categoryId = template.categoryId || (categories[0]?.id ?? null);
    try {
      const payload = {
        name: template.name,
        amount: Number(template.amount),
        date: todayIso(),
        categoryId: categoryId ? Number(categoryId) : null,
        icon: template.emoji || "💸",
        jarId: selectedJarId ? Number(selectedJarId) : null,
      };

      await apiClient.post(API_ENDPOINTS.ADD_EXPENSE, payload);
      Alert.alert("Thành công", `Đã ghi nhận nhanh: ${template.name} - ${formatMoney(template.amount)}`);
      
      if (typeof onRefreshList === "function") {
        onRefreshList();
      }
    } catch (err) {
      console.error("Lỗi tạo chi tiêu nhanh:", err);
      Alert.alert("Lỗi", "Không thể ghi nhận chi tiêu nhanh.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleJarPickerConfirm = (jarId) => {
    const template = pendingTemplate;
    setPendingTemplate(null);
    submitExpense(template, jarId);
  };

  const handleSaveTemplate = async (saved) => {
    let next;
    const isNew = !saved.id || saved.id.startsWith("t") && !templates.some(t => t.id === saved.id);
    if (isNew) {
      next = [...templates, { ...saved, id: `tpl_${Date.now()}` }];
    } else {
      next = templates.map(t => (t.id === saved.id ? saved : t));
    }
    await saveTemplates(next);
    setEditingTemplate(null);
  };

  const handleDelete = (id) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa mẫu chi tiêu này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const next = templates.filter(t => t.id !== id);
          await saveTemplates(next);
        }
      }
    ]);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER, shadowColor: colors.TEXT }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.zapIconCircle, { backgroundColor: colors.PRIMARY }]}>
            <Text style={styles.zapIconText}>⚡</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.TEXT }]}>Chi tiêu nhanh</Text>
            <Text style={[styles.headerSubtitle, { color: colors.TEXT_MUTED }]}>Ghi nhận ngay với 1 chạm</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={[styles.addTemplateBtn, { backgroundColor: colors.ROSE_MIST }]} onPress={() => setEditingTemplate({})}>
            <Text style={[styles.addTemplateBtnText, { color: colors.PRIMARY }]}>+ Thêm mẫu</Text>
          </Pressable>
          <Pressable style={[styles.expandBtn, { backgroundColor: colors.BG }]} onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={[styles.expandBtnText, { color: colors.TEXT_SECONDARY }]}>{isExpanded ? "▲" : "▼"}</Text>
          </Pressable>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.body}>
          {templates.length === 0 ? (
            <Pressable style={[styles.emptyState, { borderColor: colors.CARD_BORDER }]} onPress={() => setEditingTemplate({})}>
              <Text style={styles.emptyIcon}>⚡</Text>
              <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>Chưa có mẫu chi tiêu nhanh nào</Text>
              <Text style={[styles.emptyActionText, { color: colors.PRIMARY }]}>+ Tạo mẫu chi tiêu đầu tiên</Text>
            </Pressable>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
              {templates.map((t) => {
                const isLoading = loadingId === t.id;
                return (
                  <View key={t.id} style={styles.templateCardOuter}>
                    <Pressable
                      style={[styles.templateCard, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER }]}
                      onPress={() => handleUse(t)}
                      disabled={isLoading}
                    >
                      <Text style={styles.templateEmoji}>{t.emoji}</Text>
                      <Text style={[styles.templateName, { color: colors.TEXT }]} numberOfLines={1}>{t.name}</Text>
                      <View style={[styles.amountBadge, { backgroundColor: colors.PRIMARY_GLOW }]}>
                        <Text style={[styles.amountText, { color: colors.PRIMARY }]}>{formatMoney(t.amount)}</Text>
                      </View>

                      {isLoading && (
                        <View style={styles.loadingOverlay}>
                          <ActivityIndicator size="small" color={colors.PRIMARY} />
                        </View>
                      )}
                    </Pressable>

                    {/* Edit/Delete mini actions under hover style on mobile */}
                    <View style={styles.miniActionsRow}>
                      <Pressable style={[styles.miniActionBtn, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER }]} onPress={() => setEditingTemplate(t)}>
                        <Text style={styles.miniActionIcon}>✏️</Text>
                      </Pressable>
                      <Pressable style={[styles.miniActionBtn, styles.miniDeleteBtn, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER }]} onPress={() => handleDelete(t.id)}>
                        <Text style={[styles.miniActionIcon, { color: colors.EXPENSE }]}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              {/* Add card */}
              <Pressable style={[styles.addTemplateCard, { borderColor: colors.CARD_BORDER }]} onPress={() => setEditingTemplate({})}>
                <Text style={[styles.addCardIcon, { color: colors.TEXT_MUTED }]}>+</Text>
                <Text style={[styles.addCardText, { color: colors.TEXT_MUTED }]}>Thêm</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      )}

      {/* Hộp thoại Chọn Hũ trước khi chi tiêu */}
      {pendingTemplate !== null && jars.length > 0 && (
        <JarPickerModal
          template={pendingTemplate}
          jars={jars}
          onConfirm={handleJarPickerConfirm}
          onClose={() => setPendingTemplate(null)}
          styles={styles}
        />
      )}

      {/* Hộp thoại Thêm/Sửa Mẫu */}
      {editingTemplate !== null && (
        <TemplateFormModal
          template={editingTemplate}
          categories={categories}
          jars={jars}
          onSave={handleSaveTemplate}
          onClose={() => setEditingTemplate(null)}
          styles={styles}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 16,
    shadowColor: COLORS.TEXT,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  zapIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  zapIconText: {
    fontSize: 16,
    color: COLORS.WHITE,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.TEXT,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addTemplateBtn: {
    backgroundColor: COLORS.ROSE_MIST,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  addTemplateBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  expandBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORS.BG,
    alignItems: "center",
    justifyContent: "center",
  },
  expandBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.TEXT_SECONDARY,
  },
  body: {
    marginTop: 10,
  },
  scrollContainer: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  templateCardOuter: {
    width: (SCREEN_WIDTH - 32 - 14 * 2 - 10 * 3) / 3.5, // width dynamic
    alignItems: "center",
    gap: 6,
  },
  templateCard: {
    width: "100%",
    backgroundColor: COLORS.BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 10,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  templateEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  templateName: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.TEXT,
    textAlign: "center",
  },
  amountBadge: {
    backgroundColor: COLORS.PRIMARY_GLOW,
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  amountText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.PRIMARY_DARK,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 2,
  },
  miniActionBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  miniActionIcon: {
    fontSize: 9,
  },
  addTemplateCard: {
    width: (SCREEN_WIDTH - 32 - 14 * 2 - 10 * 3) / 3.5,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    minHeight: 85,
  },
  addCardIcon: {
    fontSize: 24,
    color: COLORS.TEXT_MUTED,
    fontWeight: "300",
  },
  addCardText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.TEXT_MUTED,
    marginTop: 4,
  },

  // Empty state styles
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 14,
    padding: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  emptyActionText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },

  // Modal styles for dropdowns & layouts
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: "center",
    padding: 16,
  },
  jarPickerContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    paddingBottom: 24,
  },
  jarPickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
  },
  jarPickerDesc: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
    marginTop: 12,
  },
  jarSelectCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
  },
  jarSelectRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  jarSelectIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  jarSelectIcon: {
    fontSize: 18,
  },
  jarSelectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT,
  },
  jarSelectArrow: {
    fontSize: 16,
    color: COLORS.TEXT_MUTED,
  },
  jarOptionsList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    marginTop: 4,
    maxHeight: 160,
    overflow: "hidden",
  },
  jarOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG,
  },
  jarOptionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  jarOptionName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT,
    marginRight: 4,
  },
  jarOptionBalance: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.WHITE,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.WHITE,
  },

  // Form styles
  formContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 8,
    maxHeight: "80%",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 12,
  },
  emojiNameRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  emojiBubbleBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.BG,
    borderWidth: 1.5,
    borderColor: COLORS.CARD_BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  emojiBubbleText: {
    fontSize: 22,
  },
  emojiBubbleArrow: {
    fontSize: 10,
    color: COLORS.TEXT_MUTED,
  },
  nameInput: {
    flex: 1,
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 12,
    color: COLORS.TEXT,
    fontSize: 14,
  },
  emojiPresetsCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 10,
    marginBottom: 10,
  },
  emojiPresetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  emojiPresetCell: {
    width: (SCREEN_WIDTH - 40 - 20 - 6 * 9) / 10,
    height: (SCREEN_WIDTH - 40 - 20 - 6 * 9) / 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 6,
  },
  emojiPresetText: {
    fontSize: 16,
  },
  modalInput: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.TEXT,
    fontSize: 14,
    marginBottom: 10,
  },
  selectCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  selectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectValue: {
    fontSize: 14,
    color: COLORS.TEXT,
  },
  selectArrow: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
  },
  dropdownCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    marginBottom: 10,
    maxHeight: 150,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG,
  },
  dropdownItemText: {
    fontSize: 13,
    color: COLORS.TEXT,
  },
});
