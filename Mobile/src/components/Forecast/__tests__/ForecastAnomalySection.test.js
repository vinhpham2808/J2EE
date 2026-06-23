import React from "react";
import { render } from "@testing-library/react-native";
import ForecastAnomalySection from "../ForecastAnomalySection";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "forecastComponents.noAnomalies": "Không có giao dịch dị thường",
      };
      if (key === "forecastComponents.anomalySectionTitle") {
        return `Giao dịch dị thường tháng ${options?.month}/${options?.year}`;
      }
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({}),
}));

jest.mock("../ForecastAnomalyCard", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ item }) => <Text>{item.categoryName}</Text>;
});

jest.mock("../ForecastEmptyState", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ message }) => <Text>{message}</Text>;
});

jest.mock("../../ui/SectionHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ title }) => <Text>{title}</Text>;
});

describe("ForecastAnomalySection", () => {
  const anomalies = [
    { transactionId: "t-1", categoryName: "Ăn uống", date: "2026-06-20", amount: 150000, meanAmount: 100000 },
  ];

  const defaultProps = {
    anomalies,
    selectedMonth: "6",
    selectedYear: "2026",
  };

  test("renders section header and anomaly cards", () => {
    const { getByText } = render(<ForecastAnomalySection {...defaultProps} />);

    expect(getByText("Giao dịch dị thường tháng 6/2026")).toBeTruthy();
    expect(getByText("Ăn uống")).toBeTruthy();
  });

  test("renders empty state when no anomalies exist", () => {
    const { getByText } = render(
      <ForecastAnomalySection {...defaultProps} anomalies={[]} />
    );

    expect(getByText("Không có giao dịch dị thường")).toBeTruthy();
  });
});
