import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable
} from "react-native";
import { COLORS } from "../constants/colors";
import ChatAssistantHeader from "../components/chatbotUI/ChatAssistantHeader";
import MessageBubble from "../components/chatbotUI/MessageBubble";
import QuickPromptChips from "../components/chatbotUI/QuickPromptChips";
import ChatInputBar from "../components/chatbotUI/ChatInputBar";

import ChatHeader from "../components/chatbotUI/ChatHeader";
import SessionsModal from "../components/chatbotUI/SessionsModal";
import EditMessageModal from "../components/chatbotUI/EditMessageModal";

import useChatMessages from "../components/chatbotUI/useChatMessages";
import useModelConfig from "../components/chatbotUI/useModelConfig";
import useVoiceInput from "../components/chatbotUI/useVoiceInput";

export default function ChatScreen() {
  const [inputText, setInputText] = useState("");
  const [isSessionsVisible, setIsSessionsVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  const {
    activeMode,
    activeProvider,
    activeModel,
    activeModelLabel,
    modelOptions,
    modelValue,
    modelLabel,
    inputPlaceholder,
    isFreePlan,
    handleModeSwitch,
    handleModelChange
  } = useModelConfig();

  const {
    messages,
    sessions,
    activeSessionId,
    loading,
    chatBusy,
    hasUserStartedChat,
    isProcessingCrud,
    flatListRef,
    sendMessage,
    retryLastMessage,
    stopGenerating,
    selectSession,
    deleteSession,
    renameSession,
    startNewChat,
    handleConfirmAction,
    handleCancelConfirmation,
    handleUndo
  } = useChatMessages({ activeMode, activeProvider, activeModel, activeModelLabel });

  const handleVoiceResult = useCallback((transcript) => {
    setInputText((prev) => {
      const trimmed = transcript.trim();
      return prev ? `${prev} ${trimmed}` : trimmed;
    });
  }, []);

  const { isRecording, handleMicPress } = useVoiceInput({
    language: "vi-VN",
    onResult: handleVoiceResult
  });

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, chatBusy, flatListRef]);

  const handleInputChange = useCallback((text) => {
    if (chatBusy) return;
    setInputText(text);
  }, [chatBusy]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  }, [inputText, sendMessage]);

  const handleQuickPrompt = useCallback((prompt) => {
    sendMessage(prompt.text);
  }, [sendMessage]);

  const handleEditMessage = useCallback((message) => {
    setEditingMessage(message);
    setIsEditModalVisible(true);
  }, []);

  const handleSaveEditedMessage = useCallback((newText, messageId) => {
    sendMessage(newText, { editMessageId: messageId });
  }, [sendMessage]);

  const renderMessage = useCallback(({ item }) => (
    <MessageBubble
      message={item}
      onConfirm={handleConfirmAction}
      onCancel={handleCancelConfirmation}
      onUndo={handleUndo}
      onEditMessage={handleEditMessage}
      onRetry={retryLastMessage}
      isProcessing={isProcessingCrud}
    />
  ), [handleConfirmAction, handleCancelConfirmation, handleUndo, handleEditMessage, retryLastMessage, isProcessingCrud]);

  return (

    <View style={styles.container}>
      <ChatAssistantHeader

    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ChatHeader>
        <View style={styles.headerRightContainer}>
          <Pressable
            style={({ pressed }) => [styles.historyBtn, pressed && styles.historyBtnPressed]}
            onPress={() => setIsSessionsVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Mở lịch sử phiên chat"
          >
            <Text style={styles.historyIcon}>⏳</Text>
          </Pressable>
          <ModelSelectorPill
            label={modelLabel}
            value={modelValue}
            options={modelOptions}
            title={activeMode === "chat" ? "MODEL CHAT" : "MODEL AGENT"}
            onSelect={handleModelChange}
          />
        </View>
      </ChatHeader>
      <ModeSegmentedControl
        activeMode={activeMode}
        isFreePlan={isFreePlan}
        modelOptions={modelOptions}
        modelValue={modelValue}
        modelLabel={modelLabel}
        onChangeMode={handleModeSwitch}
        onModelChange={handleModelChange}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.PRIMARY} size="small" />
                <Text style={styles.loadingText}>
                  {modelLabel} đang suy nghĩ...
                </Text>
              </View>
            ) : null
          }
        />

        {!hasUserStartedChat && !chatBusy && (
          <QuickPromptChips onSelect={handleQuickPrompt} />
        )}

        <ChatInputBar
          value={inputText}
          onChangeText={handleInputChange}
          onSend={handleSend}
          onStop={stopGenerating}
          placeholder={inputPlaceholder}
          loading={loading}
          disabled={chatBusy}
          onMicPress={handleMicPress}
          isRecording={isRecording}
        />
      </KeyboardAvoidingView>

      <SessionsModal
        visible={isSessionsVisible}
        onClose={() => setIsSessionsVisible(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onNewChat={startNewChat}
      />

      <EditMessageModal
        visible={isEditModalVisible}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingMessage(null);
        }}
        message={editingMessage}
        onSave={handleSaveEditedMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.CHAT_BG
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    marginRight: 8
  },
  historyBtnPressed: {
    opacity: 0.8,
    backgroundColor: COLORS.ROSE_MIST
  },
  historyIcon: {
    fontSize: 16
  },
  keyboardView: {
    flex: 1
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.CHAT_BUBBLE,
    borderWidth: 1,
    borderColor: COLORS.CHAT_BORDER,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    marginTop: 6
  },
  loadingText: {
    color: COLORS.CHAT_MUTED,
    fontSize: 12
  }
});
