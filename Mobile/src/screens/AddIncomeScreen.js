import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import http from "../services/http";
import { fetchCategoriesByType } from "../services/categoryService";
import { API_ENDPOINTS } from "../constants/api";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { formatCurrencyInput, getApiErrorMessage, parseCurrencyInput, todayIso, formatMoney } from "../utils/format";
import { PickDateField } from "../utils/pickDate";
import { COLORS } from "../constants/colors";
import CategoryGridSelector from "../components/CategoryGridSelector";
import { getSafeAreaContentStyle } from "../utils/safeAreaSpacing";

export default function AddIncomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const initialData = route.params?.initialData;

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [name, setName] = useState(initialData?.name || "");
  const [amount, setAmount] = useState(initialData?.amount ? formatCurrencyInput(String(initialData?.amount)) : "");
  const [date, setDate] = useState(initialData?.date || todayIso());
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // States cho tính năng hũ chi tiêu
  const [jars, setJars] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [showAllocations, setShowAllocations] = useState(true);

  // Fetch danh mục thu nhập
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

  // Fetch danh sách hũ chi tiêu
  useEffect(() => {
    const fetchJars = async () => {
      try {
        const res = await http.get(API_ENDPOINTS.GET_JARS);
        if (res.data) {
          setJars(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Lỗi tải hũ để phân bổ:", error);
      }
    };
    fetchJars();
  }, []);

  // Tự động tính toán phân bổ thu nhập khi số tiền hoặc danh sách hũ thay đổi
  useEffect(() => {
    const total = parseCurrencyInput(amount);
    if (jars.length > 0 && total > 0) {
      let remaining = total;
      const allocs = jars.map((jar, index) => {
        const pct = jar.targetPercentage ?? 0;
        let amt;
        if (index === jars.length - 1) {
          amt = remaining; // Hũ cuối nhận số tiền còn lại để tránh chênh lệch làm tròn
        } else {
          amt = Math.round((total * pct) / 100);
          remaining -= amt;
        }
        return {
          jarId: jar.id,
          jarName: jar.name,
          jarIcon: jar.icon,
          jarColor: jar.color,
          amount: amt,
          percentage: pct
        };
      });
      setAllocations(allocs);
    } else {
      setAllocations([]);
    }
  }, [amount, jars]);

  // Xử lý chỉnh sửa thủ công số tiền phân bổ cho từng hũ (Tự động cân đối)
  const handleAllocationAmountChange = (index, valueText) => {
    const newAmount = parseCurrencyInput(valueText);
    let diff = newAmount - allocations[index].amount;

    const newAllocs = [...allocations];
    newAllocs[index] = { ...newAllocs[index], amount: newAmount };

    // Tự động tăng/giảm các hũ khác để tổng luôn bằng số tiền thu nhập chính
    if (diff !== 0 && newAllocs.length > 1) {
      for (let i = 0; i < newAllocs.length; i++) {
        if (i !== index && diff !== 0) {
          let currentOtherAmount = newAllocs[i].amount;
          if (diff > 0) {
            // Tăng hũ này -> giảm hũ khác xuống tối đa 0
            const subtractAmount = Math.min(currentOtherAmount, diff);
            newAllocs[i].amount -= subtractAmount;
            diff -= subtractAmount;
          } else {
            // Giảm hũ này -> cộng bù tiền thừa vào hũ khác
            newAllocs[i].amount -= diff; // diff âm nên trừ đi âm là cộng thêm
            diff = 0;
          }
        }
      }
    }

    setAllocations(newAllocs);
  };

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
      const payload = {
        name: normalizedName,
        amount: numericAmount,
        categoryId: Number(categoryId),
        date,
        icon: "💰"
      };

      // Gửi allocations nếu đã có hũ chi tiêu và số tiền > 0
      if (jars.length > 0 && allocations.length > 0) {
        payload.allocations = allocations
          .filter((a) => a.amount > 0)
          .map((a) => ({ jarId: a.jarId, amount: a.amount }));
      }

      await http.post(API_ENDPOINTS.ADD_INCOME, payload);

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

  const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0);
  const incomeAmount = parseCurrencyInput(amount) || 0;
  const allocationDiff = incomeAmount - totalAllocated;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}>
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

      {/* Cụm Phân Bổ Hũ Chi Tiêu (Jar Allocations) */}
      {jars.length > 0 && incomeAmount > 0 && (
        <View style={styles.allocSection}>
          <Pressable
            style={styles.allocHeader}
            onPress={() => setShowAllocations(!showAllocations)}
          >
            <Text style={styles.allocHeaderTitle}>
              💰 Phân bổ vào {jars.length} hũ ({formatMoney(totalAllocated)} / {formatMoney(incomeAmount)})
            </Text>
            <Text style={styles.allocHeaderArrow}>
              {showAllocations ? "▲" : "▼"}
            </Text>
          </Pressable>

          {showAllocations && (
            <View style={styles.allocList}>
              {allocations.map((alloc, index) => (
                <View key={alloc.jarId} style={styles.allocRow}>
                  <View style={styles.allocRowLeft}>
                    <View
                      style={[
                        styles.allocJarIconBox,
                        { backgroundColor: (alloc.jarColor || COLORS.PRIMARY) + "18" },
                      ]}
                    >
                      <Text style={styles.allocJarIcon}>{alloc.jarIcon || "🏺"}</Text>
                    </View>
                    <View style={styles.allocJarInfo}>
                      <Text style={styles.allocJarName} numberOfLines={1}>
                        {alloc.jarName}
                      </Text>
                      <Text style={styles.allocJarPct}>Mục tiêu: {alloc.percentage}%</Text>
                    </View>
                  </View>
                  <TextInput
                    style={styles.allocInput}
                    value={formatCurrencyInput(String(alloc.amount))}
                    onChangeText={(val) => handleAllocationAmountChange(index, val)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.TEXT_MUTED}
                  />
                </View>
              ))}

              {allocationDiff !== 0 && (
                <Text
                  style={[
                    styles.allocWarning,
                    allocationDiff > 0 ? styles.allocWarningUnder : styles.allocWarningOver,
                  ]}
                >
                  {allocationDiff > 0
                    ? `⚠️ Còn ${formatMoney(allocationDiff)} chưa được phân bổ`
                    : `⚠️ Vượt ${formatMoney(Math.abs(allocationDiff))} so với số tiền nhập`}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      <PickDateField label="Ngày" value={date} onChange={setDate} />

      <Text style={styles.label}>Danh mục</Text>
      <CategoryGridSelector
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        loading={categoryLoading}
        emptyText="Chưa có danh mục thu nhập. Hãy tạo danh mục ở tab Danh mục."
      />

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
    marginBottom: 12,
    color: COLORS.TEXT
  },

  // Styles cho Jar Allocation
  allocSection: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    marginBottom: 12,
    overflow: "hidden",
  },
  allocHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.ROSE_MIST,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  allocHeaderTitle: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  allocHeaderArrow: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8,
  },
  allocList: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  allocRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  allocRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  allocJarIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  allocJarIcon: {
    fontSize: 18,
  },
  allocJarInfo: {
    flex: 1,
  },
  allocJarName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT,
  },
  allocJarPct: {
    fontSize: 10,
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
  },
  allocInput: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    textAlign: "right",
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  allocWarning: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 8,
    marginTop: 4,
  },
  allocWarningUnder: {
    color: COLORS.WARNING,
  },
  allocWarningOver: {
    color: COLORS.EXPENSE,
  },

  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 16
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700"
  }
});
