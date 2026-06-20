jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { INCOME: "#22C55E", TEXT: "#333", TEXT_SECONDARY: "#999", CARD: "#FFF", CARD_BORDER: "#EEE", SHADOW_COLOR: "#000", ACTION_INCOME: "#22C55E", INCOME_LIGHT: "rgba(34,197,94,0.15)", BG: "#F5F5F5", PRIMARY: "#E8597A", PRIMARY_LIGHT: "#FFD4DC", WHITE: "#FFF" },
  useAppColors: () => ({ INCOME: "#22C55E", TEXT: "#333", TEXT_SECONDARY: "#999", CARD: "#FFF", CARD_BORDER: "#EEE", SHADOW_COLOR: "#000", ACTION_INCOME: "#22C55E", INCOME_LIGHT: "rgba(34,197,94,0.15)", BG: "#F5F5F5", PRIMARY: "#E8597A", PRIMARY_LIGHT: "#FFD4DC", WHITE: "#FFF" }),
}));
jest.mock("../../../utils/format", () => ({ formatMoney: (v) => String(v) }));
jest.mock("../../common/VoiceInputButton", () => ({ iconSource, noBackground, onResult }) => null);
jest.mock("../../../assets/accessories/mic.png", () => "mic.png");

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import IncomeSummaryCard from "../IncomeSummaryCard";

describe("IncomeSummaryCard", () => {
  test("renders total income and add button", () => {
    const { getByText } = render(<IncomeSummaryCard totalIncome={5000000} incomeCount={3} onAddIncome={jest.fn()} onExport={jest.fn()} />);
    expect(getByText("5000000")).toBeTruthy();
    expect(getByText(/incomeSummary.addIncome/)).toBeTruthy();
  });

  test("calls onAddIncome when add pressed", () => {
    const onAddIncome = jest.fn();
    const { getByText } = render(<IncomeSummaryCard totalIncome={0} incomeCount={0} onAddIncome={onAddIncome} onExport={jest.fn()} />);
    fireEvent.press(getByText(/incomeSummary.addIncome/));
    expect(onAddIncome).toHaveBeenCalled();
  });

  test("calls onExport when export pressed", () => {
    const onExport = jest.fn();
    const { getByText } = render(<IncomeSummaryCard totalIncome={0} incomeCount={0} filterType="all" onAddIncome={jest.fn()} onExport={onExport} />);
    fireEvent.press(getByText("incomeSummary.downloadAll"));
    expect(onExport).toHaveBeenCalled();
  });

  test("shows generating state when isExporting", () => {
    const { getByText } = render(<IncomeSummaryCard totalIncome={0} incomeCount={0} isExporting onAddIncome={jest.fn()} onExport={jest.fn()} />);
    expect(getByText("incomeSummary.generating")).toBeTruthy();
  });

  test("shows transaction count", () => {
    const { getByText } = render(<IncomeSummaryCard totalIncome={0} incomeCount={5} onAddIncome={jest.fn()} onExport={jest.fn()} />);
    expect(getByText(/5/)).toBeTruthy();
  });
});
