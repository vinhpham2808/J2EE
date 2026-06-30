jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    SURFACE: "#FFF",
    SURFACE_ELEVATED: "#F5F5F5",
    CARD_BORDER: "#EEE",
    SHADOW_COLOR: "#000",
    BLACK: "#000",
  }),
}));
jest.mock("../../../utils/layoutScale", () => ({ scale: (n) => n }));

import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { create, act } from "react-test-renderer";
import { View, TouchableOpacity } from "react-native";
import AppCard from "../AppCard";

describe("AppCard", () => {
  const onPress = jest.fn();
  beforeEach(() => jest.clearAllMocks());

  it("renders children", () => {
    const { getByText } = render(
      <AppCard><Text>Hello</Text></AppCard>
    );
    expect(getByText("Hello")).toBeTruthy();
  });

  it("uses View when onPress is not provided", () => {
    let root;
    act(() => { root = create(<AppCard><Text>Content</Text></AppCard>); });
    const views = root.root.findAllByType(View);
    expect(views.length).toBeGreaterThanOrEqual(1);
    // No TouchableOpacity
    const touchables = root.root.findAllByType(TouchableOpacity);
    expect(touchables.length).toBe(0);
  });

  it("uses TouchableOpacity when onPress is provided", () => {
    let root;
    act(() => { root = create(<AppCard onPress={onPress}><Text>Content</Text></AppCard>); });
    const touchables = root.root.findAllByType(TouchableOpacity);
    expect(touchables.length).toBe(1);
  });

  it("calls onPress when pressed", () => {
    const { getByText } = render(
      <AppCard onPress={onPress}><Text>Press me</Text></AppCard>
    );
    fireEvent.press(getByText("Press me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders with bordered=false without crash", () => {
    const { getByText } = render(
      <AppCard bordered={false}><Text>No border</Text></AppCard>
    );
    expect(getByText("No border")).toBeTruthy();
  });

  it("renders with shadow=false without crash", () => {
    const { getByText } = render(
      <AppCard shadow={false}><Text>No shadow</Text></AppCard>
    );
    expect(getByText("No shadow")).toBeTruthy();
  });

  it("renders with elevated=true without crash", () => {
    const { getByText } = render(
      <AppCard elevated={true}><Text>Elevated</Text></AppCard>
    );
    expect(getByText("Elevated")).toBeTruthy();
  });
});
