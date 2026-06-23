import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import AiInsightLockedModal from "../AiInsightLockedModal";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "aiInsight.description": "Tính năng cao cấp giúp phân tích dòng tiền bằng trí tuệ nhân tạo.",
        "aiInsight.feature1": "Tính năng 1",
        "aiInsight.feature2": "Tính năng 2",
        "aiInsight.feature3": "Tính năng 3",
        "aiInsight.feature4": "Tính năng 4",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    OVERLAY: "rgba(0,0,0,0.5)",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    ROSE_MIST: "#FFE4EA",
    BG: "#FFFFFF",
    PRIMARY: "#EF5E83",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    INCOME: "#2A9D8F",
    WHITE: "#FFFFFF",
  },
  useAppColors: () => ({
    OVERLAY: "rgba(0,0,0,0.5)",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    ROSE_MIST: "#FFE4EA",
    BG: "#FFFFFF",
    PRIMARY: "#EF5E83",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    INCOME: "#2A9D8F",
    WHITE: "#FFFFFF",
  }),
}));

describe("AiInsightLockedModal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    mockOnClose.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders all texts and features when visible is true", () => {
    const { getByText } = render(
      <AiInsightLockedModal visible={true} onClose={mockOnClose} />
    );

    expect(getByText("AI Insight")).toBeTruthy();
    expect(getByText("Tính năng cao cấp giúp phân tích dòng tiền bằng trí tuệ nhân tạo.")).toBeTruthy();
    expect(getByText("Tính năng 1")).toBeTruthy();
    expect(getByText("Tính năng 2")).toBeTruthy();
    expect(getByText("Tính năng 3")).toBeTruthy();
    expect(getByText("Tính năng 4")).toBeTruthy();
    expect(getByText("Nâng cấp Premium")).toBeTruthy();
    expect(getByText("Để sau")).toBeTruthy();
  });

  test("calls onClose when 'Để sau' button is pressed", () => {
    const { getByText } = render(
      <AiInsightLockedModal visible={true} onClose={mockOnClose} />
    );

    const laterBtn = getByText("Để sau");
    fireEvent.press(laterBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("calls onClose, waits, and navigates to Payment screen when 'Nâng cấp Premium' is pressed", () => {
    const { getByText } = render(
      <AiInsightLockedModal visible={true} onClose={mockOnClose} />
    );

    const upgradeBtn = getByText("Nâng cấp Premium");
    fireEvent.press(upgradeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Fast-forward timeout
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockNavigate).toHaveBeenCalledWith("SettingTab", { screen: "Payment" });
  });
});
