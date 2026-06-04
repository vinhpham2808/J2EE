import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";
import ChatAssistantHeader from "../../components/chatbotUI/ChatAssistantHeader";
import MessageBubble from "../../components/chatbotUI/MessageBubble";
import QuickPromptChips from "../../components/chatbotUI/QuickPromptChips";
import ChatInputBar from "../../components/chatbotUI/ChatInputBar";
import SessionsModal from "../../components/chatbotUI/SessionsModal";
import EditMessageModal from "../../components/chatbotUI/EditMessageModal";
import useChatMessages from "../../components/chatbotUI/useChatMessages";
import useModelConfig from "../../components/chatbotUI/useModelConfig";
import useVoiceInput from "../../components/chatbotUI/useVoiceInput";

export default function ChatScreen() {
  const colors = useAppColors();
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
    <View style={[styles.container, { backgroundColor: colors.CHAT_BG }]}> 
      <ChatAssistantHeader
        activeMode={activeMode}
        isFreePlan={isFreePlan}
        modelOptions={modelOptions}
        modelValue={modelValue}
        modelLabel={modelLabel}
        onChangeMode={handleModeSwitch}
        onModelChange={handleModelChange}
        onOpenSessions={() => setIsSessionsVisible(true)}
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
              <View style={[styles.loadingContainer, { backgroundColor: colors.CHAT_BUBBLE, borderColor: colors.CHAT_BORDER }]}> 
                <ActivityIndicator color={colors.PRIMARY} size="small" />
                <Text style={[styles.loadingText, { color: colors.CHAT_MUTED }]}> 
                  Trợ lý AI đang suy nghĩ...
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
