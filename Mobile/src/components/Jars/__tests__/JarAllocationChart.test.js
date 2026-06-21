import React from "react";
import { render } from "@testing-library/react-native";
import JarAllocationChart from "../JarAllocationChart";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "jarAllocationChart.actualAllocation": "Tỷ lệ phân bổ thực tế",
        "jarAllocationChart.walletJars": "Số hũ trong ví",
        "jarAllocationChart.jarName": `${options?.name || 0} Hũ`,
        "jarAllocationChart.andOthers": `và ${options?.count || 0} hũ khác`,
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const Svg = ({ children }) => React.createElement("SvgMock", null, children);
  const G = ({ children }) => React.createElement("GMock", null, children);
  const Path = ({ fill, d }) => React.createElement("PathMock", { fill, d });
  const SvgText = ({ children, x, y }) => React.createElement(Text, { x, y }, children);
  return {
    __esModule: true,
    default: Svg,
    Svg,
    G,
    Path,
    Text: SvgText,
  };
});

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    PRIMARY: "#EF5E83",
  }),
}));

jest.mock("../../../utils/jar", () => ({
  describeDonutArc: (cx, cy, outerR, innerR, startAngle, endAngle) => 
    `M ${cx} ${cy} Arc from ${startAngle} to ${endAngle}`,
}));

describe("JarAllocationChart", () => {
  test("returns null when slices is empty", () => {
    const { toJSON } = render(<JarAllocationChart jarCount={0} slices={[]} />);
    expect(toJSON()).toBeNull();
  });

  test("renders chart title and center text when slices are provided", () => {
    const slices = [
      { key: "1", name: "Thiết yếu", percent: 55, color: "#8B5CF6", startAngle: 0, endAngle: 180 },
      { key: "2", name: "Tiết kiệm", percent: 45, color: "#10B981", startAngle: 180, endAngle: 360 },
    ];
    const { getByText } = render(<JarAllocationChart jarCount={2} slices={slices} />);

    expect(getByText("Tỷ lệ phân bổ thực tế")).toBeTruthy();
    expect(getByText("Số hũ trong ví")).toBeTruthy();
    expect(getByText("2 Hũ")).toBeTruthy();
  });

  test("renders slices and legends correctly", () => {
    const slices = [
      { key: "1", name: "Thiết yếu", percent: 50, color: "#8B5CF6", startAngle: 0, endAngle: 180 },
      { key: "2", name: "Tiết kiệm", percent: 30, color: "#10B981", startAngle: 180, endAngle: 288 },
      { key: "3", name: "Giáo dục", percent: 20, color: "#F59E0B", startAngle: 288, endAngle: 360 },
    ];
    const { getByText } = render(<JarAllocationChart jarCount={3} slices={slices} />);

    expect(getByText("Thiết yếu (50.0%)")).toBeTruthy();
    expect(getByText("Tiết kiệm (30.0%)")).toBeTruthy();
    expect(getByText("Giáo dục (20.0%)")).toBeTruthy();
  });

  test("renders 'and others' label when slices length is greater than 5", () => {
    const slices = [
      { key: "1", name: "Hũ 1", percent: 40, color: "#1", startAngle: 0, endAngle: 144 },
      { key: "2", name: "Hũ 2", percent: 20, color: "#2", startAngle: 144, endAngle: 216 },
      { key: "3", name: "Hũ 3", percent: 15, color: "#3", startAngle: 216, endAngle: 270 },
      { key: "4", name: "Hũ 4", percent: 10, color: "#4", startAngle: 270, endAngle: 306 },
      { key: "5", name: "Hũ 5", percent: 10, color: "#5", startAngle: 306, endAngle: 342 },
      { key: "6", name: "Hũ 6", percent: 5, color: "#6", startAngle: 342, endAngle: 360 },
    ];
    const { getByText, queryByText } = render(<JarAllocationChart jarCount={6} slices={slices} />);

    expect(getByText("Hũ 1 (40.0%)")).toBeTruthy();
    expect(getByText("Hũ 5 (10.0%)")).toBeTruthy();
    expect(queryByText("Hũ 6 (5.0%)")).toBeNull(); // Only displays first 5 slices
    expect(getByText("và 1 hũ khác")).toBeTruthy();
  });
});
