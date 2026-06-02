import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { fetchCategoriesByType } from "../services/categoryService";
import { fetchJars } from "../services/jarService";
import { confirmReceiptImport } from "../services/receiptImportService";
import { getApiErrorMessage, todayIso } from "../utils/format";

function normalizeReceiptItem(item, receiptDate) {
  return {
    name: item?.name || "",
    amount: item?.amount ? Number(item.amount) : 0,
    categoryId: item?.categoryId ? Number(item.categoryId) : null,
    categoryHint: item?.categoryHint || "",
    icon: item?.icon || "",
    date: item?.date || receiptDate || todayIso()
  };
}

function getDefaultJarId(jars) {
  if (!jars.length) {
    return "";
  }

  const parentWallet = jars.find((jar) => jar.name === "Ví tổng");
  return String((parentWallet || jars[0]).id);
}

function validateReceiptItems(items) {
  if (items.length === 0) {
    Alert.alert("Không có mục nào", "Hóa đơn cần ít nhất 1 khoản chi để lưu.");
    return false;
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item.name || !item.name.trim()) {
      Alert.alert("Thiếu tên", `Khoản chi #${index + 1} chưa có tên.`);
      return false;
    }
    if (!item.amount || Number(item.amount) <= 0) {
      Alert.alert("Số tiền không hợp lệ", `Khoản chi #${index + 1} cần số tiền > 0.`);
      return false;
    }
    if (!item.categoryId) {
      Alert.alert("Thiếu danh mục", `Khoản chi #${index + 1} chưa chọn danh mục.`);
      return false;
    }
  }

  return true;
}

export default function useReceiptPreview({ analyzeResult, onImportSuccess }) {
  const receiptMeta = useMemo(
    () => ({
      initialItems: analyzeResult?.items || [],
      location: analyzeResult?.location || "",
      merchant: analyzeResult?.merchant || "",
      receiptDate: analyzeResult?.receiptDate || todayIso()
    }),
    [analyzeResult]
  );

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [jars, setJars] = useState([]);
  const [jarId, setJarId] = useState("");
  const [jarsLoading, setJarsLoading] = useState(true);

  useEffect(() => {
    setItems(receiptMeta.initialItems.map((item) => normalizeReceiptItem(item, receiptMeta.receiptDate)));
  }, [receiptMeta.initialItems, receiptMeta.receiptDate]);

  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const data = await fetchCategoriesByType("expense");
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadJars = async () => {
      setJarsLoading(true);
      try {
        const data = await fetchJars();
        setJars(data);
        setJarId(getDefaultJarId(data));
      } catch {
        setJars([]);
        setJarId("");
      } finally {
        setJarsLoading(false);
      }
    };

    loadJars();
  }, []);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [items]
  );

  const updateItem = useCallback((index, updated) => {
    setItems((prev) => prev.map((item, itemIndex) => (itemIndex === index ? updated : item)));
  }, []);

  const deleteItem = useCallback((index) => {
    Alert.alert("Xóa mục này?", "Bạn sẽ không thể hoàn tác sau khi xác nhận.", [
      { text: "Giữ lại", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
      }
    ]);
  }, []);

  const confirmImport = useCallback(async () => {
    if (!validateReceiptItems(items)) return;

    setSubmitting(true);
    try {
      const payload = {
        merchant: receiptMeta.merchant,
        location: receiptMeta.location,
        receiptDate: receiptMeta.receiptDate,
        jarId: jarId ? Number(jarId) : null,
        items: items.map((item) => ({
          name: item.name.trim(),
          amount: Number(item.amount),
          categoryId: Number(item.categoryId),
          icon: item.icon || "",
          date: item.date || receiptMeta.receiptDate
        }))
      };

      const result = await confirmReceiptImport(payload);
      const count = result?.importedCount || items.length;

      Alert.alert(
        "✅ Nhập hóa đơn thành công",
        `Đã lưu ${count} khoản chi từ hóa đơn${receiptMeta.merchant ? ` "${receiptMeta.merchant}"` : ""}.`,
        [{ text: "OK", onPress: onImportSuccess }]
      );
    } catch (error) {
      Alert.alert(
        "Lỗi xác nhận",
        getApiErrorMessage(error, "Không thể lưu hóa đơn. Vui lòng thử lại.")
      );
    } finally {
      setSubmitting(false);
    }
  }, [items, jarId, onImportSuccess, receiptMeta.location, receiptMeta.merchant, receiptMeta.receiptDate]);

  return {
    categories,
    categoriesLoading,
    confirmImport,
    deleteItem,
    hasInitialItems: receiptMeta.initialItems.length > 0,
    items,
    jarId,
    jars,
    jarsLoading,
    receiptMeta,
    setJarId,
    submitting,
    totalAmount,
    updateItem
  };
}
