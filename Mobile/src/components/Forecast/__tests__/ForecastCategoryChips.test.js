import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ForecastCategoryChips from "../ForecastCategoryChips";

jest.mock("../../../utils/forecast", () => ({
  CATEGORY_COLORS: ["#FF5E7E", "#4E97FF"],
  TREND_CONFIG: {
    STABLE: { icon: "➖", color: "#8B7B80" },
    UPWARD: { icon: "🔺", color: "#FF5E7E" },
    DOWNWARD: { icon: "🔻", color: "#4CDAD9" },
  },
}));

jest.mock("../../../utils/format", () => ({
  formatMoney: (val) => `${val}đ`,
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
  }),
}));

describe("ForecastCategoryChips", () => {
  const categories = [
    { categoryId: 1, categoryName: "Ăn uống", predictedAmount: 2000000, trend: "UPWARD" },
    { categoryId: 2, categoryName: "Mua sắm", predictedAmount: 1500000, trend: "STABLE" },
  ];

  const defaultProps = {
    categories,
    selectedCategoryId: 1,
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns null when categories is empty", () => {
    const { toJSON } = render(
      <ForecastCategoryChips {...defaultProps} categories={[]} />
    );
    expect(toJSON()).toBeNull();
  });

  test("renders categories list with icons and amounts", () => {
    const { getByText } = render(<ForecastCategoryChips {...defaultProps} />);

    expect(getByText("Ăn uống")).toBeTruthy();
    expect(getByText("🔺")).toBeTruthy();
    expect(getByText("2000000đ")).toBeTruthy();

    expect(getByText("Mua sắm")).toBeTruthy();
    expect(getByText("➖")).toBeTruthy();
    expect(getByText("1500000đ")).toBeTruthy();
  });

  test("triggers onSelect callback when chip is pressed", () => {
    const { getByText } = render(<ForecastCategoryChips {...defaultProps} />);

    fireEvent.press(getByText("Mua sắm"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(2);
  });
});
