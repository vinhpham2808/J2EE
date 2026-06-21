import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Pressable, Animated } from "react-native";
import CategoryTypeSegmentedControl from "../CategoryTypeSegmentedControl";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "categoryTypeMeta.income": "Thu nhập",
        "categoryTypeMeta.expense": "Chi tiêu",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    WHITE: "#FFFFFF",
  },
  useAppColors: () => ({
    WHITE: "#FFFFFF",
    BG: "#F5F5F7",
    TEXT_SECONDARY: "#667085",
    INCOME: "#22C55E",
    EXPENSE: "#E76F51",
  }),
}));

describe("CategoryTypeSegmentedControl", () => {
  const defaultProps = {
    value: "income",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    defaultProps.onChange.mockClear();
    jest.spyOn(Animated, "timing").mockImplementation((value, config) => ({
      start: (callback) => {
        value.setValue(config.toValue);
        if (callback) callback({ finished: true });
      },
      stop: () => {},
    }));
  });

  test("renders segment control text correctly", () => {
    const { getByText } = render(<CategoryTypeSegmentedControl {...defaultProps} />);
    expect(getByText("Thu nhập")).toBeTruthy();
    expect(getByText("Chi tiêu")).toBeTruthy();
  });

  test("triggers onChange callback with correct parameters on segment click", () => {
    const { UNSAFE_queryAllByType } = render(
      <CategoryTypeSegmentedControl {...defaultProps} />
    );

    const segments = UNSAFE_queryAllByType(Pressable);
    expect(segments.length).toBe(2);

    // Click income segment
    fireEvent.press(segments[0]);
    expect(defaultProps.onChange).toHaveBeenCalledWith("income");

    // Click expense segment
    fireEvent.press(segments[1]);
    expect(defaultProps.onChange).toHaveBeenCalledWith("expense");
  });

  test("computes width and updates indicator when laid out", () => {
    const { toJSON, UNSAFE_queryAllByType } = render(
      <CategoryTypeSegmentedControl {...defaultProps} />
    );

    const animatedView = UNSAFE_queryAllByType(Pressable)[0].parent;

    // Initially segmentWidth is 0, so no indicator is rendered
    expect(toJSON().children.length).toBe(2); // Only two Pressable text buttons

    // Trigger layout event
    fireEvent(animatedView, "layout", {
      nativeEvent: {
        layout: {
          width: 300,
        },
      },
    });

    const updatedTree = toJSON();
    expect(updatedTree.children.length).toBe(3); // Indicator + two Pressable text buttons
  });
});
