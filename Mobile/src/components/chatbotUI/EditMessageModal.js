import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { COLORS } from "../../constants/colors";
import { scale, clampScale } from "../../utils/dimensions";

export default function EditMessageModal({
  visible,
  onClose,
  message,
  onSave
}) {
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (message) {
      setEditText(message.text || "");
    }
  }, [message, visible]);

  const handleSave = () => {
    if (!editText.trim()) return;
    onSave(editText.trim(), message.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={styles.overlay}
          accessibilityViewIsModal={true}
          importantForAccessibility="yes"
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Đóng hộp thoại chỉnh sửa"
          />

          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Chỉnh sửa tin nhắn</Text>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={editText}
                  onChangeText={setEditText}
                  placeholder="Nhập nội dung tin nhắn mới..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  autoFocus
                  maxLength={1000}
                />
              </View>

              <View style={styles.footer}>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, !editText.trim() && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={!editText.trim()}
                >
                  <Text style={styles.saveBtnText}>Lưu & Gửi lại</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9, 6, 10, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(20)
  },
  sheet: {
    backgroundColor: COLORS.BG,
    borderRadius: scale(24),
    width: "100%",
    maxWidth: scale(380),
    maxHeight: "60%",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    paddingBottom: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER
  },
  title: {
    color: COLORS.PRIMARY,
    fontSize: clampScale(18, 16, 20),
    fontWeight: "900"
  },
  closeButton: {
    width: scale(32),
    aspectRatio: 1,
    borderRadius: scale(16),
    backgroundColor: COLORS.CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  closeText: {
    color: COLORS.TEXT,
    fontSize: clampScale(20, 18, 24),
    fontWeight: "700",
    marginTop: -2
  },
  content: {
    padding: scale(20)
  },
  inputWrapper: {
    backgroundColor: COLORS.CARD,
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: scale(12),
    minHeight: scale(120),
    maxHeight: scale(200)
  },
  textInput: {
    color: COLORS.TEXT,
    fontSize: clampScale(14, 12, 16),
    textAlignVertical: "top",
    flex: 1,
    padding: 0
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(12),
    marginTop: scale(20)
  },
  cancelBtn: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(18),
    borderRadius: scale(10),
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    justifyContent: "center",
    alignItems: "center"
  },
  cancelBtnText: {
    color: COLORS.TEXT,
    fontSize: clampScale(13, 11, 15),
    fontWeight: "700"
  },
  saveBtn: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(18),
    borderRadius: scale(10),
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  saveBtnDisabled: {
    backgroundColor: "rgba(232, 89, 122, 0.4)",
    shadowOpacity: 0
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: clampScale(13, 11, 15),
    fontWeight: "800"
  }
});
