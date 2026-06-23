jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 44, bottom: 34 }) }));
jest.mock("../../utils/appAlertConfig", () => ({
  APP_ALERT_VARIANTS: {
    success: { image: "success.png", accent: "#4ADE70", accentDark: "#22C55E", soft: "#E8F5E9", glow: "rgba(34,197,94,0.15)", title: "#1A0F14" },
    error: { image: "error.png", accent: "#EF3B3B", accentDark: "#DC2626", soft: "#FDE8E3", glow: "rgba(239,68,68,0.15)", title: "#1A0F14" },
    warning: { image: "warning.png", accent: "#FFB84D", accentDark: "#D97706", soft: "#FFF3E0", glow: "rgba(255,184,77,0.2)", title: "#1A0F14" },
    confirm: { image: "confirm.png", accent: "#FFB84D", accentDark: "#D97706", soft: "#FFE4EA", glow: "rgba(255,184,77,0.2)", title: "#1A0F14" },
    info: { image: "info.png", accent: "#6B9BD2", accentDark: "#2563EB", soft: "#E8F0FE", glow: "rgba(107,155,210,0.15)", title: "#1A0F14" },
  },
  DEFAULT_ALERT_BUTTON_TEXT: () => "OK",
  DEFAULT_ALERT_TITLE: () => "Thông báo",
  resolveAlertVariant: jest.fn((t, m, b) => {
    if (b?.some((btn) => btn?.style === "destructive")) return "confirm";
    const content = `${(t || "").toLowerCase()} ${(m || "").toLowerCase()}`;
    if (content.includes("lỗi") || content.includes("error")) return "error";
    if (content.includes("success") || content.includes("thành công")) return "success";
    if (content.includes("cảnh báo") || content.includes("warning")) return "warning";
    return "info";
  }),
}));
jest.mock("../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFF5F7",
    CARD: "#FFFFFF",
    CARD_BORDER: "#F0E2E6",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    SHADOW_COLOR: "rgba(239,94,131,0.08)",
  }),
}));

import React from "react";
import { render, act, fireEvent } from "@testing-library/react-native";
import { Alert as NativeAlert, Text } from "react-native";
import { AppAlertProvider, AppAlert } from "../AppAlertContext";

jest.useFakeTimers();

describe("AppAlertContext", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  afterAll(() => { jest.useRealTimers(); });

  test("renders children", () => {
    const { getByText } = render(
      <AppAlertProvider>
        <Text>Child Content</Text>
      </AppAlertProvider>
    );
    expect(getByText("Child Content")).toBeTruthy();
  });

  test("showAlert through provider shows modal", () => {
    const { queryByText } = render(
      <AppAlertProvider>
        <Text>Child</Text>
      </AppAlertProvider>
    );

    act(() => {
      AppAlert.alert("Test Title", "Test Message");
    });
    act(() => { jest.runAllTimers(); });

    expect(queryByText("Test Title")).toBeTruthy();
    expect(queryByText("Test Message")).toBeTruthy();
  });

  test("renders default button when no buttons provided", () => {
    const { queryByText } = render(
      <AppAlertProvider>
        <Text>Child</Text>
      </AppAlertProvider>
    );

    act(() => { AppAlert.alert("Title", "Message"); });
    act(() => { jest.runAllTimers(); });

    expect(queryByText("OK")).toBeTruthy();
  });

  test("renders multiple buttons", () => {
    const { queryByText } = render(
      <AppAlertProvider>
        <Text>Child</Text>
      </AppAlertProvider>
    );

    act(() => { AppAlert.alert("Title", "Message", [{ text: "Cancel", style: "cancel" }, { text: "OK" }]); });
    act(() => { jest.runAllTimers(); });

    expect(queryByText("Cancel")).toBeTruthy();
    expect(queryByText("OK")).toBeTruthy();
  });

  test("pressing button calls onPress and dismisses", () => {
    const onPress = jest.fn();
    const { queryByText } = render(
      <AppAlertProvider>
        <Text>Child</Text>
      </AppAlertProvider>
    );

    act(() => { AppAlert.alert("Title", "Message", [{ text: "OK", onPress }]); });
    act(() => { jest.runAllTimers(); });

    const okButton = queryByText("OK");
    act(() => { fireEvent.press(okButton); });
    act(() => { jest.runAllTimers(); });

    expect(onPress).toHaveBeenCalled();
  });

  test("pressing cancel button dismisses modal", () => {
    const { queryByText } = render(
      <AppAlertProvider>
        <Text>Child</Text>
      </AppAlertProvider>
    );

    act(() => { AppAlert.alert("Title", "Message", [{ text: "Cancel", style: "cancel" }, { text: "OK" }]); });
    act(() => { jest.runAllTimers(); });

    const cancelButton = queryByText("Cancel");
    act(() => { fireEvent.press(cancelButton); });
    act(() => { jest.runAllTimers(); });

    expect(queryByText("Title")).toBeNull();
  });

  test("modal is not visible when no alert", () => {
    const { queryByText } = render(
      <AppAlertProvider>
        <Text>Child</Text>
      </AppAlertProvider>
    );

    expect(queryByText("Thông báo")).toBeNull();
  });

  test("handles alert with empty title uses default", () => {
    const { queryByText } = render(
      <AppAlertProvider>
        <Text>Child</Text>
      </AppAlertProvider>
    );

    act(() => { AppAlert.alert("", ""); });
    act(() => { jest.runAllTimers(); });
    expect(queryByText("Thông báo")).toBeTruthy();
  });
});
