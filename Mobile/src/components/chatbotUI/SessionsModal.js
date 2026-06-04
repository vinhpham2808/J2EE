import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  TextInput
} from "react-native";
import { COLORS } from "../../constants/colors";
import { scale, clampScale } from "../../utils/layoutScale";

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
      <View style={[styles.sessionItem, isActive && styles.sessionItemActive]}>
        {isEditing ? (
          <View style={styles.renameContainer}>
            <TextInput
              style={styles.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              placeholder="Nhập tên phiên..."
              placeholderTextColor="#9ca3af"
            />
            <Pressable
              style={styles.confirmBtn}
              onPress={() => handleConfirmRename(item.id)}
            >
              <Text style={styles.actionBtnText}>✓</Text>
            </Pressable>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setEditingSessionId(null)}
            >
              <Text style={styles.actionBtnText}>×</Text>
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
              <Text style={styles.sessionIcon}>💬</Text>
              <Text
                style={[styles.sessionTitle, isActive && styles.sessionTitleActive]}
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
                <Text style={styles.actionIcon}>✏️</Text>
              </Pressable>
              <Pressable
                style={styles.actionIconButton}
                onPress={() => handleDeleteConfirm(item)}
              >
                <Text style={styles.actionIcon}>🗑️</Text>
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
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Đóng lịch sử"
        />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Lịch sử trò chuyện</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.newChatButton}
            onPress={() => {
              onNewChat();
              onClose();
            }}
          >
            <Text style={styles.newChatButtonText}>➕ Bắt đầu chat mới</Text>
          </Pressable>

          <FlatList
            data={sessions}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSessionItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>Chưa có lịch sử trò chuyện nào.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9, 6, 10, 0.65)",
    justifyContent: "center",
    padding: scale(16)
  },
  sheet: {
    backgroundColor: COLORS.BG,
    borderRadius: scale(20),
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingBottom: scale(20)
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
  newChatButton: {
    backgroundColor: COLORS.PRIMARY,
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
      height: 2,
    }
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
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    marginBottom: scale(8)
  },
  sessionItemActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: "rgba(232, 89, 122, 0.05)"
  },
  sessionPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10)
  },
  sessionIcon: {
    fontSize: clampScale(16, 14, 18)
  },
  sessionTitle: {
    color: COLORS.TEXT,
    fontSize: clampScale(14, 12, 16),
    fontWeight: "600",
    flex: 1
  },
  sessionTitleActive: {
    color: COLORS.PRIMARY,
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
  actionIcon: {
    fontSize: clampScale(14, 12, 16)
  },
  renameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8)
  },
  renameInput: {
    flex: 1,
    backgroundColor: COLORS.BG,
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    color: COLORS.TEXT,
    fontSize: clampScale(13, 11, 15)
  },
  confirmBtn: {
    width: scale(30),
    aspectRatio: 1,
    borderRadius: scale(6),
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center"
  },
  cancelBtn: {
    width: scale(30),
    aspectRatio: 1,
    borderRadius: scale(6),
    backgroundColor: COLORS.CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  actionBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: clampScale(14, 12, 16)
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(48)
  },
  emptyIcon: {
    fontSize: clampScale(36, 32, 42),
    marginBottom: scale(8)
  },
  emptyText: {
    color: COLORS.TEXT_MUTED,
    fontSize: clampScale(13, 11, 15),
    fontWeight: "600"
  }
});
