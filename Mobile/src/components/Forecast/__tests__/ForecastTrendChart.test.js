import React from "react";
import { render } from "@testing-library/react-native";
import ForecastTrendChart from "../ForecastTrendChart";

jest.mock("react-native-chart-kit", () => ({
  LineChart: "LineChart",
}));

jest.mock("../ForecastEmptyState", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ message }) => <Text>{message}</Text>;
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "forecastComponents.trendChartTitle": "Xu hướng chi tiêu: ",
        "forecastComponents.trendNote": "Chú thích biểu đồ xu hướng",
        "forecastComponents.noTrendData": "Không có dữ liệu xu hướng",
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
    TEXT_MUTED: "#B8A6AC",
  }),
}));

describe("ForecastTrendChart", () => {
  const lineChartData = {
    labels: ["T4", "T5", "T6"],
    datasets: [{ data: [100, 200, 150] }],
  };

  test("returns null if categoryName is missing", () => {
    const { toJSON } = render(
      <ForecastTrendChart categoryName={null} lineChartData={lineChartData} isTrendLoading={false} />
    );
    expect(toJSON()).toBeNull();
  });

  test("renders activity indicator when loading", () => {
    // ActivityIndicator is standard React Native component, RNTL renders it
    const { getByText, queryByText } = render(
      <ForecastTrendChart categoryName="Ăn uống" lineChartData={null} isTrendLoading={true} />
    );

    expect(getByText("Xu hướng chi tiêu: Ăn uống")).toBeTruthy();
    // Line chart should not be rendered
    expect(queryByText("Chú thích biểu đồ xu hướng")).toBeNull();
  });

  test("renders LineChart and note when lineChartData is provided", () => {
    const { getByText } = render(
      <ForecastTrendChart categoryName="Ăn uống" lineChartData={lineChartData} isTrendLoading={false} />
    );

    expect(getByText("Xu hướng chi tiêu: Ăn uống")).toBeTruthy();
    expect(getByText("Chú thích biểu đồ xu hướng")).toBeTruthy();
  });

  test("renders empty state when no lineChartData is provided", () => {
    const { getByText } = render(
      <ForecastTrendChart categoryName="Ăn uống" lineChartData={null} isTrendLoading={false} />
    );

    expect(getByText("Không có dữ liệu xu hướng")).toBeTruthy();
  });
});
