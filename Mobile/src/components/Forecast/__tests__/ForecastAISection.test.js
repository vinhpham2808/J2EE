import React from "react";
import { render } from "@testing-library/react-native";
import ForecastAISection from "../ForecastAISection";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "forecastComponents.aiAnalysis": "Phân tích AI",
        "forecastComponents.aiError": "Lỗi phân tích AI",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    CARD: "#FFFFFF",
    PRIMARY_LIGHT: "#FFE4EA",
    TEXT: "#1A0F14",
    TEXT_MUTED: "#B8A6AC",
    WARNING_LIGHT: "#FFF8E6",
    WARNING: "#FFB84D",
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatDate: (val) => val,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("../../ui/SectionHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ title }) => <Text>{title}</Text>;
});

describe("ForecastAISection", () => {
  test("renders narrative and generation date", () => {
    const { getByText } = render(
      <ForecastAISection
        narrative="AI phân tích: Chi tiêu của bạn tăng vọt"
        generatedAt="2026-06-20"
      />
    );

    expect(getByText("Phân tích AI")).toBeTruthy();
    expect(getByText("AI phân tích: Chi tiêu của bạn tăng vọt")).toBeTruthy();
    expect(getByText("2026-06-20")).toBeTruthy();
  });

  test("renders fallback warning when hasError is true", () => {
    const { getByText } = render(
      <ForecastAISection
        narrative={null}
        hasError={true}
      />
    );

    expect(getByText("Lỗi phân tích AI")).toBeTruthy();
  });

  test("renders null when neither narrative nor hasError is provided", () => {
    const { toJSON } = render(<ForecastAISection />);
    expect(toJSON()).toBeNull();
  });
});
