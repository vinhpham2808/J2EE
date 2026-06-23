import React from "react";
import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import ReceiptSummaryCard from "../ReceiptSummaryCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    TEXT: "#000",
    TEXT_SECONDARY: "#555",
    PRIMARY: "#EF5E83",
    CARD: "#FFF",
    CARD_BORDER: "#E0E0E0",
    EXPENSE: "#F44336",
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatDate: (val) => (val ? "20/06/2024" : "--"),
  formatMoney: (val) => `${val}đ`,
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (n) => n,
}));

const baseProps = {
  itemCount: 3,
  location: "Hà Nội",
  merchant: "Siêu thị ABC",
  receiptDate: "2024-06-20",
  totalAmount: 250000,
};

describe("ReceiptSummaryCard", () => {
  it("renders merchant name with receipt emoji", () => {
    let root;
    act(() => {
      root = create(<ReceiptSummaryCard {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("Siêu thị ABC");
  });

  it("falls back to t('receiptItem.receiptLabel') when merchant is empty", () => {
    let root;
    act(() => {
      root = create(<ReceiptSummaryCard {...baseProps} merchant="" />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("receiptItem.receiptLabel");
  });

  it("renders location with pin emoji when provided", () => {
    let root;
    act(() => {
      root = create(<ReceiptSummaryCard {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("Hà Nội");
  });

  it("does NOT render location row when location is empty", () => {
    let root;
    act(() => {
      root = create(<ReceiptSummaryCard {...baseProps} location="" />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).not.toContain("Hà Nội");
  });

  it("renders formatted date", () => {
    let root;
    act(() => {
      root = create(<ReceiptSummaryCard {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("20/06/2024");
  });

  it("renders item count via t with count option", () => {
    let root;
    act(() => {
      root = create(<ReceiptSummaryCard {...baseProps} itemCount={5} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain('receiptItem.itemsCount:{"count":5}');
  });

  it("renders formatted total amount", () => {
    let root;
    act(() => {
      root = create(<ReceiptSummaryCard {...baseProps} totalAmount={350000} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("350000đ");
  });

  it("renders total label key", () => {
    let root;
    act(() => {
      root = create(<ReceiptSummaryCard {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("receiptItem.totalLabel");
  });
});
