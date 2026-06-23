jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", EXPENSE: "#EF4444", EXPENSE_LIGHT: "rgba(239,68,68,0.15)", ACTION_EXPENSE: "#EF4444" },
  useAppColors: () => ({ CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", EXPENSE: "#EF4444", EXPENSE_LIGHT: "rgba(239,68,68,0.15)", ACTION_EXPENSE: "#EF4444" }),
}));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ExpenseFilterTabs from "../ExpenseFilterTabs";

describe("ExpenseFilterTabs", () => {
  test("renders filter options", () => {
    const { getByText } = render(<ExpenseFilterTabs filterType="current" onChange={jest.fn()} />);
    expect(getByText("expenseFilterTabs.thisMonth")).toBeTruthy();
    expect(getByText("expenseFilterTabs.all")).toBeTruthy();
  });

  test("highlights active filter", () => {
    const { getByText } = render(<ExpenseFilterTabs filterType="all" onChange={jest.fn()} />);
  });

  test("calls onChange when filter pressed", () => {
    const onChange = jest.fn();
    const { getByText } = render(<ExpenseFilterTabs filterType="current" onChange={onChange} />);
    fireEvent.press(getByText("expenseFilterTabs.all"));
    expect(onChange).toHaveBeenCalledWith("all");
  });
});
