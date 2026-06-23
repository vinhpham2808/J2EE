import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import GoalDetailModal from "../GoalDetailModal";
import { getGoalVisual } from "../goalUtils";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "goalDetailModal.goal": "Mục tiêu",
        "goalDetailModal.totalProgress": "Tiến độ tổng",
        "goalDetailModal.target": "Hạn mức mục tiêu",
        "goalDetailModal.current": "Hiện có",
        "goalDetailModal.remaining": "Còn lại",
        "goalDetailModal.neededPerMonth": "Mỗi tháng cần",
        "goalDetailModal.monthlyProgress": "Tiến độ tháng",
        "goalDetailModal.close": "Đóng",
        "goalDetailModal.delete": "Xóa mục tiêu",
        "goalDetailModal.contribute": "Tích lũy ngay",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CARD: "#FFFFFF",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    CARD_BORDER: "#E5E7EB",
    BG: "#FFFFFF",
    INCOME: "#22C55E",
    EXPENSE: "#EF4444",
    INFO: "#3B82F6",
    PRIMARY: "#EF5E83",
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatMoney: (val) => `${val}đ`,
  formatDate: (val) => val,
}));

jest.mock("../goalUtils", () => ({
  getGoalVisual: jest.fn(),
}));

describe("GoalDetailModal", () => {
  const goal = {
    id: "g-1",
    name: "Mua xe hơi",
    startDate: "2026-01-01",
    targetDate: "2026-12-01",
    targetAmount: 500000000,
    currentAmount: 100000000,
    remainingAmount: 400000000,
    progressPercent: 20,
    monthlyTarget: 40000000,
    monthlyContributed: 20000000,
    monthlyProgressPercent: 50,
    status: "ACTIVE",
  };

  const defaultProps = {
    goal,
    visible: true,
    onClose: jest.fn(),
    onContribute: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getGoalVisual.mockReturnValue({ bg: "#E6F4EA", label: "Đang thực hiện", color: "#22C55E" });
  });

  test("returns null if goal is not provided", () => {
    const { toJSON } = render(<GoalDetailModal {...defaultProps} goal={null} />);
    expect(toJSON()).toBeNull();
  });

  test("renders all metric details and actions for active goal", () => {
    const { getByText } = render(<GoalDetailModal {...defaultProps} />);

    expect(getByText("Mua xe hơi")).toBeTruthy();
    expect(getByText("2026-01-01 > 2026-12-01")).toBeTruthy();
    expect(getByText("20.0%")).toBeTruthy();

    expect(getByText("Hạn mức mục tiêu")).toBeTruthy();
    expect(getByText("500000000đ")).toBeTruthy();

    expect(getByText("Hiện có")).toBeTruthy();
    expect(getByText("100000000đ")).toBeTruthy();

    expect(getByText("Còn lại")).toBeTruthy();
    expect(getByText("400000000đ")).toBeTruthy();

    expect(getByText("Mỗi tháng cần")).toBeTruthy();
    expect(getByText("40000000đ")).toBeTruthy();

    // Renders active monthly progress details
    expect(getByText("Tiến độ tháng")).toBeTruthy();
    expect(getByText("20000000đ / 40000000đ (50%)")).toBeTruthy();

    // Interactive buttons
    fireEvent.press(getByText("Đóng"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText("Tích lũy ngay"));
    expect(defaultProps.onContribute).toHaveBeenCalledWith(goal);

    fireEvent.press(getByText("Xóa mục tiêu"));
    expect(defaultProps.onDelete).toHaveBeenCalledWith("g-1");
  });

  test("hides contribute and delete buttons for completed goal", () => {
    const completedGoal = {
      ...goal,
      status: "COMPLETED",
    };

    const { getByText, queryByText } = render(
      <GoalDetailModal {...defaultProps} goal={completedGoal} />
    );

    expect(getByText("Đóng")).toBeTruthy();
    expect(queryByText("Tích lũy ngay")).toBeNull();
    expect(queryByText("Xóa mục tiêu")).toBeNull();
  });
});
