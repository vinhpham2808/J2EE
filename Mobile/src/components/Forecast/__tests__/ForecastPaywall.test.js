import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { useNavigation } from "@react-navigation/native";
import ForecastPaywall from "../ForecastPaywall";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "forecastPaywall.title": "Tính năng Premium",
        "forecastPaywall.description": "Nâng cấp để mở khóa dự báo tài chính",
        "forecastPaywall.featureForecast": "Dự báo chi tiêu",
        "forecastPaywall.featureTrend": "Xu hướng chi tiêu",
        "forecastPaywall.featureAnomaly": "Phát hiện dị thường",
        "forecastPaywall.featureAI": "Phân tích AI nâng cao",
        "forecastPaywall.upgrade": "Nâng cấp gói Premium",
      };
      return dict[key] || key;
    },
  }),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFFFFF",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    PRIMARY: "#EF5E83",
    WHITE: "#FFFFFF",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

describe("ForecastPaywall", () => {
  test("renders paywall copy and features correctly", () => {
    const { getByText } = render(<ForecastPaywall />);

    expect(getByText("🔮")).toBeTruthy();
    expect(getByText("Tính năng Premium")).toBeTruthy();
    expect(getByText("Nâng cấp để mở khóa dự báo tài chính")).toBeTruthy();
    expect(getByText("Dự báo chi tiêu")).toBeTruthy();
    expect(getByText("Xu hướng chi tiêu")).toBeTruthy();
    expect(getByText("Phát hiện dị thường")).toBeTruthy();
    expect(getByText("Phân tích AI nâng cao")).toBeTruthy();
    expect(getByText("Nâng cấp gói Premium")).toBeTruthy();
  });

  test("navigates to settings tab payment screen when upgrade is clicked", () => {
    const { getByText } = render(<ForecastPaywall />);

    const upgradeBtn = getByText("Nâng cấp gói Premium");
    fireEvent.press(upgradeBtn);

    expect(mockNavigate).toHaveBeenCalledWith("SettingTab", {
      screen: "Payment",
    });
  });
});
