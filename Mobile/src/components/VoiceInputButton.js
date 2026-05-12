import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent
} from "expo-speech-recognition";
import { COLORS } from "../constants/colors";

/**
 * VoiceInputButton — Nút microphone để nhập liệu bằng giọng nói
 *
 * Props:
 *   onResult: (text: string) => void  — Callback khi có kết quả voice-to-text
 *   language: string                  — Mã ngôn ngũ (VD: "vi-VN", "en-US")
 */

// Fallback icon text khi không dùng được vector icons
const MicIcon = ({ size = 24, color = COLORS.PRIMARY }) => (
  <Text style={{ fontSize: size, color }}>🎤</Text>
);

export default function VoiceInputButton({ onResult, language = "vi-VN" }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);

  // Lắng nghe sự kiện speech recognition
  useSpeechRecognitionEvent("start", () => {
    setRecognizing(true);
    setError(null);
  });

  useSpeechRecognitionEvent("end", () => {
    setRecognizing(false);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results?.[0]?.transcript || "";
    setTranscript(text);
  });

  useSpeechRecognitionEvent("error", (event) => {
    setRecognizing(false);
    setError(event.message || "Không thể nhận dạng giọng nói");
  });

  const handleStart = useCallback(async () => {
    try {
      // Yêu cầu quyền trước
      const permResult = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert(
          "Quyền bị từ chối",
          "Vui lòng cấp quyền micro và nhận dạng giọng nói trong Cài đặt để sử dụng tính năng này."
        );
        return;
      }

      setTranscript("");
      setError(null);
      setModalVisible(true);

      // Đợi modal render xong rồi mới start
      setTimeout(() => {
        ExpoSpeechRecognitionModule.start({
          lang: language,
          interimResults: true,
          continuous: false
        });
      }, 300);
    } catch (err) {
      setError(err.message || "Không thể khởi động voice input");
    }
  }, [language]);

  const handleStop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    setRecognizing(false);
  }, []);

  const handleConfirm = useCallback(() => {
    handleStop();
    setModalVisible(false);
    if (transcript.trim()) {
      onResult?.(transcript.trim());
    }
  }, [handleStop, transcript, onResult]);

  const handleCancel = useCallback(() => {
    ExpoSpeechRecognitionModule.abort();
    setModalVisible(false);
    setRecognizing(false);
    setTranscript("");
    setError(null);
  }, []);

  return (
    <>
      {/* Nút mic để kích hoạt voice input */}
      <Pressable
        style={({ pressed }) => [
          styles.micButton,
          pressed && styles.micButtonPressed
        ]}
        onPress={handleStart}
        accessibilityLabel="Nhập liệu bằng giọng nói"
        accessibilityRole="button"
      >
        <MicIcon size={22} color={COLORS.PRIMARY} />
      </Pressable>

      {/* Modal voice input */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icon mic lớn */}
            <View style={[styles.micCircle, recognizing && styles.micCircleActive]}>
              <MicIcon size={48} color={recognizing ? COLORS.WHITE : COLORS.PRIMARY} />
            </View>

            {/* Trạng thái */}
            <Text style={styles.statusText}>
              {recognizing
                ? "Đang nghe..."
                : error
                  ? "Lỗi"
                  : transcript
                    ? "Hoàn thành"
                    : "Đang chuẩn bị..."}
            </Text>

            {/* Kết quả transcript */}
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptText}>
                {transcript || (recognizing ? "Hãy nói nội dung chi tiêu..." : "")}
              </Text>
            </View>

            {/* Error message */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Nút điều khiển */}
            <View style={styles.actionRow}>
              <Pressable style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>

              {recognizing ? (
                <Pressable style={styles.stopButton} onPress={handleStop}>
                  <Text style={styles.stopText}>Dừng</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.confirmButton, !transcript.trim() && styles.buttonDisabled]}
                  onPress={handleConfirm}
                  disabled={!transcript.trim()}
                >
                  <Text style={styles.confirmText}>Xong</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.ROSE_MIST,
    alignItems: "center",
    justifyContent: "center"
  },
  micButtonPressed: {
    backgroundColor: COLORS.PRIMARY_LIGHT
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    width: "85%",
    backgroundColor: COLORS.CARD,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10
  },
  micCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.ROSE_MIST,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  micCircleActive: {
    backgroundColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT,
    marginBottom: 16
  },
  transcriptContainer: {
    width: "100%",
    minHeight: 60,
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 16
  },
  transcriptText: {
    fontSize: 16,
    color: COLORS.TEXT,
    lineHeight: 22
  },
  errorText: {
    color: COLORS.EXPENSE,
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center"
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%"
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingVertical: 12,
    alignItems: "center"
  },
  cancelText: {
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600"
  },
  stopButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: COLORS.EXPENSE,
    paddingVertical: 12,
    alignItems: "center"
  },
  stopText: {
    color: COLORS.WHITE,
    fontWeight: "700"
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    alignItems: "center"
  },
  confirmText: {
    color: COLORS.WHITE,
    fontWeight: "700"
  },
  buttonDisabled: {
    opacity: 0.5
  }
});
