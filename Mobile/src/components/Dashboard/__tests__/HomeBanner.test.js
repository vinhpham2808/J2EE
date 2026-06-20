jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({ useAppColors: () => ({}) }));
jest.mock("../../ui/AppIcon", () => ({ name, size, color, style }) => null);
jest.mock("../../ui/WalletGradientCard", () => ({ children, style }) => children);
jest.mock("../../ui/ChangeRateBadge", () => ({ value, label, labelColor, style }) => {
  const { Text } = require("react-native");
  return <Text>{label}</Text>;
});
jest.mock("../../ui/AmountText", () => ({ value, style }) => null);

import React from "react";
import { render } from "@testing-library/react-native";
import HomeBanner from "../HomeBanner";

describe("HomeBanner", () => {
  test("renders wallet title", () => {
    const { getByText } = render(<HomeBanner />);
    expect(getByText("dashboardComponents.wallet")).toBeTruthy();
  });

  test("renders hidden balance", () => {
    const { getByText } = render(<HomeBanner isBalanceVisible={false} />);
    expect(getByText("\u2022\u2022\u2022\u2022\u2022\u2022")).toBeTruthy();
  });

  test("renders vsLastMonth label", () => {
    const { getByText } = render(<HomeBanner />);
    expect(getByText("dashboardComponents.vsLastMonth")).toBeTruthy();
  });

  test("renders with balance data", () => {
    const { getByText } = render(<HomeBanner balanceData={{ totalBalance: 5000000 }} />);
    expect(getByText("dashboardComponents.wallet")).toBeTruthy();
  });
});
