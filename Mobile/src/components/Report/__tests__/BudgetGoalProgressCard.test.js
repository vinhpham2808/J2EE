import React from "react";
import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import BudgetGoalProgressCard from "../BudgetGoalProgressCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {},
  useAppColors: () => ({
    TEXT: "#000",
    TEXT_SECONDARY: "#555",
    PRIMARY: "#EF5E83",
    CARD: "#FFF",
    CARD_BORDER: "#E0E0E0",
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const baseProps = {
  budgetsOnTrack: 3,
  totalBudgets: 5,
  completedGoalsThisMonth: 2,
};

describe("BudgetGoalProgressCard", () => {
  it("renders card title", () => {
    let root;
    act(() => {
      root = create(<BudgetGoalProgressCard {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.budgetGoalProgressTitle");
  });

  it("renders budgetsOnTrack / totalBudgets value", () => {
    let root;
    act(() => {
      root = create(<BudgetGoalProgressCard {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    // Rendered as "{budgetsOnTrack} / {totalBudgets}" → 3 separate children
    expect(texts).toContain(3);
    expect(texts).toContain(5);
  });

  it("renders completedGoalsThisMonth value", () => {
    let root;
    act(() => {
      root = create(<BudgetGoalProgressCard {...baseProps} completedGoalsThisMonth={4} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain(4);
  });

  it("renders budgetSafe label", () => {
    let root;
    act(() => {
      root = create(<BudgetGoalProgressCard {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.budgetSafe");
  });

  it("renders goalCompleted label", () => {
    let root;
    act(() => {
      root = create(<BudgetGoalProgressCard {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.goalCompleted");
  });

  it("renders with zero values without crashing", () => {
    let root;
    act(() => {
      root = create(
        <BudgetGoalProgressCard
          budgetsOnTrack={0}
          totalBudgets={0}
          completedGoalsThisMonth={0}
        />
      );
    });
    expect(root).toBeTruthy();
  });
});
