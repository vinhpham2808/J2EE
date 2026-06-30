jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { INCOME: "#22C55E", TEXT: "#333", TEXT_SECONDARY: "#999" },
  useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999" }),
}));
jest.mock("../../common/IncomeExpenseChart", () => ({ data, title }) => null);
jest.mock("../IncomeFilterTabs", () => ({ filterType, onChange }) => null);
jest.mock("../IncomeSummaryCard", () => ({ filterType, incomeCount, isExporting, onAddIncome, onExport, onVoiceResult, totalIncome }) => null);

import React from "react";
import { render } from "@testing-library/react-native";
import IncomeListHeader from "../IncomeListHeader";

describe("IncomeListHeader", () => {
  test("renders without crash with incomes", () => {
    const { toJSON } = render(<IncomeListHeader incomes={[{ id: 1 }]} filterType="current" onFilterChange={jest.fn()} />);
    expect(toJSON()).not.toBeNull();
  });
});
