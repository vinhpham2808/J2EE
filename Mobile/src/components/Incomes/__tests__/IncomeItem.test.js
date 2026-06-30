jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({ useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999", CARD: "#FFF", CARD_BORDER: "#EEE", SHADOW_COLOR: "#000", PRIMARY: "#E8597A", EXPENSE_COLOR: "#EF4444" }) }));
jest.mock("../../ui/AppIcon", () => ({ name, size, color }) => null);
jest.mock("../../ui/TransactionIcon", () => ({ iconValue, containerSize, size }) => null);
jest.mock("../../ui/AmountText", () => ({ value, type }) => null);
jest.mock("../../../utils/format", () => ({ formatDate: () => "Jun 19" }));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import IncomeItem from "../IncomeItem";

describe("IncomeItem", () => {
  const item = { id: 1, name: "Salary", amount: 5000000, date: "2026-06-01", categoryName: "Work", icon: "cash" };

  test("renders item name and meta", () => {
    const { getByText } = render(<IncomeItem item={item} />);
    expect(getByText("Salary")).toBeTruthy();
    expect(getByText(/Jun 19/)).toBeTruthy();
  });

  test("calls onEdit when edit pressed", () => {
    const onEdit = jest.fn();
    const { getAllByRole } = render(<IncomeItem item={item} onEdit={onEdit} />);
    fireEvent.press(getAllByRole("button")[0]);
    expect(onEdit).toHaveBeenCalledWith(item);
  });

  test("calls onDelete when delete pressed", () => {
    const onDelete = jest.fn();
    const { getAllByRole } = render(<IncomeItem item={item} onDelete={onDelete} />);
    fireEvent.press(getAllByRole("button")[1]);
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  test("handles missing name", () => {
    const { getByText } = render(<IncomeItem item={{ amount: 0 }} />);
    expect(getByText("incomeItem.type")).toBeTruthy();
  });
});
