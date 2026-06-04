import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { useVisibleItems } from "../components/common/ShowMoreButton";
import {
  createCategory,
  deleteCategory,
  fetchCategories as fetchCategoryList,
  updateCategory
} from "../services/categoryService";
import { getApiErrorMessage } from "../utils/format";
import { getFirstCategoryIcon } from "../utils/categoryIcons";

const DEFAULT_TYPE = "income";

function normalizeCategoryType(type) {
  return String(type || DEFAULT_TYPE).toLowerCase() === "expense" ? "expense" : "income";
}

function hasDuplicateName(categories, name, ignoredCategoryId) {
  const normalizedName = name.trim().toLowerCase();
  return categories.some((category) => {
    const sameName = String(category?.name || "").trim().toLowerCase() === normalizedName;
    const isIgnored = ignoredCategoryId && Number(category?.id) === Number(ignoredCategoryId);
    return sameName && !isIgnored;
  });
}

function getFormHint(type) {
  if (type === "income") {
    return "Gợi ý: Lương, Freelance, Thưởng...";
  }
  return "Gợi ý: Ăn uống, Di chuyển, Giải trí...";
}

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState("");
  const [type, setTypeState] = useState(DEFAULT_TYPE);
  const [selectedIcon, setSelectedIcon] = useState(getFirstCategoryIcon(DEFAULT_TYPE));
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditTypeState] = useState(DEFAULT_TYPE);
  const [editIcon, setEditIcon] = useState(getFirstCategoryIcon(DEFAULT_TYPE));
  const [isEditIconPickerOpen, setIsEditIconPickerOpen] = useState(false);
  const [editingCategorySaving, setEditingCategorySaving] = useState(false);

  const formHint = useMemo(() => getFormHint(type), [type]);

  const {
    visibleItems: visibleCategories,
    canToggle: canExpandCategories,
    expanded: showAllCategories,
    toggle: toggleCategories
  } = useVisibleItems(categories, { initialCount: 3, mode: "toggle" });

  const setCreateType = useCallback((nextType) => {
    const normalizedType = normalizeCategoryType(nextType);
    setTypeState(normalizedType);
    setSelectedIcon(getFirstCategoryIcon(normalizedType));
  }, []);

  const setEditType = useCallback((nextType) => {
    const normalizedType = normalizeCategoryType(nextType);
    setEditTypeState(normalizedType);
    setEditIcon(getFirstCategoryIcon(normalizedType));
  }, []);

  const fetchCategories = useCallback(async () => {
    const data = await fetchCategoryList();
    setCategories(data);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCategories();
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được danh mục"));
    } finally {
      setRefreshing(false);
    }
  }, [fetchCategories]);

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  const resetCreateForm = useCallback(() => {
    setName("");
    setCreateType(DEFAULT_TYPE);
  }, [setCreateType]);

  const onSave = useCallback(async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      Alert.alert("Thiếu dữ liệu", "Vui lòng nhập tên danh mục.");
      return;
    }

    if (hasDuplicateName(categories, normalizedName)) {
      Alert.alert("Trùng danh mục", "Tên danh mục đã tồn tại.");
      return;
    }

    setSaving(true);
    try {
      await createCategory({
        name: normalizedName,
        icon: selectedIcon,
        type
      });

      resetCreateForm();
      await fetchCategories();
      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.create.category);
    } catch (error) {
      Alert.alert("Lưu thất bại", getApiErrorMessage(error, "Không thể thêm danh mục"));
    } finally {
      setSaving(false);
    }
  }, [categories, fetchCategories, name, resetCreateForm, selectedIcon, type]);

  const onOpenEditCategory = useCallback((category) => {
    if (!category?.id) return;
    const normalizedType = normalizeCategoryType(category.type);
    setEditingCategory(category);
    setEditName(String(category.name || ""));
    setEditTypeState(normalizedType);
    setEditIcon(String(category.icon || getFirstCategoryIcon(normalizedType)));
  }, []);

  const onCloseEditCategory = useCallback(() => {
    setEditingCategory(null);
    setEditName("");
    setEditTypeState(DEFAULT_TYPE);
    setEditIcon(getFirstCategoryIcon(DEFAULT_TYPE));
    setEditingCategorySaving(false);
    setIsEditIconPickerOpen(false);
  }, []);

  const onDeleteCategory = useCallback(
    (category) => {
      if (!category?.id) return;
      Alert.alert(
        "Xóa danh mục",
        `Bạn có chắc muốn xóa danh mục "${category.name}" không? Các giao dịch thuộc danh mục này sẽ không bị xóa.`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteCategory(category.id);
                await fetchCategories();
                Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.delete.category);
              } catch (error) {
                Alert.alert("Xóa thất bại", getApiErrorMessage(error, "Không thể xóa danh mục này"));
              }
            }
          }
        ]
      );
    },
    [fetchCategories]
  );

  const onUpdateCategory = useCallback(async () => {
    if (!editingCategory?.id) return;
    const normalizedName = editName.trim();
    if (!normalizedName) {
      Alert.alert("Thiếu dữ liệu", "Vui lòng nhập tên danh mục.");
      return;
    }

    if (hasDuplicateName(categories, normalizedName, editingCategory.id)) {
      Alert.alert("Trùng danh mục", "Tên danh mục đã tồn tại.");
      return;
    }

    setEditingCategorySaving(true);
    try {
      await updateCategory(editingCategory.id, {
        name: normalizedName,
        type: editType,
        icon: editIcon
      });
      await fetchCategories();
      onCloseEditCategory();
      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.update.category);
    } catch (error) {
      Alert.alert("Cập nhật thất bại", getApiErrorMessage(error, "Không thể cập nhật danh mục"));
      setEditingCategorySaving(false);
    }
  }, [categories, editIcon, editName, editType, editingCategory, fetchCategories, onCloseEditCategory]);

  return {
    categories,
    canExpandCategories,
    createForm: {
      hint: formHint,
      icon: selectedIcon,
      isIconPickerOpen,
      name,
      saving,
      setIcon: setSelectedIcon,
      setIsIconPickerOpen,
      setName,
      setType: setCreateType,
      type
    },
    editForm: {
      category: editingCategory,
      icon: editIcon,
      isIconPickerOpen: isEditIconPickerOpen,
      name: editName,
      saving: editingCategorySaving,
      setIcon: setEditIcon,
      setIsIconPickerOpen: setIsEditIconPickerOpen,
      setName: setEditName,
      setType: setEditType,
      type: editType
    },
    onCloseEditCategory,
    onDeleteCategory,
    onOpenEditCategory,
    onRefresh,
    onSave,
    onUpdateCategory,
    refreshing,
    showAllCategories,
    toggleCategories,
    visibleCategories
  };
}
