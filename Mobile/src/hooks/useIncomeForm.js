import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { fetchCategoriesByType } from "../services/categoryService";
import { createIncome } from "../services/incomeService";
import { fetchJars } from "../services/jarService";
import { formatCurrencyInput, getApiErrorMessage, parseCurrencyInput, todayIso } from "../utils/format";

function buildAllocations(jars, total) {
  if (!jars.length || total <= 0) {
    return [];
  }

  let remaining = total;
  return jars.map((jar, index) => {
    const percentage = jar.targetPercentage ?? 0;
    let amount;
    if (index === jars.length - 1) {
      amount = remaining;
    } else {
      amount = Math.round((total * percentage) / 100);
      remaining -= amount;
    }

    return {
      jarId: jar.id,
      jarName: jar.name,
      jarIcon: jar.icon,
      jarColor: jar.color,
      amount,
      percentage
    };
  });
}

export default function useIncomeForm({ initialData, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [name, setName] = useState(initialData?.name || "");
  const [amount, setAmount] = useState(initialData?.amount ? formatCurrencyInput(String(initialData.amount)) : "");
  const [date, setDate] = useState(initialData?.date || todayIso());
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [jars, setJars] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [showAllocations, setShowAllocations] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setCategoryLoading(true);
      try {
        const data = await fetchCategoriesByType("income");
        if (!active) return;
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(String(data[0].id));
        }
      } catch (error) {
        Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được danh mục"));
      } finally {
        if (active) {
          setCategoryLoading(false);
        }
      }
    }

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadJars() {
      try {
        const data = await fetchJars();
        if (active) {
          setJars(data);
        }
      } catch (error) {
        console.error("Lỗi tải hũ để phân bổ:", error);
      }
    }

    loadJars();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setAllocations(buildAllocations(jars, parseCurrencyInput(amount)));
  }, [amount, jars]);

  useEffect(() => {
    if (!initialData) return;

    if (initialData.name) setName(initialData.name);
    if (initialData.amount) setAmount(formatCurrencyInput(String(initialData.amount)));
    if (initialData.date) setDate(initialData.date);

    if (initialData.categoryHint && categories.length > 0) {
      const hint = initialData.categoryHint.toLowerCase();
      const matched = categories.find(
        (category) => category.name.toLowerCase().includes(hint) || hint.includes(category.name.toLowerCase())
      );
      if (matched) setCategoryId(String(matched.id));
    }
  }, [initialData, categories]);

  const incomeAmount = parseCurrencyInput(amount) || 0;
  const totalAllocated = useMemo(() => allocations.reduce((sum, allocation) => sum + allocation.amount, 0), [allocations]);
  const allocationDiff = incomeAmount - totalAllocated;

  const setFormattedAmount = useCallback((value) => {
    setAmount(formatCurrencyInput(value));
  }, []);

  const handleAllocationAmountChange = useCallback(
    (index, valueText) => {
      const newAmount = parseCurrencyInput(valueText);
      let diff = newAmount - allocations[index].amount;
      const nextAllocations = [...allocations];
      nextAllocations[index] = { ...nextAllocations[index], amount: newAmount };

      if (diff !== 0 && nextAllocations.length > 1) {
        for (let i = 0; i < nextAllocations.length; i++) {
          if (i !== index && diff !== 0) {
            if (diff > 0) {
              const subtractAmount = Math.min(nextAllocations[i].amount, diff);
              nextAllocations[i].amount -= subtractAmount;
              diff -= subtractAmount;
            } else {
              nextAllocations[i].amount -= diff;
              diff = 0;
            }
          }
        }
      }

      setAllocations(nextAllocations);
    },
    [allocations]
  );

  const onSave = useCallback(async () => {
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

      if (jars.length > 0 && allocations.length > 0) {
        payload.allocations = allocations
          .filter((allocation) => allocation.amount > 0)
          .map((allocation) => ({ jarId: allocation.jarId, amount: allocation.amount }));
      }

      await createIncome(payload);
      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.create.income, [{ text: "OK", onPress: onSaved }]);
    } catch (error) {
      Alert.alert("Lưu thất bại", getApiErrorMessage(error, "Không thể tạo khoản thu"));
    } finally {
      setSubmitting(false);
    }
  }, [allocations, amount, categoryId, date, jars.length, name, onSaved]);

  return {
    allocationDiff,
    allocations,
    amount,
    categories,
    categoryId,
    categoryLoading,
    date,
    handleAllocationAmountChange,
    incomeAmount,
    jars,
    name,
    onSave,
    setAmount: setFormattedAmount,
    setCategoryId,
    setDate,
    setName,
    setShowAllocations,
    showAllocations,
    submitting,
    totalAllocated
  };
}
