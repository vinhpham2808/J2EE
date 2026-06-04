import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { fetchCategoriesByType } from "../services/categoryService";
import { createExpense } from "../services/expenseService";
import { fetchJars } from "../services/jarService";
import { formatCurrencyInput, getApiErrorMessage, parseCurrencyInput, todayIso } from "../utils/format";
import { parseNote, suggestCategory } from "../utils/noteParser";

function getDefaultJarId(jars, defaultJarId) {
  if (defaultJarId) {
    return String(defaultJarId);
  }

  const parentWallet = jars.find((jar) => jar.name === "Ví tổng");
  return parentWallet?.id ? String(parentWallet.id) : String(jars[0]?.id || "");
}

export default function useExpenseForm({ defaultJarId, initialData, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [splitInfo, setSplitInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [jars, setJars] = useState([]);
  const [jarId, setJarId] = useState("");
  const [jarsLoading, setJarsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setCategoryLoading(true);
      try {
        const data = await fetchCategoriesByType("expense");
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
      setJarsLoading(true);
      try {
        const data = await fetchJars();
        if (!active) return;
        setJars(data);
        setJarId(getDefaultJarId(data, defaultJarId));
      } catch (error) {
        console.error("Lỗi tải danh sách hũ:", error);
      } finally {
        if (active) {
          setJarsLoading(false);
        }
      }
    }

    loadJars();
    return () => {
      active = false;
    };
  }, [defaultJarId]);

  useEffect(() => {
    if (!initialData) return;

    if (initialData.name) setName(initialData.name);
    if (initialData.amount) setAmount(formatCurrencyInput(String(initialData.amount)));
    if (initialData.date) setDate(initialData.date);
    if (initialData.note) setNote(initialData.note);

    if (initialData.categoryHint && categories.length > 0) {
      const hint = initialData.categoryHint.toLowerCase();
      const matched = categories.find(
        (category) =>
          category.name.toLowerCase().includes(hint) || hint.includes(category.name.toLowerCase())
      );
      if (matched) setCategoryId(String(matched.id));
    }
  }, [initialData, categories]);

  const setFormattedAmount = useCallback((value) => {
    setAmount(formatCurrencyInput(value));
  }, []);

  const handleVoiceResult = useCallback(
    (voiceText) => {
      if (!voiceText) return;

      const parsed = parseNote(voiceText);
      if (parsed.amount > 0) {
        setAmount(formatCurrencyInput(String(parsed.amount)));
      }

      if (parsed.note) {
        setName(parsed.note.length > 40 ? `${parsed.note.substring(0, 40)}...` : parsed.note);
      }

      setSplitInfo(parsed.splitInfo?.splits?.length > 0 ? parsed.splitInfo : null);

      const suggested = suggestCategory(parsed.note, categories);
      if (suggested) {
        setCategoryId(String(suggested.id));
      }
    },
    [categories]
  );

  const onSave = useCallback(async () => {
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
        icon: "💸",
        jarId: jarId ? Number(jarId) : null
      };

      const noteTrimmed = note.trim();
      if (noteTrimmed) {
        payload.note = noteTrimmed;
      }

      if (splitInfo?.splits?.length > 0) {
        payload.splitExpense = splitInfo.splits.map((split) => ({
          person: split.person || null,
          amount: split.share
        }));
      }

      await createExpense(payload);
      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.create.expense, [
        { text: "OK", onPress: onSaved }
      ]);
    } catch (error) {
      Alert.alert("Lưu thất bại", getApiErrorMessage(error, "Không thể tạo khoản chi"));
    } finally {
      setSubmitting(false);
    }
  }, [amount, categoryId, date, jarId, name, note, onSaved, splitInfo]);

  return {
    amount,
    categories,
    categoryId,
    categoryLoading,
    date,
    handleVoiceResult,
    jarId,
    jars,
    jarsLoading,
    name,
    note,
    onSave,
    setAmount: setFormattedAmount,
    setCategoryId,
    setDate,
    setJarId,
    setName,
    setNote,
    splitInfo,
    submitting
  };
}
