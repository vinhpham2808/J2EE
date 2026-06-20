jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({ useAppColors: () => ({ INCOME_LIGHT: "rgba(34,197,94,0.15)", ACTION_INCOME: "#22C55E", INCOME: "#22C55E", TEXT: "#333", TEXT_SECONDARY: "#999" }) }));
jest.mock("../../ui/AppIcon", () => ({ name, size, color }) => null);

import React from "react";
import { render } from "@testing-library/react-native";
import IncomeEmptyState from "../IncomeEmptyState";

describe("IncomeEmptyState", () => {
  test("renders title and description", () => {
    const { getByText } = render(<IncomeEmptyState />);
    expect(getByText("incomeEmptyState.title")).toBeTruthy();
    expect(getByText("incomeEmptyState.description")).toBeTruthy();
  });
});
