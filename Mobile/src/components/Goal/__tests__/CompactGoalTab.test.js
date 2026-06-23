import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CompactGoalTab from "../CompactGoalTab";
import { getGoalVisual } from "../goalUtils";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "goalDetailModal.goal": "Mục tiêu",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    INCOME_COLOR: "#22C55E",
    EXPENSE_COLOR: "#EF4444",
    GOAL_PROGRESS: "#F97316",
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatDate: (val) => val,
}));

jest.mock("../goalUtils", () => ({
  getGoalVisual: jest.fn(),
}));

describe("CompactGoalTab", () => {
  const item = {
    id: "g-1",
    name: "Mua iPhone",
    progressPercent: 55.5,
    startDate: "2026-01-01",
    targetDate: "2026-06-01",
    status: "ACTIVE",
    isBehindSchedule: false,
  };

  const defaultProps = {
    item,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getGoalVisual.mockReturnValue({ bg: "#FFF4E6", label: "Đang thực hiện", color: "#F97316" });
  });

  test("renders active goal details and calls onPress when clicked", () => {
    const { getByText } = render(<CompactGoalTab {...defaultProps} />);

    expect(getByText("Mua iPhone")).toBeTruthy();
    expect(getByText("56%")).toBeTruthy(); // 55.5 rounded to fixed(0)
    expect(getByText("2026-01-01 > 2026-06-01")).toBeTruthy();
    expect(getByText("Đang thực hiện")).toBeTruthy();

    fireEvent.press(getByText("Mua iPhone"));
    expect(defaultProps.onPress).toHaveBeenCalledWith(item);
  });

  test("renders completed goal color schemes", () => {
    getGoalVisual.mockReturnValue({ bg: "#E6F4EA", label: "Đã hoàn thành", color: "#22C55E" });
    const completedItem = {
      ...item,
      status: "COMPLETED",
      progressPercent: 100,
    };

    const { getByText } = render(
      <CompactGoalTab {...defaultProps} item={completedItem} />
    );

    expect(getByText("100%")).toBeTruthy();
    expect(getByText("Đã hoàn thành")).toBeTruthy();
  });
});
