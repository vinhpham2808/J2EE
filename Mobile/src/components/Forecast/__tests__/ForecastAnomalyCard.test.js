import React from "react";
import { render } from "@testing-library/react-native";
import ForecastAnomalyCard from "../ForecastAnomalyCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "forecastComponents.unknown": "Không rõ",
        "forecastComponents.anomalyTitle": "Dị thường",
      };
      if (key === "forecastComponents.higherThan") {
        return `Cao hơn ${options?.percent}%`;
      }
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    WARNING: "#FFB84D",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    WARNING: "#FFB84D",
    WARNING_LIGHT: "rgba(255,184,77,0.1)",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    EXPENSE: "#FF0000",
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatMoney: (val) => `${val}đ`,
  formatDate: (val) => val,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("ForecastAnomalyCard", () => {
  const item = {
    transactionId: "t-1",
    categoryName: "Ăn uống",
    date: "2026-06-20",
    amount: 150000,
    meanAmount: 100000, // 50% deviation
  };

  test("calculates and displays positive deviation correctly", () => {
    const { getByText } = render(<ForecastAnomalyCard item={item} />);

    expect(getByText("Ăn uống")).toBeTruthy();
    expect(getByText("2026-06-20")).toBeTruthy();
    expect(getByText("150000đ")).toBeTruthy();
    expect(getByText("Cao hơn 50%")).toBeTruthy();
  });

  test("displays anomalyTitle when deviation is 0 or less", () => {
    const zeroDeviationItem = {
      ...item,
      amount: 100000,
      meanAmount: 100000,
    };
    const { getByText } = render(<ForecastAnomalyCard item={zeroDeviationItem} />);

    expect(getByText("Dị thường")).toBeTruthy();
  });
});
