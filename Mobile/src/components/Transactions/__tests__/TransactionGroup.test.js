jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));
jest.mock("../../ui/AppIcon", () => () => null);
jest.mock("../../ui/TransactionIcon", () => () => null);
// AmountText: render a Text with testID that includes the value so we can distinguish
jest.mock("../../ui/AmountText", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ value, type, showSign, style }) =>
    React.createElement(
      Text,
      { testID: `amount-${type}-${value}`, style },
      `${showSign ? (type === "income" ? "+" : "-") : ""}${value}`
    );
});
jest.mock("../../../utils/format", () => ({
  formatDate: (date) => `formatted:${date}`,
}));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Pressable } from "react-native";
import { create, act } from "react-test-renderer";
import TransactionGroup from "../TransactionGroup";

const colors = {
  CARD: "#FFF",
  BORDER: "#EEE",
  SEPARATOR: "#DDD",
  TEXT: "#111",
  TEXT_MUTED: "#999",
  PRIMARY: "#7C4DFF",
  EXPENSE_COLOR: "#EF4444",
};

const makeGroup = (overrides = {}) => ({
  date: "2026-06-19",
  totalIncome: 100000,
  totalExpense: 50000,
  items: [
    {
      id: 1,
      type: "expense",
      name: "Lunch",
      amount: 50000,
      note: "At cafe",
      icon: "fast-food",
    },
    {
      id: 2,
      type: "income",
      name: "Salary",
      amount: 100000,
      note: null,
      icon: "cash",
    },
  ],
  ...overrides,
});

describe("TransactionGroup", () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  // ─── Rendering ──────────────────────────────────────────────────────────────

  it("renders formatted date in header", () => {
    const { getByText } = render(
      <TransactionGroup colors={colors} group={makeGroup()} onEdit={onEdit} onDelete={onDelete} />
    );
    expect(getByText("formatted:2026-06-19")).toBeTruthy();
  });

  it("renders all transaction names", () => {
    const { getByText } = render(
      <TransactionGroup colors={colors} group={makeGroup()} onEdit={onEdit} onDelete={onDelete} />
    );
    expect(getByText("Lunch")).toBeTruthy();
    expect(getByText("Salary")).toBeTruthy();
  });

  it("renders note when provided", () => {
    const { getByText } = render(
      <TransactionGroup colors={colors} group={makeGroup()} onEdit={onEdit} onDelete={onDelete} />
    );
    expect(getByText("At cafe")).toBeTruthy();
  });

  it("does not render note row for transaction with null note", () => {
    // Make a group where only 1 item has a note so we can count Text elements
    const group = makeGroup({
      items: [{ id: 3, type: "expense", name: "Coffee", amount: 20000, note: null, icon: "cafe" }],
    });
    const { queryByText } = render(
      <TransactionGroup colors={colors} group={group} onEdit={onEdit} onDelete={onDelete} />
    );
    // There is no note text at all when note is null
    expect(queryByText("Coffee")).toBeTruthy(); // item renders
    expect(queryByText(/note/i)).toBeNull();    // no note text
  });

  it("renders income AmountText (header total) when totalIncome > 0", () => {
    const { getAllByTestId } = render(
      <TransactionGroup colors={colors} group={makeGroup()} onEdit={onEdit} onDelete={onDelete} />
    );
    // Header shows totalIncome = 100000
    expect(getAllByTestId("amount-income-100000").length).toBeGreaterThanOrEqual(1);
  });

  it("renders expense AmountText (header total) when totalExpense > 0", () => {
    const { getAllByTestId } = render(
      <TransactionGroup colors={colors} group={makeGroup()} onEdit={onEdit} onDelete={onDelete} />
    );
    // Header shows totalExpense = 50000
    expect(getAllByTestId("amount-expense-50000").length).toBeGreaterThanOrEqual(1);
  });

  it("does not render income total when totalIncome is 0", () => {
    const group = makeGroup({ totalIncome: 0 });
    const { queryByTestId } = render(
      <TransactionGroup colors={colors} group={group} onEdit={onEdit} onDelete={onDelete} />
    );
    // No header income amount with value 0 (conditional renders null)
    expect(queryByTestId("amount-income-0")).toBeNull();
  });

  it("does not render expense total when totalExpense is 0", () => {
    const group = makeGroup({ totalExpense: 0 });
    const { queryByTestId } = render(
      <TransactionGroup colors={colors} group={group} onEdit={onEdit} onDelete={onDelete} />
    );
    // No header expense amount with value 0 (conditional renders null)
    expect(queryByTestId("amount-expense-0")).toBeNull();
  });

  // ─── Edit interactions ───────────────────────────────────────────────────────

  it("calls onEdit when a transaction row is pressed", () => {
    let root;
    act(() => {
      root = create(
        <TransactionGroup colors={colors} group={makeGroup()} onEdit={onEdit} onDelete={onDelete} />
      );
    });
    const pressables = root.root.findAllByType(Pressable);
    // First Pressable is the row wrapper for the first transaction
    act(() => pressables[0].props.onPress());
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: "Lunch" }));
  });

  it("calls onEdit when edit button is pressed (by label)", () => {
    const { getAllByLabelText } = render(
      <TransactionGroup colors={colors} group={makeGroup()} onEdit={onEdit} onDelete={onDelete} />
    );
    const editButtons = getAllByLabelText("transactionGroup.editAccessibility");
    fireEvent.press(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  // ─── Delete interactions ─────────────────────────────────────────────────────

  it("calls onDelete when a transaction row is long-pressed", () => {
    let root;
    act(() => {
      root = create(
        <TransactionGroup colors={colors} group={makeGroup()} onEdit={onEdit} onDelete={onDelete} />
      );
    });
    const pressables = root.root.findAllByType(Pressable);
    act(() => pressables[0].props.onLongPress());
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: "Lunch" }));
  });

  it("calls onDelete when delete button is pressed (by label)", () => {
    const { getAllByLabelText } = render(
      <TransactionGroup colors={colors} group={makeGroup()} onEdit={onEdit} onDelete={onDelete} />
    );
    const deleteButtons = getAllByLabelText("transactionGroup.deleteAccessibility");
    fireEvent.press(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────────

  it("renders correctly with empty items list", () => {
    const group = makeGroup({ items: [], totalIncome: 0, totalExpense: 0 });
    const { queryByText } = render(
      <TransactionGroup colors={colors} group={group} onEdit={onEdit} onDelete={onDelete} />
    );
    expect(queryByText("Lunch")).toBeNull();
  });

  it("renders multiple transactions in order", () => {
    const { getAllByRole } = render(
      <TransactionGroup colors={colors} group={makeGroup()} onEdit={onEdit} onDelete={onDelete} />
    );
    // 2 transactions × 2 action buttons each = 4 buttons
    expect(getAllByRole("button").length).toBe(4);
  });
});
