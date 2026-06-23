jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", INCOME: "#22C55E", INCOME_LIGHT: "rgba(34,197,94,0.15)", ACTION_INCOME: "#22C55E" },
  useAppColors: () => ({ CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", INCOME: "#22C55E", INCOME_LIGHT: "rgba(34,197,94,0.15)", ACTION_INCOME: "#22C55E" }),
}));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import IncomeFilterTabs from "../IncomeFilterTabs";

describe("IncomeFilterTabs", () => {
  test("renders filter options", () => {
    const { getByText } = render(<IncomeFilterTabs filterType="current" onChange={jest.fn()} />);
    expect(getByText("incomeFilterTabs.thisMonth")).toBeTruthy();
    expect(getByText("incomeFilterTabs.all")).toBeTruthy();
  });

  test("calls onChange when filter pressed", () => {
    const onChange = jest.fn();
    const { getByText } = render(<IncomeFilterTabs filterType="current" onChange={onChange} />);
    fireEvent.press(getByText("incomeFilterTabs.all"));
    expect(onChange).toHaveBeenCalledWith("all");
  });
});
