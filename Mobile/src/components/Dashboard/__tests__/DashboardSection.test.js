jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { TEXT: "#333", CARD: "#FFF", CARD_BORDER: "#EEE", SHADOW_COLOR: "#000" },
  useAppColors: () => ({ TEXT: "#333", CARD: "#FFF", CARD_BORDER: "#EEE", SHADOW_COLOR: "#000", SURFACE_ELEVATED: "#FFF", PRIMARY: "#E8597A" }),
}));
jest.mock("../../../utils/layoutScale", () => ({ clampScale: (v) => v, scale: (v) => v }));
jest.mock("../../common/ShowMoreButton", () => ({ visible, expanded, onPress }) => null);

import React from "react";
import { Text, View } from "react-native";
import { render } from "@testing-library/react-native";
import { DashboardSectionHeader, DashboardSectionCard, ToggleSectionHeader } from "../DashboardSection";

describe("DashboardSectionHeader", () => {
  test("renders title", () => {
    const { getByText } = render(<DashboardSectionHeader title="Test Title" />);
    expect(getByText("Test Title")).toBeTruthy();
  });

  test("renders children", () => {
    const { getByText } = render(<DashboardSectionHeader title="Title"><Text>child</Text></DashboardSectionHeader>);
    expect(getByText("child")).toBeTruthy();
  });
});

describe("DashboardSectionCard", () => {
  test("renders children", () => {
    const { getByText } = render(<DashboardSectionCard><Text>content</Text></DashboardSectionCard>);
    expect(getByText("content")).toBeTruthy();
  });
});

describe("ToggleSectionHeader", () => {
  test("renders title", () => {
    const { getByText } = render(<ToggleSectionHeader title="Toggle Title" visible expanded={false} onPress={jest.fn()} />);
    expect(getByText("Toggle Title")).toBeTruthy();
  });
});
