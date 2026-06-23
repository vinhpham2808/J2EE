import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ForecastMonthPicker from "../ForecastMonthPicker";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "forecastComponents.selectMonth": "Chọn tháng",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CARD: "#FFFFFF",
    PRIMARY_LIGHT: "#FFE4EA",
    PRIMARY: "#EF5E83",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    CARD_BORDER: "#E5E7EB",
    ROSE_MIST: "#FFE4EA",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    PRIMARY_LIGHT: "#FFE4EA",
    PRIMARY: "#EF5E83",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    CARD_BORDER: "#E5E7EB",
    ROSE_MIST: "#FFE4EA",
  }),
}));

describe("ForecastMonthPicker", () => {
  const options = [
    { month: 5, year: 2026, label: "Tháng 05/2026" },
    { month: 6, year: 2026, label: "Tháng 06/2026" },
  ];

  const defaultProps = {
    label: "Tháng 06/2026",
    hint: "Hãy chọn tháng để xem dự báo",
    visible: false,
    options,
    selectedMonth: 6,
    selectedYear: 2026,
    onOpen: jest.fn(),
    onSelect: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders label and hint, triggers onOpen on click", () => {
    const { getByText, getByLabelText } = render(
      <ForecastMonthPicker {...defaultProps} />
    );

    expect(getByText("Tháng 06/2026")).toBeTruthy();
    expect(getByText("Hãy chọn tháng để xem dự báo")).toBeTruthy();

    const pickerBtn = getByLabelText("Chọn tháng");
    fireEvent.press(pickerBtn);
    expect(defaultProps.onOpen).toHaveBeenCalledTimes(1);
  });

  test("renders options inside modal when visible is true", () => {
    const { getByText, getAllByText } = render(
      <ForecastMonthPicker {...defaultProps} visible={true} />
    );

    expect(getByText("Tháng 05/2026")).toBeTruthy();
    expect(getAllByText("Tháng 06/2026")).toHaveLength(2);

    // Clicking an option calls onSelect
    fireEvent.press(getByText("Tháng 05/2026"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(5, 2026);
  });
});
