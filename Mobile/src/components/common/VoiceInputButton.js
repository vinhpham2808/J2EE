import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
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
import { COLORS, useAppColors } from "../../constants/colors";

const MIC_ICON = require("../../assets/accessories/mic.png");

/**
 * VoiceInputButton — Nút microphone để nhập liệu bằng giọng nói
 *
 * Props:
 *   onResult: (text: string) => void  — Callback khi có kết quả voice-to-text
 *   language: string                  — Mã ngôn ngũ (VD: "vi-VN", "en-US")
 */

export default function VoiceInputButton({ iconSource, iconStyle, noBackground = false, onResult, language = "vi-VN" }) {
  const colors = useAppColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Lắng nghe sự kiện speech recognition
  useSpeechRecognitionEvent("start", () => {
    console.log("Speech recognition started");
    setRecognizing(true);
    setIsStarting(false);
    setError(null);
  });

  useSpeechRecognitionEvent("end", () => {
    console.log("Speech recognition ended");
    setRecognizing(false);
    setIsStarting(false);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results?.[0]?.transcript || "";
    setTranscript(text);
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech recognition error:", event);
    setRecognizing(false);
    setIsStarting(false);
    setError(event.message || "Không thể nhận dạng giọng nói");
  });

  const handleStart = useCallback(async () => {
    if (recognizing || isStarting) {
      console.log("Already recognizing or starting");
      return;
    }

    try {
      setIsStarting(true);
      setError(null);
      setTranscript("");

      // Yêu cầu quyền microphone
      const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (status !== "granted") {
        setError("Ứng dụng cần quyền truy cập microphone để nhận diện giọng nói.");
        setModalVisible(true);
        setIsStarting(false);
        return;
      }

      console.log("Aborting any existing sessions...");
      await ExpoSpeechRecognitionModule.abort();

      // Thêm độ trễ nhỏ để đảm bảo phiên cũ đã dừng hẳn
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log("Opening modal and starting recognition...");
      setModalVisible(true);

      // Start recognition
      ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: true,
        continuous: false
      });

      // Safety timeout to reset isStarting if start event never fires
      setTimeout(() => {
        setIsStarting(false);
      }, 3000);

    } catch (err) {
      console.error("handleStart error:", err);
      setIsStarting(false);
      setError(err.message || "Không thể khởi động voice input");
      setModalVisible(true); // Show error in modal
    }
  }, [language, recognizing, isStarting]);

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
    setIsStarting(false);
  }, []);

  return (
    <>
      {/* Nút mic để kích hoạt voice input */}
      <Pressable
        style={({ pressed }) => [
          styles.micButton,
          !noBackground && { backgroundColor: colors.ROSE_MIST },
          noBackground && styles.micButtonNoBackground,
          pressed && !noBackground && styles.micButtonPressed,
          (recognizing || isStarting) && styles.micButtonDisabled
        ]}
        onPress={handleStart}
        disabled={recognizing || isStarting}
        accessibilityLabel="Nhập liệu bằng giọng nói"
        accessibilityRole="button"
      >
        {iconSource ? (
          <Image source={iconSource} style={[styles.triggerIcon, iconStyle]} resizeMode="contain" />
        ) : (
          <Image source={MIC_ICON} style={styles.triggerIcon} resizeMode="contain" />
        )}
      </Pressable>

      {/* Modal voice input */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.CARD }]}>
            {/* Icon mic lớn */}
            <View style={[styles.micIconWrap, recognizing && styles.micIconActive]}>
              <Image source={MIC_ICON} style={styles.modalMicIcon} resizeMode="contain" />
            </View>

            {/* Trạng thái */}
            <Text style={[styles.statusText, { color: colors.TEXT }]}>
              {recognizing
                ? "Đang nghe..."
                : error
                  ? "Lỗi"
                  : transcript
                    ? "Hoàn thành"
                    : "Đang chuẩn bị..."}
            </Text>

            {/* Kết quả transcript */}
            <View style={[styles.transcriptContainer, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER }]}>
              <Text style={[styles.transcriptText, { color: colors.TEXT }]}>
                {transcript || (recognizing ? "Hãy nói nội dung giao dịch..." : (isStarting ? "Đang khởi động..." : ""))}
              </Text>
            </View>

            {/* Error message */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Nút điều khiển */}
            <View style={styles.actionRow}>
              <Pressable style={[styles.cancelButton, { borderColor: colors.CARD_BORDER }]} onPress={handleCancel}>
                <Text style={[styles.cancelText, { color: colors.TEXT_SECONDARY }]}>Hủy</Text>
              </Pressable>

              {recognizing ? (
                <Pressable style={[styles.stopButton, { backgroundColor: colors.EXPENSE }]} onPress={handleStop}>
                  <Text style={styles.stopText}>Dừng</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.confirmButton, { backgroundColor: colors.PRIMARY }, (!transcript.trim() && !error) && styles.buttonDisabled]}
                  onPress={error ? handleCancel : handleConfirm}
                  disabled={!transcript.trim() && !error}
                >
                  <Text style={styles.confirmText}>{error ? "Đóng" : "Xong"}</Text>
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
    alignItems: "center",
    justifyContent: "center"
  },
  micButtonNoBackground: {
    backgroundColor: COLORS.TRANSPARENT
  },
  triggerIcon: {
    width: 24,
    height: 24
  },
  micButtonPressed: {
    backgroundColor: COLORS.PRIMARY_LIGHT
  },
  micButtonDisabled: {
    opacity: 0.6
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
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10
  },
  micIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  micIconActive: {
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8
  },
  modalMicIcon: {
    width: 72,
    height: 72
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
