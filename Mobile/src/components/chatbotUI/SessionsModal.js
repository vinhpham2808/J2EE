import React, { useState } from "react";
import {
  Modal,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  TextInput,
  StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppColors } from "../../constants/colors";
import { clampScale, scale } from "../../utils/layoutScale";

export default function SessionsModal({
  visible,
  onClose,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onNewChat
}) {
  const colors = useAppColors();
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [renameText, setRenameText] = useState("");

  const handleStartRename = (session) => {
    setEditingSessionId(session.id);
    setRenameText(session.title || "Cuộc trò chuyện");
  };

  const handleConfirmRename = (sessionId) => {
    if (!renameText.trim()) {
      Alert.alert("Lỗi", "Tên cuộc trò chuyện không được để trống.");
      return;
    }
    onRenameSession(sessionId, renameText.trim());
    setEditingSessionId(null);
  };

  const handleDeleteConfirm = (session) => {
    Alert.alert(
      "Xóa cuộc trò chuyện",
      `Bạn có chắc chắn muốn xóa "${session.title || "Cuộc trò chuyện này"}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => onDeleteSession(session.id)
        }
      ]
    );
  };

  const renderSessionItem = ({ item }) => {
    const isActive = item.id === activeSessionId;
    const isEditing = item.id === editingSessionId;

    return (
      <View style={[
        styles.sessionItem,
        { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER },
        isActive && [styles.sessionItemActive, { borderColor: colors.PRIMARY, backgroundColor: isDarkTheme(colors) ? "rgba(239, 94, 131, 0.08)" : "rgba(239, 94, 131, 0.05)" }]
      ]}>
        {isEditing ? (
          <View style={styles.renameContainer}>
            <TextInput
              style={[styles.renameInput, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER, color: colors.TEXT }]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              placeholder="Nhập tên phiên..."
              placeholderTextColor={colors.TEXT_MUTED}
            />
            <Pressable
              style={[styles.confirmBtn, { backgroundColor: colors.PRIMARY }]}
              onPress={() => handleConfirmRename(item.id)}
            >
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            </Pressable>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}
              onPress={() => setEditingSessionId(null)}
            >
              <Ionicons name="close" size={14} color={colors.TEXT} />
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable
              style={styles.sessionPressable}
              onPress={() => {
                onSelectSession(item.id);
                onClose();
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={isActive ? colors.PRIMARY : colors.TEXT_MUTED} />
              <Text
                style={[styles.sessionTitle, { color: colors.TEXT }, isActive && [styles.sessionTitleActive, { color: colors.PRIMARY }]]}
                numberOfLines={1}
              >
                {item.title || "Cuộc trò chuyện"}
              </Text>
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                style={styles.actionIconButton}
                onPress={() => handleStartRename(item)}
              >
                <Ionicons name="create-outline" size={16} color={colors.TEXT_MUTED} />
              </Pressable>
              <Pressable
                style={styles.actionIconButton}
                onPress={() => handleDeleteConfirm(item)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.EXPENSE} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={styles.overlay}
        accessibilityViewIsModal={true}
        importantForAccessibility="yes"
      >
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Đóng lịch sử"
        />

        <View style={[styles.sheet, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER }]}>
          <View style={[styles.header, { borderBottomColor: colors.CARD_BORDER }]}>
            <Text style={[styles.title, { color: colors.PRIMARY }]}>Lịch sử trò chuyện</Text>
            <Pressable style={[styles.closeButton, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]} onPress={onClose}>
              <Ionicons name="close" size={18} color={colors.TEXT} />
            </Pressable>
          </View>

          <Pressable
            style={[styles.newChatButton, { backgroundColor: colors.PRIMARY }]}
            onPress={() => {
              onNewChat();
              onClose();
            }}
          >
            <View style={styles.btnRow}>
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text style={styles.newChatButtonText}>Bắt đầu chat mới</Text>
            </View>
          </Pressable>

          <FlatList
            data={sessions}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSessionItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.TEXT_MUTED} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyText, { color: colors.TEXT_MUTED }]}>Chưa có lịch sử trò chuyện nào.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

function isDarkTheme(colors) {
  return colors.BG === "#0F0D0C";
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9, 6, 10, 0.65)",
    justifyContent: "center",
    padding: scale(16)
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  sheet: {
    borderRadius: scale(20),
    maxHeight: "80%",
    borderWidth: 1,
    paddingBottom: scale(20),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 4
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    paddingBottom: scale(14),
    borderBottomWidth: 1
  },
  title: {
    fontSize: clampScale(18, 16, 20),
    fontWeight: "900"
  },
  closeButton: {
    width: scale(32),
    aspectRatio: 1,
    borderRadius: scale(16),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  newChatButton: {
    marginHorizontal: scale(20),
    marginTop: scale(14),
    paddingVertical: scale(12),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2
    }
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  newChatButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: clampScale(14, 12, 16)
  },
  listContent: {
    paddingHorizontal: scale(20),
    paddingTop: scale(10),
    paddingBottom: scale(20)
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(12),
    paddingHorizontal: scale(14),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: scale(8),
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 1
  },
  sessionItemActive: {
    borderWidth: 1.5
  },
  sessionPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10)
  },
  sessionTitle: {
    fontSize: clampScale(14, 12, 16),
    fontWeight: "600",
    flex: 1
  },
  sessionTitleActive: {
    fontWeight: "800"
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8)
  },
  actionIconButton: {
    padding: scale(4)
  },
  renameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8)
  },
  renameInput: {
    flex: 1,
    borderRadius: scale(8),
    borderWidth: 1,
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    fontSize: clampScale(13, 11, 15)
  },
  confirmBtn: {
    width: scale(30),
    aspectRatio: 1,
    borderRadius: scale(6),
    alignItems: "center",
    justifyContent: "center"
  },
  cancelBtn: {
    width: scale(30),
    aspectRatio: 1,
    borderRadius: scale(6),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(48)
  },
  emptyText: {
    fontSize: clampScale(13, 11, 15),
    fontWeight: "600"
  }
});
