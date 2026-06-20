jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { INCOME: "#22C55E", CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#999", BG: "#F5F5F5", SHADOW_COLOR: "#000" },
  useAppColors: () => ({ INCOME: "#22C55E", INCOME_LIGHT: "rgba(34,197,94,0.15)", TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#999", BG: "#F5F5F5", CARD: "#FFF", CARD_BORDER: "#EEE", SHADOW_COLOR: "#000" }),
}));
jest.mock("../../common/CategoryGridSelector", () => ({ categories, selectedId, onSelect, loading, highlighted, hintText }) => null);
jest.mock("../../common/ScreenBackHeader", () => ({ title }) => null);
jest.mock("../../../utils/datePicker", () => ({ PickDateField: ({ label, value, onChange }) => null }));
jest.mock("../../../utils/format", () => ({ formatCurrencyInput: (v) => v, formatMoney: (v) => String(v) }));
jest.mock("../../../utils/layoutScale", () => ({ scale: (v) => v }));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import IncomeForm from "../IncomeForm";

describe("IncomeForm", () => {
  const form = {
    amount: "5000000", setAmount: jest.fn(),
    name: "Salary", setName: jest.fn(),
    date: "2026-06-01", setDate: jest.fn(),
    categories: [{ id: 1, name: "Work" }],
    categoryId: "1", setCategoryId: jest.fn(),
    categoryLoading: false,
    jars: [{ id: 1, name: "Main", icon: "🏦" }],
    jarId: "", setJarId: jest.fn(),
    allocations: [{ jarId: 1, jarName: "Main", jarIcon: "🏦", jarColor: "#22C55E", amount: 3000000, percentage: 60 }],
    totalAllocated: 3000000,
    incomeAmount: 5000000,
    allocationDiff: 0,
    showAllocations: false, setShowAllocations: jest.fn(),
    handleAllocationAmountChange: jest.fn(),
    submitting: false, onSave: jest.fn(),
  };

  test("renders form sections", () => {
    const { getByText } = render(<IncomeForm form={form} />);
    expect(getByText("incomeForm.transactionInfo")).toBeTruthy();
    expect(getByText("incomeForm.transactionClass")).toBeTruthy();
  });

  test("renders save button", () => {
    const { getByText } = render(<IncomeForm form={form} />);
    expect(getByText("incomeForm.save")).toBeTruthy();
  });

  test("shows saving text when submitting", () => {
    const { getByText } = render(<IncomeForm form={{ ...form, submitting: true }} />);
    expect(getByText("incomeForm.saving")).toBeTruthy();
  });

  test("shows jar allocation section when jars exist and income > 0", () => {
    const { getByText } = render(<IncomeForm form={form} />);
    expect(getByText("incomeForm.jarSection")).toBeTruthy();
  });

  test("hides jar section when no jars", () => {
    const { queryByText } = render(<IncomeForm form={{ ...form, jars: [] }} />);
    expect(queryByText("incomeForm.jarSection")).toBeNull();
  });

  test("shows allocation details when expanded", () => {
    const { getByText } = render(<IncomeForm form={{ ...form, showAllocations: true }} />);
    expect(getByText("Main")).toBeTruthy();
  });

  test("shows allocation warning when diff exists", () => {
    const { getByText } = render(<IncomeForm form={{ ...form, showAllocations: true, allocationDiff: 500000 }} />);
    expect(getByText("incomeForm.allocUnder")).toBeTruthy();
  });

  test("shows allocation over warning", () => {
    const { getByText } = render(<IncomeForm form={{ ...form, showAllocations: true, allocationDiff: -200000 }} />);
    expect(getByText("incomeForm.allocOver")).toBeTruthy();
  });

  test("passes title to ScreenBackHeader", () => {
    const { getByText } = render(<IncomeForm form={form} title="Custom Income" />);
  });
});
