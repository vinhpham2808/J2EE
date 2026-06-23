import React from "react";
import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import ReportMetricCard from "../ReportMetricCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key),
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    INCOME: "#4CAF50",
    INCOME_LIGHT: "#E8F5E9",
    INFO: "#2196F3",
    INFO_LIGHT: "#E3F2FD",
    WARNING: "#FF9800",
    WARNING_LIGHT: "#FFF3E0",
    PRIMARY: "#EF5E83",
    ROSE_MIST: "rgba(239,94,131,0.08)",
    EXPENSE: "#F44336",
    EXPENSE_LIGHT: "#FFEBEE",
  },
  useAppColors: () => ({
    TEXT: "#000",
    TEXT_SECONDARY: "#555",
    TEXT_MUTED: "#999",
    PRIMARY: "#EF5E83",
    PRIMARY_LIGHT: "rgba(239,94,131,0.2)",
    INCOME: "#4CAF50",
    EXPENSE: "#F44336",
    CARD: "#FFF",
    CARD_BORDER: "#E0E0E0",
    BG: "#F5F5F5",
    ROSE_MIST: "rgba(239,94,131,0.08)",
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

// Mock react-native-svg
jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }) => <View>{children}</View>,
    Circle: () => null,
  };
});

jest.mock("../../../utils/format", () => ({
  formatMoney: (val) => `${val}đ`,
}));

const baseReport = {
  grade: "A",
  savingsRate: 30,
  spendingChangePercent: -5,
  totalIncome: 10000000,
  totalExpense: 7000000,
  savings: 3000000,
  prevMonthIncome: 9000000,
  prevMonthExpense: 8000000,
  prevMonthSavings: 1000000,
};

describe("ReportMetricCard", () => {
  it("renders grade letter from GradeMeter", () => {
    let root;
    act(() => {
      root = create(<ReportMetricCard report={baseReport} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("A");
  });

  it("renders grade score '92 / 100' for grade A", () => {
    let root;
    act(() => {
      root = create(<ReportMetricCard report={baseReport} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain(" / 100");
    expect(texts).toContain(92);
  });

  it("renders grade label key", () => {
    let root;
    act(() => {
      root = create(<ReportMetricCard report={baseReport} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.gradeA");
  });

  it("renders savings rate percentage", () => {
    let root;
    act(() => {
      root = create(<ReportMetricCard report={baseReport} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.savingsRate");
    // savingsRate=30 → displayed as 30%
    expect(texts).toContain(30);
  });

  it("renders spending decrease pill when spendingChangePercent < 0", () => {
    let root;
    act(() => {
      root = create(
        <ReportMetricCard report={{ ...baseReport, spendingChangePercent: -8 }} />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain('reportComponents.spendingDecrease:{"percent":8}');
  });

  it("renders spending increase pill when spendingChangePercent > 0", () => {
    let root;
    act(() => {
      root = create(
        <ReportMetricCard report={{ ...baseReport, spendingChangePercent: 12 }} />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain('reportComponents.spendingIncrease:{"percent":12}');
  });

  it("renders spendingEquivalent when spendingChangePercent === 0", () => {
    let root;
    act(() => {
      root = create(
        <ReportMetricCard report={{ ...baseReport, spendingChangePercent: 0 }} />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.spendingEquivalent");
  });

  it("renders financialMetrics section title", () => {
    let root;
    act(() => {
      root = create(<ReportMetricCard report={baseReport} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.financialMetrics");
  });

  it("renders totalIncomeLabel and formatted totalIncome", () => {
    let root;
    act(() => {
      root = create(<ReportMetricCard report={baseReport} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.totalIncomeLabel");
    expect(texts).toContain("10000000đ");
  });

  it("renders totalExpenseLabel and formatted totalExpense", () => {
    let root;
    act(() => {
      root = create(<ReportMetricCard report={baseReport} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.totalExpenseLabel");
    expect(texts).toContain("7000000đ");
  });

  it("renders accumulatedSavings label and formatted savings", () => {
    let root;
    act(() => {
      root = create(<ReportMetricCard report={baseReport} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.accumulatedSavings");
    expect(texts).toContain("3000000đ");
  });

  it("renders prevMonth values with lastMonth label", () => {
    let root;
    act(() => {
      root = create(<ReportMetricCard report={baseReport} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.lastMonth");
    expect(texts).toContain("9000000đ");
    expect(texts).toContain("8000000đ");
  });

  it("renders vsLastMonth sub label in spending pill", () => {
    let root;
    act(() => {
      root = create(<ReportMetricCard report={baseReport} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("dashboardComponents.vsLastMonth");
  });

  it("normalizes fractional savingsRate (< 1 treated as %) correctly", () => {
    let root;
    act(() => {
      root = create(
        <ReportMetricCard report={{ ...baseReport, savingsRate: 0.25 }} />
      );
    });
    // 0.25 → abs <= 1 → multiply by 100 → 25 → Math.round → 25
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain(25);
  });

  it("renders grade F when unknown grade provided", () => {
    let root;
    act(() => {
      root = create(
        <ReportMetricCard report={{ ...baseReport, grade: "Z" }} />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    // GradeMeter falls back to GRADE_CONFIG.F → grade letter shown is the prop
    expect(texts).toContain("Z");
  });
});
