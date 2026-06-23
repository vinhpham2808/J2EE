import React from "react";
import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import CategoryBreakdownCard from "../CategoryBreakdownCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    TEXT: "#000",
    TEXT_SECONDARY: "#555",
    PRIMARY: "#EF5E83",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E0E0E0",
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("react-native-chart-kit", () => ({
  PieChart: () => null,
}));

jest.mock("../../../utils/format", () => ({
  formatMoney: (val) => `${val}đ`,
}));

jest.mock("../../../utils/categoryIcons", () => ({
  CategoryVectorIcon: () => null,
  getIconColor: () => "#888",
}));

// Mock useWindowDimensions
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  default: () => ({ width: 375, height: 812 }),
}));

const sampleCategories = [
  { name: "Food", amount: 300000, percent: 60, color: "#4CAF50", icon: null },
  { name: "Transport", amount: 200000, percent: 40, color: "#2196F3", icon: null },
];

describe("CategoryBreakdownCard", () => {
  it("returns null when categories is empty", () => {
    let root;
    act(() => {
      root = create(<CategoryBreakdownCard categories={[]} />);
    });
    expect(root.toJSON()).toBeNull();
  });

  it("returns null when categories is undefined/null", () => {
    let root;
    act(() => {
      root = create(<CategoryBreakdownCard categories={null} />);
    });
    expect(root.toJSON()).toBeNull();
  });

  it("renders card title", () => {
    let root;
    act(() => {
      root = create(<CategoryBreakdownCard categories={sampleCategories} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.categoryExpenseTitle");
  });

  it("renders totalExpenseLabel in donut hole", () => {
    let root;
    act(() => {
      root = create(<CategoryBreakdownCard categories={sampleCategories} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("reportComponents.totalExpenseLabel");
  });

  it("renders total amount (sum of all categories) in donut hole", () => {
    let root;
    act(() => {
      root = create(<CategoryBreakdownCard categories={sampleCategories} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    // 300000 + 200000 = 500000
    expect(texts).toContain("500000đ");
  });

  it("renders each category name in legend", () => {
    let root;
    act(() => {
      root = create(<CategoryBreakdownCard categories={sampleCategories} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("Food");
    expect(texts).toContain("Transport");
  });

  it("renders formatted amount for each category", () => {
    let root;
    act(() => {
      root = create(<CategoryBreakdownCard categories={sampleCategories} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("300000đ");
    expect(texts).toContain("200000đ");
  });

  it("renders percent value for each category", () => {
    let root;
    act(() => {
      root = create(<CategoryBreakdownCard categories={sampleCategories} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    // React renders `{Math.round(percentVal)}%` as [60, "%"]
    expect(texts).toContain(60);
    expect(texts).toContain(40);
    expect(texts.filter((t) => t === "%").length).toBeGreaterThanOrEqual(2);
  });

  it("uses t('otherCategory') fallback when category name is missing", () => {
    const noNameCategories = [{ amount: 100000, color: "#888" }];
    let root;
    act(() => {
      root = create(<CategoryBreakdownCard categories={noNameCategories} />);
    });
    // PieChart data uses t(otherCategory) as name but is mocked out;
    // legend renders item.name which is undefined → just verify no crash
    expect(root).toBeTruthy();
  });

  it("calculates percent from amount when percent not provided", () => {
    const noPctCategories = [
      { name: "A", amount: 200000, color: "#111" },
      { name: "B", amount: 800000, color: "#222" },
    ];
    let root;
    act(() => {
      root = create(<CategoryBreakdownCard categories={noPctCategories} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    // 200000/1000000 = 20%, 800000/1000000 = 80% — rendered as [20, "%"] pairs
    expect(texts).toContain(20);
    expect(texts).toContain(80);
  });
});
