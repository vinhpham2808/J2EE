jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({ useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999", CARD: "#FFF", CARD_BORDER: "#EEE", SHADOW_COLOR: "#000", PRIMARY: "#E8597A", EXPENSE_COLOR: "#EF4444" }) }));
jest.mock("../../ui/AppIcon", () => ({ name, size, color }) => null);
jest.mock("../../ui/TransactionIcon", () => ({ iconValue, containerSize, size }) => null);
jest.mock("../../ui/AmountText", () => ({ value, type }) => null);
jest.mock("../../../utils/format", () => ({ formatDate: () => "Jun 19" }));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ExpenseItem from "../ExpenseItem";

describe("ExpenseItem", () => {
  const item = { id: 1, name: "Lunch", amount: 50000, date: "2026-06-19", categoryName: "Food", note: "At cafe", icon: "fast-food" };

  test("renders item name and meta", () => {
    const { getByText } = render(<ExpenseItem item={item} />);
    expect(getByText("Lunch")).toBeTruthy();
    expect(getByText(/Jun 19/)).toBeTruthy();
  });

  test("renders note when provided", () => {
    const { getByText } = render(<ExpenseItem item={item} />);
    expect(getByText("At cafe")).toBeTruthy();
  });

  test("calls onEdit when edit pressed", () => {
    const onEdit = jest.fn();
    const { getAllByRole } = render(<ExpenseItem item={item} onEdit={onEdit} />);
    const buttons = getAllByRole("button");
    fireEvent.press(buttons[0]);
    expect(onEdit).toHaveBeenCalledWith(item);
  });

  test("calls onDelete when delete pressed", () => {
    const onDelete = jest.fn();
    const { getAllByRole } = render(<ExpenseItem item={item} onDelete={onDelete} />);
    const buttons = getAllByRole("button");
    fireEvent.press(buttons[1]);
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  test("handles missing name", () => {
    const { getByText } = render(<ExpenseItem item={{ amount: 0 }} />);
    expect(getByText("expenseItem.type")).toBeTruthy();
  });

  test("handles search keyword highlighting", () => {
    const { getByText } = render(<ExpenseItem item={item} searchKeyword="Lun" />);
    expect(getByText(/Lunch/)).toBeTruthy();
  });
});
