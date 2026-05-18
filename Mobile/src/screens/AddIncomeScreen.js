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

export default function AddIncomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialData = route.params?.initialData;

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [name, setName] = useState(initialData?.name || "");
  const [amount, setAmount] = useState(initialData?.amount ? formatCurrencyInput(String(initialData?.amount)) : "");
  const [date, setDate] = useState(initialData?.date || todayIso());
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const data = await fetchCategoriesByType("income");
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

  // Cập nhật form nếu có initialData mới từ route params
  useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.amount) setAmount(formatCurrencyInput(String(initialData.amount)));
      if (initialData.date) setDate(initialData.date);
      
      if (initialData.categoryHint && categories.length > 0) {
        const hint = initialData.categoryHint.toLowerCase();
        const matched = categories.find(c => 
          c.name.toLowerCase().includes(hint) || hint.includes(c.name.toLowerCase())
        );
        if (matched) setCategoryId(String(matched.id));
      }
    }
  }, [initialData, categories]);

  const onSave = async () => {
    const normalizedName = name.trim();
    const numericAmount = parseCurrencyInput(amount);

    if (!normalizedName) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Tên khoản thu.");
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
      await http.post(API_ENDPOINTS.ADD_INCOME, {
        name: normalizedName,
        amount: numericAmount,
        categoryId: Number(categoryId),
        date,
        icon: "💰"
      });

      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.create.income, [
        {
          text: "OK",
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      Alert.alert("Lưu thất bại", getApiErrorMessage(error, "Không thể tạo khoản thu"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Tên khoản thu</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ví dụ: Lương tháng" />

      <Text style={styles.label}>Số tiền</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={(value) => setAmount(formatCurrencyInput(value))}
        keyboardType="numeric"
        placeholder="Ví dụ: 15.000.000"
      />

      <PickDateField label="Ngày" value={date} onChange={setDate} />

      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.categoryContainer}>
        {categoryLoading ? (
          <Text style={styles.categoryStateText}>Đang tải danh mục...</Text>
        ) : categories.length === 0 ? (
          <Text style={styles.categoryStateText}>
            Chưa có danh mục thu nhập. Hãy tạo danh mục ở tab Danh mục.
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
        <Text style={styles.saveButtonText}>{submitting ? "Đang lưu..." : "Lưu thu nhập"}</Text>
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
    marginBottom: 12
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.CARD
  },
  categoryChipActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.ROSE_MIST
  },
  categoryText: {
    color: COLORS.TEXT
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
