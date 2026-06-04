import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal, Dimensions } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import apiClient from "../../services/apiClient";
import { API_ENDPOINTS } from "../../constants/api";
import { COLORS } from "../../constants/colors";
import { getApiErrorMessage } from "../../utils/format";
import { JAR_COLORS, JAR_EMOJI_CATEGORIES } from "../../utils/jar";
import { getSafeAreaContentStyle } from "../../utils/safeArea";

export default function JarFormView() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const isEditing = route.params?.isEditing ?? false;
  const initialData = route.params?.initialData ?? null;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏺");
  const [color, setColor] = useState("#8B5CF6");
  const [targetPercentage, setTargetPercentage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (isEditing && initialData) {
      setName(initialData.name || "");
      setIcon(initialData.icon || "🏺");
      setColor(initialData.color || "#8B5CF6");
      setTargetPercentage(initialData.targetPercentage?.toString() || "");
    }
  }, [isEditing, initialData]);

  const onSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên hũ.");
      return;
    }

    const pct = trimmedName === "Ví tổng" ? 0 : parseFloat(targetPercentage);
    if (trimmedName !== "Ví tổng" && (isNaN(pct) || pct < 0 || pct > 100)) {
      Alert.alert("Tỉ lệ không hợp lệ", "Tỉ lệ phân bổ phải nằm trong khoảng từ 0% đến 100%.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        icon: icon.trim(),
        color,
        targetPercentage: pct,
      };

      if (isEditing && initialData?.id) {
        await apiClient.put(API_ENDPOINTS.UPDATE_JAR(initialData.id), payload);
        Alert.alert("Thành công", "Đã cập nhật hũ chi tiêu.");
      } else {
        await apiClient.post(API_ENDPOINTS.ADD_JAR, payload);
        Alert.alert("Thành công", "Đã tạo hũ chi tiêu mới thành công.");
      }

      navigation.goBack();
    } catch (err) {
      console.error("Lỗi lưu hũ:", err);
      Alert.alert("Lỗi", getApiErrorMessage(err, "Không thể lưu thông tin hũ."));
    } finally {
      setSubmitting(false);
    }
  };

  const isParentWallet = name === "Ví tổng";

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}>
      <Text style={styles.label}>Tên hũ chi tiêu</Text>
      <TextInput
        style={[styles.input, isParentWallet && styles.disabledInput]}
        value={name}
        onChangeText={setName}
        placeholder="Ví dụ: Ăn uống, Giải trí, Mua sắm"
        placeholderTextColor={COLORS.TEXT_MUTED}
        editable={!isParentWallet}
      />

      <Text style={styles.label}>Biểu tượng (Emoji)</Text>
      <View style={styles.emojiPickerContainer}>
        <Pressable
          style={[styles.emojiBubble, { borderColor: color || COLORS.PRIMARY }]}
          onPress={() => setShowEmojiPicker(true)}
        >
          <Text style={styles.emojiBubbleText}>{icon || "🏺"}</Text>
          <View style={[styles.emojiEditBadge, { backgroundColor: color || COLORS.PRIMARY }]}>
            <Text style={styles.emojiEditBadgeText}>✎</Text>
          </View>
        </Pressable>
        <Text style={styles.emojiPickerDesc}>
          Nhấn vào vòng tròn biểu tượng để chọn hình ảnh đại diện thích hợp nhất cho hũ chi tiêu của bạn.
        </Text>
      </View>

      <Text style={styles.label}>Tỷ lệ phân bổ (%)</Text>
      {isParentWallet ? (
        <View style={styles.parentWalletInfo}>
          <Text style={styles.parentWalletText}>
            Tỷ lệ của Ví tổng được **tự động tính** bằng phần trăm còn lại (100% - tổng các hũ khác).
          </Text>
        </View>
      ) : (
        <TextInput
          style={styles.input}
          value={targetPercentage}
          onChangeText={(val) => setTargetPercentage(val.replace(/[^0-9.]/g, ""))}
          placeholder="Ví dụ: 25"
          placeholderTextColor={COLORS.TEXT_MUTED}
          keyboardType="numeric"
        />
      )}

      {/* Premium Color Picker */}
      <Text style={styles.label}>Màu sắc đại diện</Text>
      <View style={styles.colorsGrid}>
        {JAR_COLORS.map((c) => {
          const isSelected = color === c.value;
          return (
            <Pressable
              key={c.value}
              onPress={() => setColor(c.value)}
              style={[
                styles.colorCircle,
                { backgroundColor: c.value },
                isSelected && styles.selectedColorCircle,
              ]}
              title={c.label}
            />
          );
        })}
      </View>

      <Pressable
        style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
        onPress={onSave}
        disabled={submitting}
      >
        <Text style={styles.saveButtonText}>
          {submitting ? "Đang lưu..." : isEditing ? "Cập nhật hũ" : "Tạo hũ chi tiêu"}
        </Text>
      </Pressable>

      {/* Bộ Chọn Emoji Modal */}
      <Modal visible={showEmojiPicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn biểu tượng hũ</Text>
              <Pressable onPress={() => setShowEmojiPicker(false)}>
                <Text style={styles.closeBtn}>Đóng</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {JAR_EMOJI_CATEGORIES.map((cat, catIdx) => (
                <View key={catIdx} style={styles.catSection}>
                  <Text style={styles.catTitle}>{cat.title}</Text>
                  <View style={styles.emojiGrid}>
                    {cat.emojis.map((emoji) => {
                      const isSelected = icon === emoji;
                      return (
                        <Pressable
                          key={emoji}
                          style={[
                            styles.emojiGridCell,
                            isSelected && {
                              borderColor: color || COLORS.PRIMARY,
                              backgroundColor: (color || COLORS.PRIMARY) + "18",
                            },
                          ]}
                          onPress={() => {
                            setIcon(emoji);
                            setShowEmojiPicker(false);
                          }}
                        >
                          <Text style={styles.emojiGridText}>{emoji}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  content: {
    padding: 16,
  },
  label: {
    color: COLORS.TEXT,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.TEXT,
    fontSize: 14,
  },
  disabledInput: {
    backgroundColor: COLORS.BG,
    color: COLORS.TEXT_MUTED,
  },
  parentWalletInfo: {
    backgroundColor: COLORS.INFO_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d0e3f5",
    padding: 12,
  },
  parentWalletText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
  },
  colorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginVertical: 12,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColorCircle: {
    borderColor: COLORS.PRIMARY,
    transform: [{ scale: 1.1 }],
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 24,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 15,
  },

  // Emojis Picker Giao Diện
  emojiPickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    gap: 14,
    marginBottom: 12,
  },
  emojiBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.BG,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emojiBubbleText: {
    fontSize: 32,
  },
  emojiEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.WHITE,
  },
  emojiEditBadgeText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: "800",
  },
  emojiPickerDesc: {
    flex: 1,
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },

  // Modal Centered Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    maxHeight: "80%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    paddingBottom: 14,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
  },
  closeBtn: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  modalScroll: {
    paddingBottom: 24,
  },
  catSection: {
    marginBottom: 16,
  },
  catTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiGridCell: {
    width: (Dimensions.get("window").width - 64 - 8 * 5) / 6, // 6 ô mỗi hàng
    height: (Dimensions.get("window").width - 64 - 8 * 5) / 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.BG,
  },
  emojiGridText: {
    fontSize: 24,
  },
});
