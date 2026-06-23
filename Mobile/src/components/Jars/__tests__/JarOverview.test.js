import React from "react";
import { render } from "@testing-library/react-native";
import JarOverview from "../JarOverview";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "jarOverview.totalBalance": "Tổng số dư hũ",
        "jarOverview.jarsInUse": "Số hũ đang dùng",
        "jarOverview.totalAllocation": "Tổng tỷ lệ phân bổ",
        "jarOverview.allocationOver100": "Cảnh báo: Tổng phân bổ vượt quá 100%!",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, ...props }) => <View {...props}>{children}</View>,
  };
});

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    PRIMARY: "#EF5E83",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    PRIMARY: "#EF5E83",
    WALLET_GRADIENT_START: "#7C4DFF",
    WALLET_GRADIENT_END: "#4FACFE",
  }),
}));

jest.mock("../../../utils/jar", () => ({
  formatJarMoney: (val) => `${val} VND`,
}));

describe("JarOverview", () => {
  test("renders balance, jar count, and allocation details correctly", () => {
    const { getByText, queryByText } = render(
      <JarOverview jarCount={3} maxJars={6} totalBalance={15000000} totalPercentage={90.0} />
    );

    expect(getByText("Tổng số dư hũ")).toBeTruthy();
    expect(getByText("15000000 VND")).toBeTruthy();
    expect(getByText("Số hũ đang dùng")).toBeTruthy();
    expect(getByText("3 / 6")).toBeTruthy();
    expect(getByText("Tổng tỷ lệ phân bổ")).toBeTruthy();
    expect(getByText("90.0%")).toBeTruthy();
    expect(queryByText("Cảnh báo: Tổng phân bổ vượt quá 100%!")).toBeNull();
  });

  test("renders infinity sign when maxJars is Infinity", () => {
    const { getByText } = render(
      <JarOverview jarCount={4} maxJars={Infinity} totalBalance={20000000} totalPercentage={100.0} />
    );

    expect(getByText("4 / ∞")).toBeTruthy();
  });

  test("renders warning banner when total allocation is over 100%", () => {
    const { getByText } = render(
      <JarOverview jarCount={5} maxJars={6} totalBalance={5000000} totalPercentage={110.5} />
    );

    expect(getByText("110.5%")).toBeTruthy();
    expect(getByText("Cảnh báo: Tổng phân bổ vượt quá 100%!")).toBeTruthy();
  });
});
