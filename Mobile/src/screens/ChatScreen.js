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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import ModeSegmentedControl from "../components/chatbotUI/ModeSegmentedControl";
import MessageBubble from "../components/chatbotUI/MessageBubble";
import QuickPromptChips from "../components/chatbotUI/QuickPromptChips";
import ChatInputBar from "../components/chatbotUI/ChatInputBar";
import useChatMessages from "../components/chatbotUI/useChatMessages";
import useModelConfig from "../components/chatbotUI/useModelConfig";
import useVoiceInput from "../components/chatbotUI/useVoiceInput";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState("");

  const {
    activeMode,
    activeProvider,
    activeModel,
    activeModelLabel,
    modelLabel,
    inputPlaceholder,
    isFreePlan,
    handleModeSwitch
  } = useModelConfig();

  const {
    messages,
    loading,
    chatBusy,
    hasUserStartedChat,
    isProcessingCrud,
    flatListRef,
    sendMessage,
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

  const renderMessage = useCallback(({ item }) => (
    <MessageBubble
      message={item}
      onConfirm={handleConfirmAction}
      onCancel={handleCancelConfirmation}
      onUndo={handleUndo}
      isProcessing={isProcessingCrud}
    />
  ), [handleConfirmAction, handleCancelConfirmation, handleUndo, isProcessingCrud]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ModeSegmentedControl
        activeMode={activeMode}
        isFreePlan={isFreePlan}
        onChangeMode={handleModeSwitch}
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
                <ActivityIndicator color={COLORS.CHAT_PURPLE} size="small" />
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
          placeholder={inputPlaceholder}
          loading={loading}
          disabled={chatBusy}
          onMicPress={handleMicPress}
          isRecording={isRecording}
        />
      </KeyboardAvoidingView>
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
    paddingTop: 28,
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
