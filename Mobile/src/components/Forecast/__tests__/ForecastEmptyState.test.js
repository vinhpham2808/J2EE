import React from "react";
import { render } from "@testing-library/react-native";
import ForecastEmptyState from "../ForecastEmptyState";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "forecastComponents.noForecastData": "Không có dữ liệu dự báo",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    TEXT_SECONDARY: "#8B7B80",
    INFO_LIGHT: "rgba(107,155,210,0.15)",
    INFO: "#6B9BD2",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

jest.mock("../../ui/AppIcon", () => "AppIcon");

describe("ForecastEmptyState", () => {
  test("renders message correctly when provided", () => {
    const { getByText } = render(
      <ForecastEmptyState message="Không có dữ liệu dị thường" />
    );
    expect(getByText("Không có dữ liệu dị thường")).toBeTruthy();
  });

  test("renders default translation message when no message provided", () => {
    const { getByText } = render(<ForecastEmptyState />);
    expect(getByText("Không có dữ liệu dự báo")).toBeTruthy();
  });
});
