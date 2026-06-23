jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({ useAppColors: () => ({ EXPENSE_LIGHT: "rgba(239,68,68,0.15)", ACTION_EXPENSE: "#EF4444", EXPENSE: "#EF4444", TEXT: "#333", TEXT_SECONDARY: "#999" }) }));
jest.mock("../../ui/AppIcon", () => ({ name, size, color }) => null);

import React from "react";
import { render } from "@testing-library/react-native";
import ExpenseEmptyState from "../ExpenseEmptyState";

describe("ExpenseEmptyState", () => {
  test("renders title and description", () => {
    const { getByText } = render(<ExpenseEmptyState />);
    expect(getByText("expenseEmptyState.title")).toBeTruthy();
    expect(getByText("expenseEmptyState.description")).toBeTruthy();
  });
});
