import React from "react";
import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import ReportAdviceCard from "../ReportAdviceCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key),
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {},
  useAppColors: () => ({
    TEXT: "#000",
    TEXT_SECONDARY: "#555",
    PRIMARY: "#EF5E83",
    CARD: "#FFF",
    CARD_BORDER: "#E0E0E0",
    INCOME: "#4CAF50",
    EXPENSE: "#F44336",
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

describe("ReportAdviceCard", () => {
  it("returns null when report is null", () => {
    let root;
    act(() => {
      root = create(<ReportAdviceCard report={null} />);
    });
    expect(root.toJSON()).toBeNull();
  });

  it("renders card title (assessmentTitle)", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: 30,
            budgetsOnTrack: 2,
            totalBudgets: 2,
            spendingChangePercent: -5,
            completedGoalsThisMonth: 1,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.assessmentTitle");
  });

  // ---------- Strengths ----------
  it("renders strengthSavings when savingsRate > 20", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: 25,
            budgetsOnTrack: 0,
            totalBudgets: 0,
            spendingChangePercent: 0,
            completedGoalsThisMonth: 0,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain('reportComponents.strengthSavings:{"rate":"25.0"}');
  });

  it("renders strengthBudget when all budgets on track", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: 0,
            budgetsOnTrack: 3,
            totalBudgets: 3,
            spendingChangePercent: 0,
            completedGoalsThisMonth: 0,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.strengthBudget");
  });

  it("renders strengthSpendingDecrease when spendingChangePercent < 0", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: 0,
            budgetsOnTrack: 0,
            totalBudgets: 0,
            spendingChangePercent: -10,
            completedGoalsThisMonth: 0,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain('reportComponents.strengthSpendingDecrease:{"percent":"10.0"}');
  });

  it("renders strengthGoalCompleted when completedGoals > 0", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: 0,
            budgetsOnTrack: 0,
            totalBudgets: 0,
            spendingChangePercent: 0,
            completedGoalsThisMonth: 2,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain('reportComponents.strengthGoalCompleted:{"count":2}');
  });

  it("renders strengthDefault when no strengths qualify", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: 5,
            budgetsOnTrack: 1,
            totalBudgets: 3,
            spendingChangePercent: 5,
            completedGoalsThisMonth: 0,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.strengthDefault");
  });

  // ---------- Improvements ----------
  it("renders improveSavingsLow when savingsRate < 10", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: 5,
            budgetsOnTrack: 0,
            totalBudgets: 0,
            spendingChangePercent: 0,
            completedGoalsThisMonth: 1,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain('reportComponents.improveSavingsLow:{"rate":"5.0"}');
  });

  it("renders improveDeficit when savingsRate < 0", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: -5,
            budgetsOnTrack: 0,
            totalBudgets: 0,
            spendingChangePercent: 0,
            completedGoalsThisMonth: 1,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.improveDeficit");
  });

  it("renders improveBudgetOverspent when some budgets exceeded", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: 15,
            budgetsOnTrack: 1,
            totalBudgets: 4,
            spendingChangePercent: 0,
            completedGoalsThisMonth: 1,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain('reportComponents.improveBudgetOverspent:{"count":3}');
  });

  it("renders improveNoGoal when completedGoals === 0", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: 15,
            budgetsOnTrack: 2,
            totalBudgets: 2,
            spendingChangePercent: 0,
            completedGoalsThisMonth: 0,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.improveNoGoal");
  });

  it("renders improveDefault when no improvements qualify", () => {
    let root;
    act(() => {
      root = create(
        <ReportAdviceCard
          report={{
            savingsRate: 15,
            budgetsOnTrack: 2,
            totalBudgets: 2,
            spendingChangePercent: 0,
            completedGoalsThisMonth: 2,
          }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.improveDefault");
  });
});
