jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#999", BG: "#F5F5F5", PRIMARY: "#E8597A", ROSE_MIST: "#FFE4E9", WHITE: "#FFF", EXPENSE: "#EF4444", ACTION_EXPENSE: "#EF4444", SHADOW_COLOR: "#000", BADGE_NEGATIVE_BG: "rgba(239,94,131,0.1)", INFO_LIGHT: "#E0F2FE", INFO: "#0284C7" },
  useAppColors: () => ({ CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#999", BG: "#F5F5F5", PRIMARY: "#E8597A", ROSE_MIST: "#FFE4E9", WHITE: "#FFF", EXPENSE: "#EF4444", ACTION_EXPENSE: "#EF4444", SHADOW_COLOR: "#000", BADGE_NEGATIVE_BG: "rgba(239,94,131,0.1)", INFO_LIGHT: "#E0F2FE", INFO: "#0284C7" }),
}));
jest.mock("../../common/CategoryGridSelector", () => ({ categories, selectedId, onSelect, loading, highlighted, hintText }) => null);
jest.mock("../../common/ScreenBackHeader", () => ({ title }) => null);
jest.mock("../ExpenseNoteField", () => ({ value, onChange, onVoiceResult }) => null);
jest.mock("../../ui/AppIcon", () => ({ name, size, color }) => null);
jest.mock("../../../utils/datePicker", () => ({ PickDateField: ({ label, value, onChange }) => null }));
jest.mock("../../../utils/format", () => ({ formatMoney: (v) => String(v) }));
jest.mock("../../../utils/jar", () => ({ getJarBalanceAmount: (j) => j?.balance || 0 }));
jest.mock("../../../utils/layoutScale", () => ({ scale: (v) => v }));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ExpenseForm from "../ExpenseForm";

describe("ExpenseForm", () => {
  const form = {
    amount: "50000", setAmount: jest.fn(),
    name: "Lunch", setName: jest.fn(),
    date: "2026-06-19", setDate: jest.fn(),
    note: "", setNote: jest.fn(),
    categories: [{ id: 1, name: "Food" }],
    categoryId: "1", setCategoryId: jest.fn(),
    categoryLoading: false,
    jars: [{ id: 1, name: "Daily", icon: "🍱", balance: 200000 }],
    jarId: "", setJarId: jest.fn(),
    jarsLoading: false,
    submitting: false, onSave: jest.fn(),
    handleVoiceResult: jest.fn(),
    splitInfo: null,
  };

  test("renders form sections", () => {
    const { getByText } = render(<ExpenseForm form={form} />);
    expect(getByText("expenseForm.transactionInfo")).toBeTruthy();
    expect(getByText("expenseForm.categorySection")).toBeTruthy();
    expect(getByText("expenseForm.noteSection")).toBeTruthy();
  });

  test("renders save button", () => {
    const { getByText } = render(<ExpenseForm form={form} />);
    expect(getByText("expenseForm.save")).toBeTruthy();
  });

  test("shows saving text when submitting", () => {
    const { getByText } = render(<ExpenseForm form={{ ...form, submitting: true }} />);
    expect(getByText("expenseForm.saving")).toBeTruthy();
  });

  test("renders jars list", () => {
    const { getByText } = render(<ExpenseForm form={form} />);
    expect(getByText("Daily")).toBeTruthy();
    expect(getByText(/expenseForm.jarRemaining/)).toBeTruthy();
  });

  test("shows jar loading text", () => {
    const { getByText } = render(<ExpenseForm form={{ ...form, jarsLoading: true }} />);
    expect(getByText("expenseForm.jarLoading")).toBeTruthy();
  });

  test("shows jar empty text", () => {
    const { getByText } = render(<ExpenseForm form={{ ...form, jars: [] }} />);
    expect(getByText("expenseForm.jarEmpty")).toBeTruthy();
  });

  test("shows import receipt banner", () => {
    const { getByText } = render(<ExpenseForm form={form} onImportReceipt={jest.fn()} />);
    expect(getByText("expenseForm.importFromAI")).toBeTruthy();
  });

  test("shows scanning state", () => {
    const { getByText } = render(<ExpenseForm form={form} isScanning />);
    expect(getByText("expenseForm.scanning")).toBeTruthy();
  });

  test("passes title to ScreenBackHeader", () => {
    const { getByText } = render(<ExpenseForm form={form} title="Custom Title" />);
  });

  test("shows split banner when splitInfo present", () => {
    const formWithSplit = { ...form, splitInfo: { splits: [{ label: "Friend 1: 25k" }], myShareLabel: "My share: 25k" } };
    const { getByText } = render(<ExpenseForm form={formWithSplit} />);
    expect(getByText("expenseForm.splitDetected")).toBeTruthy();
  });

  test("renders with custom title fallback", () => {
    const { getByText } = render(<ExpenseForm form={form} />);
  });
});
