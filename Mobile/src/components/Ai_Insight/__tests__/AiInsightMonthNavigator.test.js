import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Pressable } from "react-native";
import AiInsightMonthNavigator from "../AiInsightMonthNavigator";

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    PRIMARY: "#EF5E83",
    TEXT: "#1A0F14",
    TEXT_MUTED: "#B8A6AC",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

jest.mock("../../ui/AppIcon", () => "AppIcon");

describe("AiInsightMonthNavigator", () => {
  const defaultProps = {
    canGoNext: true,
    canGoPrev: true,
    disabled: false,
    goToNextMonth: jest.fn(),
    goToPrevMonth: jest.fn(),
    monthLabel: "Tháng 06/2026",
  };

  beforeEach(() => {
    defaultProps.goToNextMonth.mockClear();
    defaultProps.goToPrevMonth.mockClear();
  });

  test("renders month label correctly", () => {
    const { getByText } = render(<AiInsightMonthNavigator {...defaultProps} />);
    expect(getByText("Tháng 06/2026")).toBeTruthy();
  });

  test("enables arrows when canGoPrev and canGoNext are true", () => {
    const { UNSAFE_queryAllByType } = render(
      <AiInsightMonthNavigator {...defaultProps} />
    );

    const pressables = UNSAFE_queryAllByType(Pressable);
    expect(pressables[0].props.disabled).toBe(false);
    expect(pressables[1].props.disabled).toBe(false);
  });

  test("disables prev arrow when canGoPrev is false", () => {
    const { UNSAFE_queryAllByType } = render(
      <AiInsightMonthNavigator {...defaultProps} canGoPrev={false} />
    );

    const pressables = UNSAFE_queryAllByType(Pressable);
    expect(pressables[0].props.disabled).toBe(true);
    expect(pressables[1].props.disabled).toBe(false);
  });

  test("disables next arrow when canGoNext is false", () => {
    const { UNSAFE_queryAllByType } = render(
      <AiInsightMonthNavigator {...defaultProps} canGoNext={false} />
    );

    const pressables = UNSAFE_queryAllByType(Pressable);
    expect(pressables[0].props.disabled).toBe(false);
    expect(pressables[1].props.disabled).toBe(true);
  });

  test("disables both arrows when navigator is disabled", () => {
    const { UNSAFE_queryAllByType } = render(
      <AiInsightMonthNavigator {...defaultProps} disabled={true} />
    );

    const pressables = UNSAFE_queryAllByType(Pressable);
    expect(pressables[0].props.disabled).toBe(true);
    expect(pressables[1].props.disabled).toBe(true);
  });

  test("calls goToPrevMonth and goToNextMonth when pressed", () => {
    const { UNSAFE_queryAllByType } = render(
      <AiInsightMonthNavigator {...defaultProps} />
    );

    const pressables = UNSAFE_queryAllByType(Pressable);
    
    fireEvent.press(pressables[0]);
    expect(defaultProps.goToPrevMonth).toHaveBeenCalledTimes(1);

    fireEvent.press(pressables[1]);
    expect(defaultProps.goToNextMonth).toHaveBeenCalledTimes(1);
  });
});
