jest.mock("expo-speech-recognition", () => ({
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: jest.fn(),
    abort: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  },
  useSpeechRecognitionEvent: jest.fn((event, handler) => {}),
}));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: "vi" } }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { ROSE_MIST: "#FFE4E9", PRIMARY: "#E8597A", CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", TEXT_SECONDARY: "#999", BG: "#F5F5F5", EXPENSE: "#EF3B3B", TRANSPARENT: "transparent", PRIMARY_LIGHT: "#FFD4DC", WHITE: "#FFF" },
  useAppColors: () => ({ ROSE_MIST: "#FFE4E9", PRIMARY: "#E8597A", CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", TEXT_SECONDARY: "#999", BG: "#F5F5F5", EXPENSE: "#EF3B3B", TRANSPARENT: "transparent", PRIMARY_LIGHT: "#FFD4DC", WHITE: "#FFF" }),
}));
jest.mock("../../../assets/accessories/mic.png", () => "mic.png");

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import VoiceInputButton from "../VoiceInputButton";

jest.useFakeTimers();

describe("VoiceInputButton", () => {
  const ExpoSpeechRecognitionModule = require("expo-speech-recognition").ExpoSpeechRecognitionModule;

  beforeEach(() => { jest.clearAllMocks(); });
  afterAll(() => { jest.useRealTimers(); });

  test("renders mic button", () => {
    const { getByRole } = render(<VoiceInputButton />);
    expect(getByRole("button")).toBeTruthy();
  });

  test("calls start after permission granted", async () => {
    ExpoSpeechRecognitionModule.requestPermissionsAsync.mockResolvedValueOnce({ status: "granted" });

    const { getByRole } = render(<VoiceInputButton />);
    await act(async () => { fireEvent.press(getByRole("button")); });
    act(() => { jest.advanceTimersByTime(3000); });
    await act(async () => {});

    expect(ExpoSpeechRecognitionModule.requestPermissionsAsync).toHaveBeenCalled();
    expect(ExpoSpeechRecognitionModule.abort).toHaveBeenCalled();
    expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalled();
  });

  test("shows error when permission denied", async () => {
    ExpoSpeechRecognitionModule.requestPermissionsAsync.mockResolvedValueOnce({ status: "denied" });

    const { getByRole } = render(<VoiceInputButton />);
    await act(async () => { fireEvent.press(getByRole("button")); });
    act(() => { jest.advanceTimersByTime(3000); });
    await act(async () => {});
  });

  test("renders custom icon when provided", () => {
    const { getByRole } = render(<VoiceInputButton iconSource={{ uri: "custom.png" }} noBackground />);
    expect(getByRole("button")).toBeTruthy();
  });
});
