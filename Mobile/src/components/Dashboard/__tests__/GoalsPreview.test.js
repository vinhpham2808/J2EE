jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { TEXT: "#333", },
  useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#B8A6AC", SEPARATOR: "#EEE", GOAL_PROGRESS: "#F97316", APP_BACKGROUND: "#F2F2F7", BADGE_POSITIVE_BG: "rgba(34,197,94,0.1)" }),
}));
jest.mock("../../../utils/layoutScale", () => ({ clampScale: (v) => v, scale: (v) => v }));
jest.mock("../../../utils/format", () => ({ formatMoney: (v) => String(v), formatDate: (v) => v || "" }));
jest.mock("../../common/ShowMoreButton", () => ({ visible, onPress, label }) => null);
jest.mock("../../ui/AppIcon", () => ({ name, size, color, style }) => null);
jest.mock("../../ui/TransactionIcon", () => ({ iconValue, color, containerSize, style }) => null);

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import GoalsPreview from "../GoalsPreview";

describe("GoalsPreview", () => {
  const goals = [
    { id: 1, name: "New Car", targetAmount: 100000000, currentAmount: 25000000, progressPercent: 25, startDate: "2026-01-01", targetDate: "2026-12-31" },
  ];

  test("renders goals title", () => {
    const { getByText } = render(<GoalsPreview goals={[]} />);
    expect(getByText("dashboardComponents.goalsTitle")).toBeTruthy();
  });

  test("renders goal card when goals exist", () => {
    const { getByText } = render(<GoalsPreview goals={goals} />);
    expect(getByText("New Car")).toBeTruthy();
    expect(getByText("25%")).toBeTruthy();
  });

  test("renders empty state when no goals", () => {
    const { getByText } = render(<GoalsPreview goals={[]} />);
    expect(getByText("dashboardComponents.noGoals")).toBeTruthy();
    expect(getByText("dashboardComponents.createGoal")).toBeTruthy();
  });

  test("calls onCreate when create pressed", () => {
    const onCreate = jest.fn();
    const { getByText } = render(<GoalsPreview goals={[]} onCreate={onCreate} />);
    fireEvent.press(getByText("dashboardComponents.createGoal"));
    expect(onCreate).toHaveBeenCalled();
  });

  test("calls onGoalPress when goal pressed", () => {
    const onGoalPress = jest.fn();
    const { getByText } = render(<GoalsPreview goals={goals} onGoalPress={onGoalPress} />);
    fireEvent.press(getByText("New Car"));
    expect(onGoalPress).toHaveBeenCalled();
  });
});
