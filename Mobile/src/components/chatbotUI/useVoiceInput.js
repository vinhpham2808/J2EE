import { useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent
} from "expo-speech-recognition";

/**
 * useVoiceInput — Custom hook quản lý toàn bộ luồng nhập liệu bằng giọng nói.
 *
 * Props:
 *   language  — mã ngôn ngữ (mặc định "vi-VN")
 *   onResult  — callback khi thu âm kết thúc, nhận transcript cuối cùng (string)
 *
 * Trả về:
 *   isRecording      — đang thu âm
 *   isStartingVoice  — đang khởi tạo session
 *   voiceTranscript  — text đã nhận dạng được (real-time)
 *   handleMicPress   — callback gắn vào nút mic (toggle start/stop)
 */
export default function useVoiceInput({ language = "vi-VN", onResult } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isStartingVoice, setIsStartingVoice] = useState(false);

  // Ref lưu transcript cuối cùng để callback onResult (tránh stale closure)
  const transcriptRef = useRef("");
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult; // luôn fresh

  // ── Speech recognition events ──────────────────────────

  useSpeechRecognitionEvent("start", () => {
    setIsRecording(true);
    setIsStartingVoice(false);
    setVoiceTranscript("");
    transcriptRef.current = "";
  });

  useSpeechRecognitionEvent("end", () => {
    setIsRecording(false);
    // Gọi onResult với transcript cuối cùng
    const final = transcriptRef.current.trim();
    if (final && onResultRef.current) {
      onResultRef.current(final);
    }
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results?.[0]?.transcript || "";
    setVoiceTranscript(text);
    transcriptRef.current = text;
  });

  useSpeechRecognitionEvent("error", (event) => {
    // "aborted" là lỗi do ta chủ động gọi abort() — bỏ qua, không hiển thị Alert
    if (event.error === "aborted") {
      console.log("[useVoiceInput] Speech recognition aborted (intentional)");
      return;
    }
    console.log("[useVoiceInput] Speech recognition error:", event);
    setIsRecording(false);
    setIsStartingVoice(false);
    Alert.alert(
      "Lỗi nhận diện giọng nói",
      event.message || "Không thể nhận dạng giọng nói. Vui lòng thử lại."
    );
  });

  // ── Toggle mic ─────────────────────────────────────────

  const handleMicPress = useCallback(async () => {
    // Đang recording → dừng (transcript sẽ được trả qua onResult trong event "end")
    if (isRecording || isStartingVoice) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      return;
    }

    try {
      setIsStartingVoice(true);

      // Xin quyền microphone
      const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Yêu cầu quyền microphone",
          "Ứng dụng cần quyền truy cập microphone để nhập liệu bằng giọng nói. Vui lòng cấp quyền trong Cài đặt.",
          [{ text: "Đóng", style: "cancel" }]
        );
        setIsStartingVoice(false);
        return;
      }

      // Huỷ session cũ (nếu có) trước khi bắt đầu session mới
      await ExpoSpeechRecognitionModule.abort();
      await new Promise((resolve) => setTimeout(resolve, 100));

      ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: true,
        continuous: false
      });

      // Safety timeout: reset isStartingVoice nếu "start" event không bao giờ fire
      setTimeout(() => {
        setIsStartingVoice(false);
      }, 3000);
    } catch (err) {
      console.error("[useVoiceInput] handleMicPress error:", err);
      setIsStartingVoice(false);
      Alert.alert("Lỗi", "Không thể khởi động voice input. Vui lòng thử lại.");
    }
  }, [isRecording, isStartingVoice, language]);

  return {
    isRecording,
    isStartingVoice,
    voiceTranscript,
    handleMicPress
  };
}
