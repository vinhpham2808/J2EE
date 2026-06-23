jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    TEXT: "#111",
    INCOME_COLOR: "#22C55E",
    EXPENSE_COLOR: "#EF4444",
  }),
}));
jest.mock("../../../utils/format", () => ({
  formatMoney: (n) => `${n}đ`,
}));

import React from "react";
import { render } from "@testing-library/react-native";
import AmountText from "../AmountText";

describe("AmountText", () => {
  it("renders formatted value for type='none'", () => {
    const { getByText } = render(<AmountText value={50000} />);
    expect(getByText("50000đ")).toBeTruthy();
  });

  it("renders '+value' for type='income' with showSign=true", () => {
    const { getByText } = render(
      <AmountText value={50000} type="income" showSign={true} />
    );
    expect(getByText("+50000đ")).toBeTruthy();
  });

  it("renders '-value' for type='expense' with showSign=true", () => {
    const { getByText } = render(
      <AmountText value={30000} type="expense" showSign={true} />
    );
    expect(getByText("-30000đ")).toBeTruthy();
  });

  it("renders no prefix when showSign=false even for income", () => {
    const { getByText } = render(
      <AmountText value={100} type="income" showSign={false} />
    );
    expect(getByText("100đ")).toBeTruthy();
  });

  it("renders no prefix when value=0 with showSign=true (not > 0)", () => {
    const { getByText } = render(
      <AmountText value={0} type="income" showSign={true} />
    );
    expect(getByText("0đ")).toBeTruthy();
  });

  it("renders '0đ' when value is null", () => {
    const { getByText } = render(<AmountText value={null} />);
    expect(getByText("0đ")).toBeTruthy();
  });

  it("renders '0đ' when value is undefined", () => {
    const { getByText } = render(<AmountText value={undefined} />);
    expect(getByText("0đ")).toBeTruthy();
  });
});
