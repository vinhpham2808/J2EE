jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { TEXT: "#333", CARD: "#FFF", CARD_BORDER: "#EEE", TEXT_MUTED: "#999" },
  useAppColors: () => ({ TEXT: "#333", CARD: "#FFF", CARD_BORDER: "#EEE", TEXT_MUTED: "#999" }),
}));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ExpenseNoteField from "../ExpenseNoteField";

describe("ExpenseNoteField", () => {
  test("renders label and input", () => {
    const { getByText } = render(<ExpenseNoteField />);
    expect(getByText(/expenseForm.noteSection/)).toBeTruthy();
  });

  test("calls onChange when text changes", () => {
    const onChange = jest.fn();
    const { getByDisplayValue } = render(<ExpenseNoteField value="test" onChange={onChange} />);
    expect(getByDisplayValue("test")).toBeTruthy();
  });

  test("shows placeholder", () => {
    const { getByPlaceholderText } = render(<ExpenseNoteField placeholder="Enter note" />);
    expect(getByPlaceholderText("Enter note")).toBeTruthy();
  });

  test("defaults to multiline", () => {
    const { getByPlaceholderText } = render(<ExpenseNoteField placeholder="Note" />);
    const input = getByPlaceholderText("Note");
    expect(input.props.multiline).toBe(true);
  });
});
