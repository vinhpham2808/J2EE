import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Pressable } from "react-native";
import LanguageSelector from "../LanguageSelector";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "language.selectorTitle": "Chọn ngôn ngữ",
        "language.viSubtitle": "Ngôn ngữ tiếng Việt",
        "language.enSubtitle": "Ngôn ngữ tiếng Anh",
        "common.apply": "Áp dụng",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    WHITE: "#FFFFFF",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    BG: "#F9F9FA",
  }),
}));

jest.mock("../../../constants/languages", () => ({
  LANGUAGES: [
    { code: "vi", label: "Tiếng Việt", subtitleKey: "language.viSubtitle", flag: "🇻🇳" },
    { code: "en", label: "English", subtitleKey: "language.enSubtitle", flag: "🇺🇸" },
  ],
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }) => <Text>Icon: {name}</Text>,
  };
});

describe("LanguageSelector", () => {
  const mockOnClose = jest.fn();
  const mockOnApply = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders nothing if visible is false", () => {
    const { toJSON } = render(
      <LanguageSelector visible={false} selectedLanguageCode="vi" onClose={mockOnClose} onApply={mockOnApply} />
    );
    expect(toJSON()).toBeNull();
  });

  test("renders selector modal options, selecting language and pressing apply", () => {
    const { getByText } = render(
      <LanguageSelector visible={true} selectedLanguageCode="vi" onClose={mockOnClose} onApply={mockOnApply} />
    );

    expect(getByText("Chọn ngôn ngữ")).toBeTruthy();
    expect(getByText("Tiếng Việt")).toBeTruthy();
    expect(getByText("Ngôn ngữ tiếng Việt")).toBeTruthy();
    expect(getByText("English")).toBeTruthy();
    expect(getByText("Ngôn ngữ tiếng Anh")).toBeTruthy();

    // Select English option
    fireEvent.press(getByText("English"));

    // Press Apply
    fireEvent.press(getByText("Áp dụng"));

    expect(mockOnApply).toHaveBeenCalledWith("en");
  });

  test("clicking overlay backdrop calls onClose", () => {
    const { UNSAFE_getAllByType } = render(
      <LanguageSelector visible={true} selectedLanguageCode="vi" onClose={mockOnClose} onApply={mockOnApply} />
    );

    const pressables = UNSAFE_getAllByType(Pressable);
    // Backdrop pressable is the first Pressable element in modal overlay
    fireEvent.press(pressables[0]);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
