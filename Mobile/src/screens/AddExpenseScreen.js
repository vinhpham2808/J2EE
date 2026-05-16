import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import http from "../services/http";
import { fetchCategoriesByType } from "../services/categoryService";
import { API_ENDPOINTS } from "../constants/api";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { formatCurrencyInput, getApiErrorMessage, parseCurrencyInput, todayIso } from "../utils/format";
import { PickDateField } from "../utils/pickDate";
import { COLORS } from "../constants/colors";
import ExpenseNoteField from "../components/ExpenseNoteField";
import { parseNote, suggestCategory } from "../utils/smartNoteParser";

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialData = route.params?.initialData;

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [splitInfo, setSplitInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const data = await fetchCategoriesByType("expense");
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(String(data[0].id));
        }
      } catch (error) {
        Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được danh mục"));
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Cập nhật form nếu có initialData mới từ route params (từ Voice AI bên ngoài)
  useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.amount) setAmount(formatCurrencyInput(String(initialData.amount)));
      if (initialData.date) setDate(initialData.date);
      if (initialData.note) setNote(initialData.note);
      
      if (initialData.categoryHint && categories.length > 0) {
        const hint = initialData.categoryHint.toLowerCase();
        const matched = categories.find(c => 
          c.name.toLowerCase().includes(hint) || hint.includes(c.name.toLowerCase())
        );
        if (matched) setCategoryId(String(matched.id));
      }
    }
  }, [initialData, categories]);

  /** Xử lý kết quả từ voice input — tự động điền form */
  const handleVoiceResult = (voiceText) => {
    if (!voiceText) return;

    const parsed = parseNote(voiceText);

    // Điền số tiền nếu parse được
    if (parsed.amount > 0) {
      setAmount(formatCurrencyInput(String(parsed.amount)));
    }

    // Điền tên khoản chi từ phần note (rút gọn)
    if (parsed.note) {
      // Lấy ~40 ký tự đầu làm tên
      const shortName = parsed.note.length > 40
        ? parsed.note.substring(0, 40) + "..."
        : parsed.note;
      setName(shortName);
    }

    // Lưu split info để hiển thị
    if (parsed.splitInfo?.splits?.length > 0) {
      setSplitInfo(parsed.splitInfo);
    } else {
      setSplitInfo(null);
    }

    // Gợi ý category
    const suggested = suggestCategory(parsed.note, categories);
    if (suggested) {
      setCategoryId(String(suggested.id));
    }
  };

  const onSave = async () => {
    const normalizedName = name.trim();
    const numericAmount = parseCurrencyInput(amount);

    if (!normalizedName) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Tên khoản chi.");
      return;
    }

    if (!amount.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Số tiền.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert("Sai số tiền", "Vui lòng nhập số tiền hợp lệ > 0.");
      return;
    }

    if (!categoryId) {
      Alert.alert("Thiếu danh mục", "Vui lòng chọn danh mục.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: normalizedName,
        amount: numericAmount,
        categoryId: Number(categoryId),
        date,
        icon: "💸"
      };

      // Gửi note nếu có
      const noteTrimmed = note.trim();
      if (noteTrimmed) {
        payload.note = noteTrimmed;
      }

      // Gửi split info nếu có
      if (splitInfo?.splits?.length > 0) {
        payload.splitExpense = splitInfo.splits.map((s) => ({
          person: s.person || null,
          amount: s.share
        }));
      }

      await http.post(API_ENDPOINTS.ADD_EXPENSE, payload);

      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.create.expense, [
        {
          text: "OK",
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      Alert.alert("Lưu thất bại", getApiErrorMessage(error, "Không thể tạo khoản chi"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Tên khoản chi</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ví dụ: Mua đồ ăn" />

      <Text style={styles.label}>Số tiền</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={(value) => setAmount(formatCurrencyInput(value))}
        keyboardType="numeric"
        placeholder="Ví dụ: 120.000"
      />

      {/* Ghi chú + Voice Input */}
      <ExpenseNoteField
        value={note}
        onChange={setNote}
        onVoiceResult={handleVoiceResult}
      />

      {/* Hiển thị thông tin split expense nếu có */}
      {splitInfo && splitInfo.splits.length > 0 && (
        <View style={styles.splitBanner}>
          <Text style={styles.splitTitle}>🔀 Phát hiện chia tiền</Text>
          {splitInfo.splits.map((s, idx) => (
            <Text key={idx} style={styles.splitText}>
              {s.label}
            </Text>
          ))}
          {splitInfo.myShareLabel && (
            <Text style={styles.splitMyShare}>{splitInfo.myShareLabel}</Text>
          )}
        </View>
      )}

      <PickDateField label="Ngày" value={date} onChange={setDate} />

      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.categoryContainer}>
        {categoryLoading ? (
          <Text style={styles.categoryStateText}>Đang tải danh mục...</Text>
        ) : categories.length === 0 ? (
          <Text style={styles.categoryStateText}>
            Chưa có danh mục chi tiêu. Hãy tạo danh mục ở tab Danh mục.
          </Text>
        ) : categories.map((category) => {
          const active = String(category.id) === String(categoryId);
          return (
            <Pressable
              key={String(category.id)}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setCategoryId(String(category.id))}
            >
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{category.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={[styles.saveButton, submitting && styles.saveButtonDisabled]} onPress={onSave} disabled={submitting}>
        <Text style={styles.saveButtonText}>{submitting ? "Đang lưu..." : "Lưu chi tiêu"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  content: {
    padding: 16
  },
  label: {
    color: COLORS.TEXT,
    marginBottom: 6,
    fontWeight: "600"
  },
  input: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
    color: COLORS.TEXT
  },
  splitBanner: {
    backgroundColor: COLORS.INFO_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d0e3f5",
    padding: 12,
    marginBottom: 12
  },
  splitTitle: {
    fontWeight: "700",
    color: COLORS.INFO,
    fontSize: 14,
    marginBottom: 6
  },
  splitText: {
    fontSize: 13,
    color: COLORS.TEXT,
    marginBottom: 2
  },
  splitMyShare: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    marginTop: 4
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16
  },
  categoryChip: {
    width: "48%",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.CARD,
    marginBottom: 8,
    alignItems: "center"
  },
  categoryChipActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.ROSE_MIST
  },
  categoryText: {
    color: COLORS.TEXT,
    textAlign: "center"
  },
  categoryTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "700"
  },
  categoryStateText: {
    width: "100%",
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center"
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700"
  }
});
