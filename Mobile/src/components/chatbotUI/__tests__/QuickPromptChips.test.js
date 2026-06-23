import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import QuickPromptChips from "../QuickPromptChips";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "chatbot.promptTitle": "Gợi ý hỏi Nova",
        "chatbot.promptSavings": "Làm thế nào để tiết kiệm?",
        "chatbot.promptSpending": "Tôi đã tiêu bao nhiêu?",
        "chatbot.promptWorry": "Tôi có vượt hạn mức?",
        "chatbot.promptPlan": "Lập kế hoạch tài chính",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    ROSE_MIST: "#FFE4EA",
    INCOME: "#4CDAD9",
    WHITE: "#FFFFFF",
  },
  useAppColors: () => ({
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    ROSE_MIST: "#FFE4EA",
    INCOME: "#4CDAD9",
    WHITE: "#FFFFFF",
  }),
}));

describe("QuickPromptChips", () => {
  const defaultProps = {
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders chips correctly", () => {
    const { getByText } = render(<QuickPromptChips {...defaultProps} />);

    expect(getByText("Gợi ý hỏi Nova")).toBeTruthy();
    expect(getByText("Làm thế nào để tiết kiệm?")).toBeTruthy();
    expect(getByText("Tôi đã tiêu bao nhiêu?")).toBeTruthy();
    expect(getByText("Tôi có vượt hạn mức?")).toBeTruthy();
    expect(getByText("Lập kế hoạch tài chính")).toBeTruthy();
  });

  test("triggers onSelect callback when chip is pressed", () => {
    const { getByText } = render(<QuickPromptChips {...defaultProps} />);

    const chip = getByText("Tôi đã tiêu bao nhiêu?");
    fireEvent.press(chip);

    expect(defaultProps.onSelect).toHaveBeenCalledWith({
      label: "Tôi đã tiêu bao nhiêu?",
      text: "Tôi đã tiêu bao nhiêu?",
      labelKey: "chatbot.promptSpending",
      textKey: "chatbot.promptSpending",
    });
  });
});
