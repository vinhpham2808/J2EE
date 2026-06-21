import React from "react";
import { create, act } from "react-test-renderer";
import { Pressable, Text } from "react-native";
import MonthNavigator from "../MonthNavigator";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CARD: "#FFF",
    CARD_BORDER: "#E0E0E0",
    TEXT: "#000",
    PRIMARY: "#EF5E83",
  },
  useAppColors: () => ({
    TEXT: "#000",
    PRIMARY: "#EF5E83",
    CARD: "#FFF",
    CARD_BORDER: "#E0E0E0",
  }),
}));

const baseProps = {
  selectedMonth: 6,
  selectedYear: 2024,
  onPrev: jest.fn(),
  onNext: jest.fn(),
};

describe("MonthNavigator", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders prev and next arrow buttons", () => {
    let root;
    act(() => {
      root = create(<MonthNavigator {...baseProps} />);
    });
    const pressables = root.root.findAllByType(Pressable);
    expect(pressables.length).toBe(2);
  });

  it("renders left arrow ‹ and right arrow ›", () => {
    let root;
    act(() => {
      root = create(<MonthNavigator {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("‹");
    expect(texts).toContain("›");
  });

  it("renders month label using t key", () => {
    let root;
    act(() => {
      root = create(<MonthNavigator {...baseProps} selectedMonth={3} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("forecastComponents.month3");
  });

  it("renders selected year", () => {
    let root;
    act(() => {
      root = create(<MonthNavigator {...baseProps} selectedYear={2025} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain(2025);
  });

  it("calls onPrev when left arrow is pressed", () => {
    const onPrev = jest.fn();
    let root;
    act(() => {
      root = create(<MonthNavigator {...baseProps} onPrev={onPrev} />);
    });
    act(() => {
      root.root.findAllByType(Pressable)[0].props.onPress();
    });
    expect(onPrev).toHaveBeenCalled();
  });

  it("calls onNext when right arrow is pressed", () => {
    const onNext = jest.fn();
    let root;
    act(() => {
      root = create(<MonthNavigator {...baseProps} onNext={onNext} />);
    });
    act(() => {
      root.root.findAllByType(Pressable)[1].props.onPress();
    });
    expect(onNext).toHaveBeenCalled();
  });
});
