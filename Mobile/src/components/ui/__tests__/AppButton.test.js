jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    PRIMARY: "#7C4DFF",
    WHITE: "#FFF",
    PRIMARY_GLOW: "#EDE7FF",
    PRIMARY_LIGHT: "#EDE7FF",
    SHADOW_COLOR: "#000",
  }),
}));
jest.mock("../../../utils/layoutScale", () => ({ scale: (n) => n }));
jest.mock("../AppIcon", () => () => null);

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { create, act } from "react-test-renderer";
import { TouchableOpacity, ActivityIndicator } from "react-native";
import AppButton from "../AppButton";

describe("AppButton", () => {
  const onPress = jest.fn();
  beforeEach(() => jest.clearAllMocks());

  // ─── Rendering ──────────────────────────────────────────────────────────────

  it("renders title for primary variant (default)", () => {
    const { getByText } = render(<AppButton title="Save" onPress={onPress} />);
    expect(getByText("Save")).toBeTruthy();
  });

  it.each(["secondary", "outline", "ghost"])(
    "renders title for %s variant",
    (variant) => {
      const { getByText } = render(
        <AppButton title="Click" onPress={onPress} variant={variant} />
      );
      expect(getByText("Click")).toBeTruthy();
    }
  );

  it("renders with size='sm' without crash", () => {
    const { getByText } = render(<AppButton title="Small" onPress={onPress} size="sm" />);
    expect(getByText("Small")).toBeTruthy();
  });

  it("renders with size='lg' without crash", () => {
    const { getByText } = render(<AppButton title="Large" onPress={onPress} size="lg" />);
    expect(getByText("Large")).toBeTruthy();
  });

  // ─── Loading state ───────────────────────────────────────────────────────────

  it("shows ActivityIndicator when loading=true", () => {
    let root;
    act(() => { root = create(<AppButton title="Save" loading={true} onPress={onPress} />); });
    const indicators = root.root.findAllByType(ActivityIndicator);
    expect(indicators.length).toBe(1);
  });

  it("hides title text when loading=true", () => {
    const { queryByText } = render(<AppButton title="Save" loading={true} onPress={onPress} />);
    expect(queryByText("Save")).toBeNull();
  });

  // ─── Disabled state ──────────────────────────────────────────────────────────

  it("TouchableOpacity is disabled when disabled=true", () => {
    let root;
    act(() => { root = create(<AppButton title="Save" disabled={true} onPress={onPress} />); });
    const btn = root.root.findByType(TouchableOpacity);
    expect(btn.props.disabled).toBe(true);
  });

  it("TouchableOpacity is disabled when loading=true", () => {
    let root;
    act(() => { root = create(<AppButton title="Save" loading={true} onPress={onPress} />); });
    const btn = root.root.findByType(TouchableOpacity);
    expect(btn.props.disabled).toBe(true);
  });

  // ─── Press interactions ──────────────────────────────────────────────────────

  it("calls onPress when pressed and not disabled", () => {
    const { getByText } = render(<AppButton title="Go" onPress={onPress} />);
    fireEvent.press(getByText("Go"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onPress when disabled=true", () => {
    const { getByText } = render(
      <AppButton title="Go" onPress={onPress} disabled={true} />
    );
    fireEvent.press(getByText("Go"));
    expect(onPress).not.toHaveBeenCalled();
  });

  // ─── Icon ────────────────────────────────────────────────────────────────────

  it("renders with icon on left without crash", () => {
    const { getByText } = render(
      <AppButton title="Go" onPress={onPress} icon="add-outline" iconPosition="left" />
    );
    expect(getByText("Go")).toBeTruthy();
  });

  it("renders with icon on right without crash", () => {
    const { getByText } = render(
      <AppButton title="Go" onPress={onPress} icon="arrow-forward" iconPosition="right" />
    );
    expect(getByText("Go")).toBeTruthy();
  });
});
