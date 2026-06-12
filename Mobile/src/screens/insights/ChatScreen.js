import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated
} from "react-native";
import { useAppColors } from "../../constants/colors";
import ChatAssistantHeader from "../../components/chatbotUI/ChatAssistantHeader";
import MessageBubble from "../../components/chatbotUI/MessageBubble";
import QuickPromptChips from "../../components/chatbotUI/QuickPromptChips";
import ChatInputBar from "../../components/chatbotUI/ChatInputBar";
import SessionsModal from "../../components/chatbotUI/SessionsModal";
import EditMessageModal from "../../components/chatbotUI/EditMessageModal";
import useChatMessages from "../../components/chatbotUI/useChatMessages";
import useModelConfig from "../../components/chatbotUI/useModelConfig";
import useVoiceInput from "../../components/chatbotUI/useVoiceInput";
import AppIcon from "../../components/ui/AppIcon";
import styles from "./ChatScreenStyles";

function WaveformBar({ color }) {
  const anim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 2.5,
          duration: 300 + Math.random() * 200,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 300 + Math.random() * 200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={{
        width: 4,
        height: 18,
        backgroundColor: color,
        borderRadius: 2,
        marginHorizontal: 3,
        transform: [{ scaleY: anim }],
      }}
    />
  );
}

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
    modelLabel,
    inputPlaceholder,
    isFreePlan,
    handleModeSwitch,
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
      const current = prev.trim();
      if (!current) return trimmed;
      if (trimmed.toLowerCase().startsWith(current.toLowerCase())) {
        return trimmed;
      }
      return `${current} ${trimmed}`;
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
        modelLabel={modelLabel}
        onChangeMode={handleModeSwitch}
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

      <Modal visible={isRecording} transparent animationType="slide">
        <View style={[styles.voiceModalContainer, { backgroundColor: colors.SURFACE }]}>
          <View style={styles.voiceHeader}>
            <Text style={[styles.voiceTitle, { color: colors.TEXT }]}>Ghi âm giọng nói</Text>
            <Pressable style={styles.voiceCloseBtn} onPress={handleMicPress}>
              <AppIcon name="close" size={24} color={colors.TEXT} />
            </Pressable>
          </View>

          <View style={styles.voiceBody}>
            <View style={styles.waveformContainer}>
              <WaveformBar color={colors.ACTION_VOICE || "#A855F7"} />
              <WaveformBar color={colors.ACTION_VOICE || "#A855F7"} />
              <WaveformBar color={colors.ACTION_VOICE || "#A855F7"} />
              <WaveformBar color={colors.ACTION_VOICE || "#A855F7"} />
              <WaveformBar color={colors.ACTION_VOICE || "#A855F7"} />
              <WaveformBar color={colors.ACTION_VOICE || "#A855F7"} />
              <WaveformBar color={colors.ACTION_VOICE || "#A855F7"} />
              <WaveformBar color={colors.ACTION_VOICE || "#A855F7"} />
            </View>

            <Text style={[styles.voiceDisclaimerText, { color: colors.TEXT_SECONDARY }]}>
              "Ghi âm được chuyển đổi sang văn bản ngay trên thiết bị này. Bằng cách nhấn ghi âm, bạn đồng ý chia sẻ văn bản đã chuyển đổi với SpendBee và Google Gemini."
            </Text>
          </View>

          <View style={styles.voiceFooter}>
            <Text style={[styles.voiceHintText, { color: colors.TEXT_SECONDARY }]}>Nhấn để dừng ghi âm</Text>
            <Pressable
              style={[styles.voiceMicButton, { backgroundColor: colors.ACTION_VOICE || "#A855F7" }]}
              onPress={handleMicPress}
            >
              <AppIcon name="mic" size={28} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
