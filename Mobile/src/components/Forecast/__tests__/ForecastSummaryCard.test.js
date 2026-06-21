import React from "react";
import { render } from "@testing-library/react-native";
import ForecastSummaryCard from "../ForecastSummaryCard";

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    PRIMARY: "#EF5E83",
  },
  useAppColors: () => ({
    PRIMARY: "#EF5E83",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    BG: "#FFFFFF",
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("ForecastSummaryCard", () => {
  test("renders label and value correctly", () => {
    const { getByText } = render(
      <ForecastSummaryCard
        icon="💰"
        label="Dự kiến chi"
        value="5.000.000đ"
      />
    );

    expect(getByText("Dự kiến chi")).toBeTruthy();
    expect(getByText("5.000.000đ")).toBeTruthy();
  });

  test("renders optional subtitle when provided", () => {
    const { getByText } = render(
      <ForecastSummaryCard
        icon="🔺"
        label="Dự kiến chi"
        value="5.000.000đ"
        sub="Tăng 15%"
      />
    );

    expect(getByText("Tăng 15%")).toBeTruthy();
  });

  test("renders custom border when accent is provided", () => {
    const { getByText } = render(
      <ForecastSummaryCard
        icon="🚨"
        label="Cảnh báo"
        value="Vượt hạn mức"
        accent="#FF0000"
      />
    );

    expect(getByText("Cảnh báo")).toBeTruthy();
  });
});
