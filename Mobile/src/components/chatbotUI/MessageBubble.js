import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { COLORS } from "../../constants/colors";
import AIConfirmationForm from "../AIConfirmationForm";
import AssistantAvatar from "./AssistantAvatar";
import { INTENT_ICONS, INTENT_LABELS } from "../../utils/aiIntentParser";

// Helper to format/clean markdown formatting for React Native Text display
const cleanMarkdown = (text) => {
  if (!text) return "";
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/\*\*/g, "");
  cleaned = cleaned.replace(/>/g, "▎");
  return cleaned;
};

export default function MessageBubble({ message, onConfirm, onCancel, onUndo, onEditMessage, onRetry, isProcessing }) {
  const isUser = message.sender === "user";
  const isBot = message.sender === "bot";
  const isSystem = message.isSystem;
  const isError = message.isError;
  const isStopInfo = isSystem && message.text === "⏹️ Đã dừng sinh phản hồi.";

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
      {!isUser && <AssistantAvatar />}
      
      {isUser && onEditMessage && (
        <Pressable
          style={styles.editButton}
          onPress={() => onEditMessage(message)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Chỉnh sửa tin nhắn"
        >
          <Text style={styles.editIcon}>✏️</Text>
        </Pressable>
      )}

      <View style={[styles.messageColumn, isUser && styles.userColumn]}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
            isSystem && styles.systemBubble,
            isError && styles.errorBubble,
          ]}
        >
          {/* Dynamic Confirmation Form for AI Agent Intent */}
          {message.isIntent && !message.isConfirmation && (
            <AIConfirmationForm
              intent={message.intent}
              extractedFields={message.extractedFields}
              suggestedValues={message.suggestedValues}
              confirmationPrompt={message.confirmationPrompt}
              onConfirm={onConfirm}
              onCancel={onCancel}
              isProcessing={isProcessing}
            />
          )}

          {/* Confirmed / Cancelled static status indicator */}
          {message.isIntent && message.isConfirmation && (
            <View style={styles.confirmedStatusWrapper}>
              <Text style={styles.confirmedStatusText}>
                {INTENT_ICONS[message.intent] || "✅"} {INTENT_LABELS[message.intent]} đã được xử lý
              </Text>
            </View>
          )}

          {/* Action Undo Button */}
          {message.isUndoAction && (
            <View style={styles.undoContainer}>
              <Text style={styles.undoText}>{message.text}</Text>
              <Pressable style={styles.undoBtn} onPress={() => onUndo(message.operationId)}>
                <Text style={styles.undoBtnText}>↩ Hoàn tác</Text>
              </Pressable>
            </View>
          )}

          {/* Normal text response */}
          {!message.isIntent && !message.isUndoAction && (
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userText : isError ? styles.errorText : styles.botText,
              ]}
            >
              {isUser ? message.text : cleanMarkdown(message.text)}
            </Text>
          )}

          {/* Model footprint label */}
          {isBot && !message.isIntent && !isSystem && !isError && message.modelLabel && (
            <Text style={styles.modelFootprint}>Nova Money · {message.modelLabel}</Text>
          )}

          {/* Retry Button inside error or stopped messages */}
          {(isError || isStopInfo) && onRetry && (
            <Pressable
              style={styles.retryBtn}
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Thử lại tin nhắn"
            >
              <Text style={styles.retryBtnText}>🔄 Thử lại</Text>
            </Pressable>
          )}
        </View>
        <Text style={[styles.timeText, isUser && styles.userTime]}>
          {message.time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    width: "100%",
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center"
  },
  botRow: {
    alignItems: "flex-start"
  },
  userRow: {
    justifyContent: "flex-end"
  },
  editButton: {
    padding: 8,
    marginRight: 4,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)"
  },
  editIcon: {
    fontSize: 12
  },
  messageColumn: {
    maxWidth: "80%",
    flexDirection: "column"
  },
  userColumn: {
    alignItems: "flex-end"
  },
  bubble: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1
  },
  botBubble: {
    backgroundColor: COLORS.CARD,
    borderColor: COLORS.CARD_BORDER,
    borderTopLeftRadius: 4
  },
  userBubble: {
    backgroundColor: "rgba(232, 89, 126, 0.16)", // Blushing pink translucent from mockup brand pink
    borderColor: "rgba(232, 89, 126, 0.28)",
    borderTopRightRadius: 4
  },
  systemBubble: {
    backgroundColor: COLORS.ROSE_MIST,
    borderColor: COLORS.CARD_BORDER,
    borderStyle: "dashed"
  },
  errorBubble: {
    backgroundColor: "rgba(231, 111, 81, 0.15)",
    borderColor: "rgba(231, 111, 81, 0.25)"
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  botText: {
    color: COLORS.TEXT
  },
  userText: {
    color: COLORS.TEXT
  },
  errorText: {
    color: "#ffb4ab" // error text color from mockup
  },
  modelFootprint: {
    fontSize: 9,
    fontWeight: "750",
    color: COLORS.PRIMARY, // active pink accent
    marginTop: 8,
    alignSelf: "flex-end"
  },
  timeText: {
    fontSize: 10,
    color: COLORS.TEXT_MUTED,
    marginTop: 4,
    marginHorizontal: 4
  },
  userTime: {
    textAlign: "right"
  },
  confirmedStatusWrapper: {
    paddingVertical: 2
  },
  confirmedStatusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4cdad9" // tertiary active indicator (turquoise/teal) from mockup
  },
  undoContainer: {
    flexDirection: "column",
    gap: 8
  },
  undoText: {
    fontSize: 14,
    color: COLORS.TEXT
  },
  undoBtn: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(76, 218, 217, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(76, 218, 217, 0.25)",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  undoBtnText: {
    color: "#4cdad9",
    fontSize: 12,
    fontWeight: "700"
  },
  retryBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(232, 89, 122, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(232, 89, 122, 0.25)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  retryBtnText: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: "700"
  }
});
