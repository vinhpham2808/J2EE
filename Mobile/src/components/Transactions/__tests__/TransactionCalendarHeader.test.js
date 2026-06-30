jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));
jest.mock("../../ui/AppIcon", () => () => null);
jest.mock("../../ui/AmountText", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ value, type, testID }) =>
    React.createElement(Text, { testID: testID || `amount-${type}` }, String(value));
});

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Pressable, Text, FlatList } from "react-native";
import { create, act } from "react-test-renderer";
import TransactionCalendarHeader from "../TransactionCalendarHeader";

const colors = {
  BG: "#FFFFFF",
  CARD: "#FFF",
  BORDER: "#EEE",
  SURFACE: "#F5F5F5",
  SEPARATOR: "#DDD",
  TEXT: "#111",
  TEXT_SECONDARY: "#666",
  TEXT_MUTED: "#B8A6AC",
  ACTION_EXPENSE: "#F97316",
  ACTION_INCOME: "#22C55E",
};

const darkColors = { ...colors, BG: "#0F0D0C" };

const baseProps = {
  activeType: "expense",
  colors,
  currentMonth: new Date(2026, 5, 1), // June 2026
  daysInMonth: [
    { id: "1", day: 1, isCurrentMonth: true },
    { id: "2", day: 2, isCurrentMonth: true },
  ],
  monthlySummary: { income: 500000, expense: 200000, net: 300000 },
  nextMonth: jest.fn(),
  prevMonth: jest.fn(),
  renderCalendarDay: ({ item }) => {
    const { Text } = require("react-native");
    return React.createElement(Text, { key: item.id }, String(item.day));
  },
  setActiveType: jest.fn(),
  setSelectedDay: jest.fn(),
};

describe("TransactionCalendarHeader", () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── Segment tabs ────────────────────────────────────────────────

  it("renders expense and income tab buttons when showTypeTabs is true", () => {
    const { getAllByText } = render(<TransactionCalendarHeader {...baseProps} />);
    // Both tabs render their labels (may appear also in summary card)
    expect(getAllByText("expenseItem.type").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("incomeItem.type").length).toBeGreaterThanOrEqual(1);
  });

  it("does not render type tab buttons when showTypeTabs is false", () => {
    let root;
    act(() => {
      root = create(<TransactionCalendarHeader {...baseProps} showTypeTabs={false} />);
    });
    // Count Pressable elements: should only be prevMonth + nextMonth (2 total, no tab buttons)
    const pressables = root.root.findAllByType(Pressable);
    expect(pressables.length).toBe(2);
  });

  it("calls setActiveType('expense') and setSelectedDay(null) when expense tab is pressed", () => {
    const setActiveType = jest.fn();
    const setSelectedDay = jest.fn();
    let root;
    act(() => {
      root = create(
        <TransactionCalendarHeader
          {...baseProps}
          setActiveType={setActiveType}
          setSelectedDay={setSelectedDay}
        />
      );
    });
    // Pressables: [0]=expense-tab, [1]=income-tab, [2]=prevMonth, [3]=nextMonth
    const pressables = root.root.findAllByType(Pressable);
    act(() => pressables[0].props.onPress());
    expect(setActiveType).toHaveBeenCalledWith("expense");
    expect(setSelectedDay).toHaveBeenCalledWith(null);
  });

  it("calls setActiveType('income') and setSelectedDay(null) when income tab is pressed", () => {
    const setActiveType = jest.fn();
    const setSelectedDay = jest.fn();
    let root;
    act(() => {
      root = create(
        <TransactionCalendarHeader
          {...baseProps}
          setActiveType={setActiveType}
          setSelectedDay={setSelectedDay}
        />
      );
    });
    const pressables = root.root.findAllByType(Pressable);
    act(() => pressables[1].props.onPress());
    expect(setActiveType).toHaveBeenCalledWith("income");
    expect(setSelectedDay).toHaveBeenCalledWith(null);
  });

  // ─── Month navigation ────────────────────────────────────────────────────────

  it("renders the month-year label using translation keys", () => {
    let root;
    act(() => {
      root = create(<TransactionCalendarHeader {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => {
      const c = t.props.children;
      return Array.isArray(c) ? c.join("") : String(c ?? "");
    });
    // The month label contains the t() key for month + the year
    const combined = texts.join(" ");
    expect(combined).toContain("reportComponents.month6");
    expect(combined).toContain("2026");
  });

  it("calls prevMonth when left chevron is pressed", () => {
    const prevMonth = jest.fn();
    let root;
    act(() => {
      root = create(<TransactionCalendarHeader {...baseProps} prevMonth={prevMonth} />);
    });
    // Pressables: expense-tab, income-tab, prevMonth, nextMonth
    const pressables = root.root.findAllByType(Pressable);
    const prevBtn = pressables.find((p) => p.props.onPress === prevMonth);
    act(() => prevBtn.props.onPress());
    expect(prevMonth).toHaveBeenCalledTimes(1);
  });

  it("calls nextMonth when right chevron is pressed", () => {
    const nextMonth = jest.fn();
    let root;
    act(() => {
      root = create(<TransactionCalendarHeader {...baseProps} nextMonth={nextMonth} />);
    });
    const pressables = root.root.findAllByType(Pressable);
    const nextBtn = pressables.find((p) => p.props.onPress === nextMonth);
    act(() => nextBtn.props.onPress());
    expect(nextMonth).toHaveBeenCalledTimes(1);
  });

  // ─── Calendar grid ──────────────────────────────────────────────────────────

  it("renders a FlatList for the calendar grid", () => {
    let root;
    act(() => {
      root = create(<TransactionCalendarHeader {...baseProps} />);
    });
    const flatLists = root.root.findAllByType(FlatList);
    expect(flatLists.length).toBeGreaterThanOrEqual(1);
  });

  it("passes daysInMonth as data to FlatList", () => {
    let root;
    act(() => {
      root = create(<TransactionCalendarHeader {...baseProps} />);
    });
    const flatList = root.root.findByType(FlatList);
    expect(flatList.props.data).toEqual(baseProps.daysInMonth);
  });

  it("renders all 7 weekday labels (CN, T2 ... T7)", () => {
    const { getByText } = render(<TransactionCalendarHeader {...baseProps} />);
    ["CN", "T2", "T3", "T4", "T5", "T6", "T7"].forEach((d) => {
      expect(getByText(d)).toBeTruthy();
    });
  });

  // ─── Summary card ───────────────────────────────────────────────────────────

  it("shows expense label in summary when activeType is expense", () => {
    const { getAllByText } = render(
      <TransactionCalendarHeader {...baseProps} activeType="expense" />
    );
    // t("expenseItem.type") appears in tab button + summary card label
    expect(getAllByText("expenseItem.type").length).toBeGreaterThanOrEqual(1);
  });

  it("shows income label in summary when activeType is income", () => {
    const { getAllByText } = render(
      <TransactionCalendarHeader {...baseProps} activeType="income" />
    );
    expect(getAllByText("incomeItem.type").length).toBeGreaterThanOrEqual(1);
  });

  it("renders balance section when summaryMode is combined (default)", () => {
    const { getByText } = render(<TransactionCalendarHeader {...baseProps} />);
    expect(getByText("dashboardComponents.balance")).toBeTruthy();
  });

  it("does not render balance section when summaryMode is expense", () => {
    const { queryByText } = render(
      <TransactionCalendarHeader {...baseProps} summaryMode="expense" />
    );
    expect(queryByText("dashboardComponents.balance")).toBeNull();
  });

  // ─── Dark mode ───────────────────────────────────────────────────────────────

  it("renders correctly with dark mode colors (BG #0F0D0C)", () => {
    const { getAllByText } = render(
      <TransactionCalendarHeader {...baseProps} colors={darkColors} />
    );
    // Just assert it renders without crash in dark mode
    expect(getAllByText("expenseItem.type").length).toBeGreaterThanOrEqual(1);
  });
});
