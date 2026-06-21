import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, useAppColors } from "../../constants/colors";
import { clampScale, scale } from "../../utils/layoutScale";
import AppIcon from "../ui/AppIcon";
import MarkdownContent from "./MarkdownContent";
import AIConfirmationForm from "./AIConfirmationForm";
import { INTENT_ICONS, INTENT_LABELS } from "../../utils/aiIntent";
import appLogo from "../../assets/logo&banner/applogo.png";

function AssistantAvatar() {
  const colors = useAppColors();
  return (
    <View style={[styles.assistantAvatar, { backgroundColor: colors.ROSE_MIST, borderColor: colors.PRIMARY_LIGHT, shadowColor: colors.PRIMARY }]}>
      <Image source={appLogo} style={styles.assistantAvatarImage} resizeMode="cover" />
    </View>
  );
}

export default function MessageBubble({
  message,
  onConfirm,
  onCancel,
  onUndo,
  onEditMessage,
  onRetry,
  isProcessing
}) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const isUser = message.sender === "user";
  const isBot = message.sender === "bot";
  const isSystem = message.isSystem;
  const isError = message.isError;
  const isStopInfo = isSystem && message.text === "⏹️ Đã dừng sinh phản hồi.";

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
      {!isUser && <AssistantAvatar />}

      {isUser && onEditMessage ? (
        <Pressable
          style={[styles.editButton, { borderColor: colors.CARD_BORDER }]}
          onPress={() => onEditMessage(message)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("chatbot.editMessage")}
        >
          <Ionicons name="create-outline" size={14} color={colors.TEXT_MUTED} />
        </Pressable>
      ) : null}

      <View style={[styles.messageColumn, isUser && styles.userColumn]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.PRIMARY, borderColor: colors.PRIMARY }]
              : [styles.botBubble, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }],
            isSystem && [styles.systemBubble, { backgroundColor: colors.ROSE_MIST, borderColor: colors.CARD_BORDER }],
            isError && styles.errorBubble
          ]}
        >
          {message.isIntent && !message.isConfirmation ? (
            <AIConfirmationForm
              intent={message.intent}
              extractedFields={message.extractedFields}
              suggestedValues={message.suggestedValues}
              confirmationPrompt={message.confirmationPrompt}
              onConfirm={onConfirm}
              onCancel={onCancel}
              isProcessing={isProcessing}
            />
          ) : null}

          {message.isIntent && message.isConfirmation ? (
            <View style={styles.confirmedStatusWrapper}>
              <Text style={styles.confirmedStatusText}>
                {INTENT_ICONS[message.intent] || "✅"} {INTENT_LABELS[message.intent]} {t("chatbot.operationSuccess")}
              </Text>
            </View>
          ) : null}

          {message.isUndoAction ? (
            <View style={styles.undoContainer}>
              <Text style={[styles.undoText, { color: colors.TEXT }]}>{message.text}</Text>
              <Pressable style={styles.undoBtn} onPress={() => onUndo(message.operationId)}>
                <View style={styles.btnIconRow}>
                  <Ionicons name="arrow-undo-outline" size={14} color="#4cdad9" />
                  <Text style={styles.undoBtnText}> {t("chatbot.undoSuccess")}</Text>
                </View>
              </Pressable>
            </View>
          ) : null}

          {!message.isIntent && !message.isUndoAction ? (
            isUser ? (
              <Text style={[styles.messageText, { color: COLORS.WHITE }]}>{message.text}</Text>
            ) : (
              <MarkdownContent colors={colors} isError={isError} text={message.text} />
            )
          ) : null}

          {isBot && !message.isIntent && !isSystem && !isError && message.modelLabel ? (
            <Text style={[styles.modelFootprint, { color: colors.PRIMARY }]}>Nova Money · {message.modelLabel}</Text>
          ) : null}

          {(isError || isStopInfo) && onRetry ? (
            <Pressable
              style={styles.retryBtn}
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel={t("chatbot.retryMessage")}
            >
              <Ionicons name="refresh-outline" size={14} color={colors.PRIMARY} />
              <Text style={[styles.retryBtnText, { color: colors.PRIMARY }]}> {t("chatbot.retryMessage")}</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.timeText, { color: colors.TEXT_MUTED }, isUser && styles.userTime]}>
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
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  messageColumn: {
    maxWidth: "80%",
    flexDirection: "column"
  },
  userColumn: {
    alignItems: "flex-end"
  },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 1
  },
  botBubble: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  userBubble: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4
  },
  systemBubble: {
    borderStyle: "dashed",
    borderRadius: 16
  },
  errorBubble: {
    backgroundColor: "rgba(231, 111, 81, 0.12)",
    borderColor: "rgba(231, 111, 81, 0.22)",
    borderRadius: 16
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  modelFootprint: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 8,
    alignSelf: "flex-end"
  },
  timeText: {
    fontSize: 10,
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
    color: "#4cdad9"
  },
  undoContainer: {
    flexDirection: "column",
    gap: 8
  },
  undoText: {
    fontSize: 14
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
  btnIconRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  undoBtnText: {
    color: "#4cdad9",
    fontSize: 12,
    fontWeight: "700"
  },
  retryBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(232, 89, 122, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(232, 89, 122, 0.22)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: "700"
  },
  assistantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 2,
    overflow: "hidden"
  },
  assistantAvatarImage: {
    width: 40,
    height: 40
  }
});
