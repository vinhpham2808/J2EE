import React from "react";
import { render, act } from "@testing-library/react-native";
import ForecastScreen from "../ForecastScreen";
import { AuthContext } from "../../../contexts/AuthContext";
import useForecastData from "../../../hooks/useForecastData";

jest.mock("@react-navigation/native", () => ({
  useRoute: () => ({ params: {} }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock("../../../contexts/AuthContext", () => {
  const React = require("react");
  return {
    AuthContext: React.createContext({ user: null }),
  };
});

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFFFFF",
    PRIMARY: "#EF5E83",
    TEXT_SECONDARY: "#8B7B80",
    EXPENSE: "#EF5E83",
    WARNING: "#FFB84D",
    TEXT_MUTED: "#A1A1A1",
  }),
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaContentStyle: (insets, style) => style || {},
}));

jest.mock("../../../utils/format", () => ({
  formatMoney: (val) => `$${val}`,
}));

jest.mock("../../../utils/forecast", () => ({
  TREND_CONFIG: {
    UP: { icon: "📈" },
    DOWN: { icon: "📉" },
    STABLE: { icon: "📊" },
  },
}));

// Mocking useForecastData hook
jest.mock("../../../hooks/useForecastData");

// Mocking all subcomponents
jest.mock("../../../components/Forecast/ForecastPaywall", () => "ForecastPaywall");
jest.mock("../../../components/Forecast/ForecastSummaryCard", () => "ForecastSummaryCard");
jest.mock("../../../components/Forecast/ForecastMonthPicker", () => "ForecastMonthPicker");
jest.mock("../../../components/Forecast/ForecastBarChart", () => "ForecastBarChart");
jest.mock("../../../components/Forecast/ForecastCategoryChips", () => "ForecastCategoryChips");
jest.mock("../../../components/Forecast/ForecastTrendChart", () => "ForecastTrendChart");
jest.mock("../../../components/Forecast/ForecastAnomalySection", () => "ForecastAnomalySection");
jest.mock("../../../components/Forecast/ForecastAISection", () => "ForecastAISection");
jest.mock("../../../components/Forecast/ForecastEmptyState", () => "ForecastEmptyState");
jest.mock("../../../components/common/ScreenBackHeader", () => "ScreenBackHeader");

describe("ForecastScreen", () => {
  const mockSetIsMonthPickerVisible = jest.fn();
  const mockSetSelectedCategoryId = jest.fn();
  const mockSelectMonth = jest.fn();

  const defaultMockData = {
    selectedMonth: 6,
    selectedYear: 2026,
    isMonthPickerVisible: false,
    setIsMonthPickerVisible: mockSetIsMonthPickerVisible,
    selectedCategoryId: "cat-1",
    setSelectedCategoryId: mockSetSelectedCategoryId,
    anomalies: [{ id: 1, title: "Anomaly 1" }],
    isLoading: false,
    isTrendLoading: false,
    insightError: null,
    categories: [
      { categoryId: "cat-1", categoryName: "Food", predictedAmount: 100 },
      { categoryId: "cat-2", categoryName: "Transport", predictedAmount: 50 },
    ],
    totalPredicted: 150,
    topCategory: { categoryId: "cat-1", categoryName: "Food", predictedAmount: 100, trend: "UP" },
    selectedCategory: { categoryId: "cat-1", categoryName: "Food" },
    currentInsight: { narrative: "AI insight narrative", generatedAt: "2026-06-21" },
    monthPickerLabel: "June 2026",
    monthPickerHint: "Select a month",
    monthOptions: [{ label: "June 2026", value: { month: 6, year: 2026 } }],
    barChartData: [],
    lineChartData: [],
    selectMonth: mockSelectMonth,
  };

  const renderScreen = (userValue) => {
    return render(
      <AuthContext.Provider value={{ user: userValue }}>
        <ForecastScreen />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useForecastData.mockReturnValue({ ...defaultMockData });
  });

  describe("FREE subscription plan", () => {
    test("should render ForecastPaywall and ScreenBackHeader, and not render premium components", () => {
      const { UNSAFE_queryByType: queryByType } = renderScreen({ subscriptionPlan: "FREE" });

      expect(queryByType("ScreenBackHeader")).toBeTruthy();
      expect(queryByType("ForecastPaywall")).toBeTruthy();

      expect(queryByType("ForecastMonthPicker")).toBeNull();
      expect(queryByType("ForecastSummaryCard")).toBeNull();
      expect(queryByType("ForecastBarChart")).toBeNull();
      expect(queryByType("ForecastCategoryChips")).toBeNull();
      expect(queryByType("ForecastTrendChart")).toBeNull();
      expect(queryByType("ForecastAnomalySection")).toBeNull();
      expect(queryByType("ForecastAISection")).toBeNull();
    });
  });

  describe("PREMIUM subscription plan", () => {
    test("should render all main elements, picker, metrics cards, bar chart, chips, trend chart, anomaly section, and AI section", () => {
      const { UNSAFE_queryByType: queryByType, UNSAFE_queryAllByType: queryAllByType } = renderScreen({ subscriptionPlan: "PREMIUM" });

      expect(queryByType("ScreenBackHeader")).toBeTruthy();

      const picker = queryByType("ForecastMonthPicker");
      expect(picker).toBeTruthy();
      expect(picker.props.label).toBe("June 2026");

      const cards = queryAllByType("ForecastSummaryCard");
      expect(cards.length).toBe(3);

      // Card 1: Total Forecast
      expect(cards[0].props.label).toBe("forecast.totalLabel");
      expect(cards[0].props.value).toBe("$150");

      // Card 2: Top Category
      expect(cards[1].props.label).toBe("forecast.topLabel");
      expect(cards[1].props.value).toBe("Food");
      expect(cards[1].props.sub).toBe("$100");
      expect(cards[1].props.icon).toBe("📈");

      // Card 3: Anomalies Count
      expect(cards[2].props.label).toBe("forecast.anomalyLabel");
      expect(cards[2].props.value).toBe("1");

      const barChart = queryByType("ForecastBarChart");
      expect(barChart).toBeTruthy();

      const chips = queryByType("ForecastCategoryChips");
      expect(chips).toBeTruthy();
      expect(chips.props.selectedCategoryId).toBe("cat-1");

      const trendChart = queryByType("ForecastTrendChart");
      expect(trendChart).toBeTruthy();
      expect(trendChart.props.categoryName).toBe("Food");

      const anomalySection = queryByType("ForecastAnomalySection");
      expect(anomalySection).toBeTruthy();
      expect(anomalySection.props.anomalies).toEqual(defaultMockData.anomalies);

      const aiSection = queryByType("ForecastAISection");
      expect(aiSection).toBeTruthy();
      expect(aiSection.props.narrative).toBe("AI insight narrative");

      expect(queryByType("ForecastEmptyState")).toBeNull();
    });

    test("should render ForecastEmptyState and default values in summary card when categories are empty", () => {
      useForecastData.mockReturnValue({
        ...defaultMockData,
        categories: [],
        topCategory: null,
      });

      const { UNSAFE_queryByType: queryByType, UNSAFE_queryAllByType: queryAllByType } = renderScreen({ subscriptionPlan: "PREMIUM" });

      expect(queryByType("ForecastBarChart")).toBeNull();
      expect(queryByType("ForecastCategoryChips")).toBeNull();

      const emptyState = queryByType("ForecastEmptyState");
      expect(emptyState).toBeTruthy();
      expect(emptyState.props.message).toBe("forecast.emptyMessage");

      const cards = queryAllByType("ForecastSummaryCard");
      expect(cards[1].props.value).toBe("—");
      expect(cards[1].props.sub).toBe("");
      expect(cards[1].props.icon).toBe("📊");
    });
  });

  describe("Loading State", () => {
    test("should render loading activity indicator and loading text when isLoading is true, and hide cards", () => {
      useForecastData.mockReturnValue({
        ...defaultMockData,
        isLoading: true,
      });

      const { getByText, UNSAFE_queryAllByType: queryAllByType } = renderScreen({ subscriptionPlan: "PREMIUM" });

      expect(getByText("forecast.loading")).toBeTruthy();
      expect(queryAllByType("ForecastSummaryCard").length).toBe(0);
    });
  });

  describe("User Interactions", () => {
    test("should trigger month picker visibility actions onOpen and onClose, and trigger selectMonth onSelect", () => {
      const { UNSAFE_queryByType: queryByType } = renderScreen({ subscriptionPlan: "PREMIUM" });
      const picker = queryByType("ForecastMonthPicker");
      expect(picker).toBeTruthy();

      // Open month picker
      act(() => {
        picker.props.onOpen();
      });
      expect(mockSetIsMonthPickerVisible).toHaveBeenCalledWith(true);

      // Close month picker
      act(() => {
        picker.props.onClose();
      });
      expect(mockSetIsMonthPickerVisible).toHaveBeenCalledWith(false);

      // Select a month
      const mockOption = { month: 7, year: 2026 };
      act(() => {
        picker.props.onSelect(mockOption);
      });
      expect(mockSelectMonth).toHaveBeenCalledWith(mockOption);
    });

    test("should call setSelectedCategoryId when a category chip is selected", () => {
      const { UNSAFE_queryByType: queryByType } = renderScreen({ subscriptionPlan: "PREMIUM" });
      const chips = queryByType("ForecastCategoryChips");
      expect(chips).toBeTruthy();

      act(() => {
        chips.props.onSelect("cat-2");
      });
      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith("cat-2");
    });
  });
});
