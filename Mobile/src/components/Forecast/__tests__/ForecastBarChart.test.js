import React from "react";
import { render } from "@testing-library/react-native";
import ForecastBarChart from "../ForecastBarChart";

jest.mock("react-native-chart-kit", () => ({
  BarChart: "BarChart",
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "forecastComponents.barChartTitle": "Dự kiến chi so với Trung bình",
        "forecastComponents.barLegendForecast": "Dự báo",
        "forecastComponents.barLegendAvg": "Trung bình",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    CARD: "#FFFFFF",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    CARD_BORDER: "#E5E7EB",
    PRIMARY: "#EF5E83",
    INFO: "#6B9BD2",
  }),
}));

describe("ForecastBarChart", () => {
  const categories = [{ categoryId: 1, categoryName: "Ăn uống" }];
  const barChartData = {
    labels: ["Ăn uống"],
    datasets: [{ data: [100000] }],
  };

  test("returns null when barChartData is empty or no categories", () => {
    const { toJSON } = render(
      <ForecastBarChart barChartData={null} categories={categories} />
    );
    expect(toJSON()).toBeNull();
  });

  test("renders bar chart title and legends", () => {
    const { getByText } = render(
      <ForecastBarChart barChartData={barChartData} categories={categories} />
    );

    expect(getByText("Dự kiến chi so với Trung bình")).toBeTruthy();
    expect(getByText("Dự báo")).toBeTruthy();
    expect(getByText("Trung bình")).toBeTruthy();
  });
});
