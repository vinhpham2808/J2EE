import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useVoiceInput from "../useVoiceInput";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

const eventCallbacks = {};
jest.mock("expo-speech-recognition", () => ({
  useSpeechRecognitionEvent: jest.fn((event, callback) => {
    eventCallbacks[event] = callback;
  }),
  ExpoSpeechRecognitionModule: {
    stop: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    abort: jest.fn(),
    start: jest.fn(),
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "voiceInput.error": "Lỗi giọng nói",
        "voiceInput.errorMessage": "Đã xảy ra lỗi thu âm",
        "voiceInput.permissionTitle": "Quyền truy cập",
        "voiceInput.permissionMessage": "Cần quyền microphone",
        "common.close": "Đóng",
        "auth.common.error": "Lỗi",
        "voiceInput.startFailed": "Không thể bắt đầu thu âm",
      };
      return dict[key] || key;
    },
  }),
}));

// Mock Alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useVoiceInput", () => {
  const onResultMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(eventCallbacks).forEach((k) => delete eventCallbacks[k]);
  });

  test("registers events and handles start/result/end cycle", () => {
    const { result } = renderHook(() => useVoiceInput({ onResult: onResultMock }));

    expect(useSpeechRecognitionEvent).toHaveBeenCalledWith("start", expect.any(Function));
    expect(useSpeechRecognitionEvent).toHaveBeenCalledWith("end", expect.any(Function));
    expect(useSpeechRecognitionEvent).toHaveBeenCalledWith("result", expect.any(Function));
    expect(useSpeechRecognitionEvent).toHaveBeenCalledWith("error", expect.any(Function));

    // Simulate start event
    act(() => {
      eventCallbacks["start"]();
    });
    expect(result.current.isRecording).toBe(true);

    // Simulate result event
    act(() => {
      eventCallbacks["result"]({ results: [{ transcript: "xin chào" }] });
    });
    expect(result.current.voiceTranscript).toBe("xin chào");

    // Simulate end event
    act(() => {
      eventCallbacks["end"]();
    });
    expect(result.current.isRecording).toBe(false);
    expect(onResultMock).toHaveBeenCalledWith("xin chào");
  });

  test("handles speech recognition error", () => {
    const { result } = renderHook(() => useVoiceInput({ onResult: onResultMock }));

    act(() => {
      eventCallbacks["error"]({ error: "no-speech", message: "Không nghe thấy gì" });
    });

    expect(result.current.isRecording).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith("Lỗi giọng nói", "Không nghe thấy gì");
  });

  test("does not show alert for aborted error", () => {
    renderHook(() => useVoiceInput({ onResult: onResultMock }));

    act(() => {
      eventCallbacks["error"]({ error: "aborted" });
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  test("handleMicPress starts recording when permission is granted", async () => {
    ExpoSpeechRecognitionModule.requestPermissionsAsync.mockResolvedValueOnce({ status: "granted" });
    const { result } = renderHook(() => useVoiceInput({ onResult: onResultMock }));

    await act(async () => {
      await result.current.handleMicPress();
    });

    expect(ExpoSpeechRecognitionModule.requestPermissionsAsync).toHaveBeenCalled();
    expect(ExpoSpeechRecognitionModule.abort).toHaveBeenCalled();
    expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalledWith({
      lang: "vi-VN",
      interimResults: true,
      continuous: false,
    });
  });

  test("handleMicPress stops recording if already recording", async () => {
    const { result } = renderHook(() => useVoiceInput({ onResult: onResultMock }));

    // Force recording state by firing start event
    act(() => {
      eventCallbacks["start"]();
    });
    expect(result.current.isRecording).toBe(true);

    await act(async () => {
      await result.current.handleMicPress();
    });

    expect(ExpoSpeechRecognitionModule.stop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });

  test("handleMicPress shows alert if permission denied", async () => {
    ExpoSpeechRecognitionModule.requestPermissionsAsync.mockResolvedValueOnce({ status: "denied" });
    const { result } = renderHook(() => useVoiceInput({ onResult: onResultMock }));

    await act(async () => {
      await result.current.handleMicPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Quyền truy cập", "Cần quyền microphone", expect.any(Array));
    expect(ExpoSpeechRecognitionModule.start).not.toHaveBeenCalled();
  });
});
