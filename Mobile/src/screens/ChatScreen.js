import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import { COLORS } from "../constants/colors";
import { sendAiChat } from "../services/aiService";

const SUGGESTED_PROMPTS = [
  "Làm sao tiết kiệm 20% thu nhập?",
  "Tư vấn quản lý chi tiêu tháng này",
  "Nên đầu tư vào mục tiêu tiết kiệm nào?",
  "Làm thế nào để tránh vượt hạn mức ngân sách?"
];

function MessageBubble({ message }) {
  const isUser = message.sender === "user";
  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.botWrapper]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
          {message.text}
        </Text>
      </View>
      <Text style={[styles.timeText, isUser ? styles.userTime : styles.botTime]}>
        {message.time}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const [provider, setProvider] = useState("gemini"); // "gemini" | "gptoss"
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Xin chào! Tôi là trợ lý tài chính AI. Tôi có thể giúp gì cho bạn hôm nay?",
      sender: "bot",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const sendMessage = async (textToSend) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText) return;

    const userMessage = {
      id: String(Date.now()),
      text: trimmedText,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Prepare API history before setting state
    const history = messages.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text
    }));
    history.push({ role: "user", content: trimmedText });

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const response = await sendAiChat(history, provider);
      const botMessage = {
        id: String(Date.now() + 1),
        text: response?.reply || "Hệ thống AI không phản hồi, vui lòng thử lại sau.",
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: String(Date.now() + 1),
        text: "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại kết nối mạng.",
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const handlePromptPress = (prompt) => {
    sendMessage(prompt);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Model Selector Bar */}
      <View style={styles.selectorContainer}>
        <Pressable
          style={[styles.selectorButton, provider === "gemini" && styles.selectorActive]}
          onPress={() => setProvider("gemini")}
        >
          <Text style={[styles.selectorText, provider === "gemini" && styles.selectorActiveText]}>
            ✨ Gemini AI (Lite)
          </Text>
        </Pressable>
        <Pressable
          style={[styles.selectorButton, provider === "gptoss" && styles.selectorActive]}
          onPress={() => setProvider("gptoss")}
        >
          <Text style={[styles.selectorText, provider === "gptoss" && styles.selectorActiveText]}>
            ⚡ GPT-OSS (Nova)
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.PRIMARY} size="small" />
                <Text style={styles.loadingText}>
                  {provider === "gemini" ? "Gemini AI" : "GPT-OSS Nova"} đang suy nghĩ...
                </Text>
              </View>
            ) : null
          }
        />

        {messages.length === 1 && !loading && (
          <View style={styles.promptsContainer}>
            <Text style={styles.promptsTitle}>Gợi ý câu hỏi:</Text>
            <View style={styles.promptsGrid}>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <Pressable
                  key={idx}
                  style={styles.promptChip}
                  onPress={() => handlePromptPress(prompt)}
                >
                  <Text style={styles.promptText}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Hỏi ${provider === "gemini" ? "Gemini AI" : "GPT-OSS Nova"} về tài chính...`}
            placeholderTextColor={COLORS.TEXT_MUTED}
            value={inputText}
            onChangeText={setInputText}
            editable={!loading}
            multiline
          />
          <Pressable
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || loading}
          >
            <Text style={styles.sendButtonText}>Gửi</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  selectorContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    padding: 8,
    gap: 8
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  selectorActive: {
    backgroundColor: COLORS.ROSE_MIST,
    borderColor: COLORS.PRIMARY
  },
  selectorText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY
  },
  selectorActiveText: {
    color: COLORS.PRIMARY
  },
  keyboardView: {
    flex: 1
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24
  },
  bubbleWrapper: {
    marginBottom: 16,
    maxWidth: "80%"
  },
  userWrapper: {
    alignSelf: "flex-end",
    alignItems: "flex-end"
  },
  botWrapper: {
    alignSelf: "flex-start",
    alignItems: "flex-start"
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  userBubble: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: 4
  },
  botBubble: {
    backgroundColor: COLORS.CARD,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20
  },
  userText: {
    color: COLORS.WHITE
  },
  botText: {
    color: COLORS.TEXT
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    color: COLORS.TEXT_MUTED
  },
  userTime: {
    marginRight: 4
  },
  botTime: {
    marginLeft: 4
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    marginTop: 8,
    marginBottom: 16
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13
  },
  promptsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  promptsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8
  },
  promptsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  promptChip: {
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  promptText: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: "600"
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: COLORS.CARD_BORDER,
    alignItems: "flex-end",
    gap: 8
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: COLORS.TEXT
  },
  sendButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.TEXT_MUTED
  },
  sendButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 14
  }
});
