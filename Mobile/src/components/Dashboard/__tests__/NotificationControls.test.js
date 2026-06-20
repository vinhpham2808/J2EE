jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { WHITE: "#FFF" },
  useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999", CARD: "#FFF", CARD_BORDER: "#EEE", PRIMARY: "#E8597A", BG: "#F5F5F5", EXPENSE: "#EF4444", EXPENSE_LIGHT: "rgba(239,68,68,0.1)" }),
}));
jest.mock("../../../utils/layoutScale", () => ({ clampScale: (v) => v, scale: (v) => v }));
jest.mock("../../ui/AppIcon", () => ({ name, size, color, style }) => null);

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { NotificationFilters, SelectionBar } from "../NotificationControls";

describe("NotificationFilters", () => {
  const baseProps = { categoryFilter: "all", colors: {}, readFilter: "all", setCategoryFilter: jest.fn(), setReadFilter: jest.fn() };

  test("renders unread filter option", () => {
    const { getByText } = render(<NotificationFilters {...baseProps} />);
    expect(getByText("notificationControls.unread")).toBeTruthy();
  });

  test("calls setReadFilter when toggled", () => {
    const setReadFilter = jest.fn();
    const { getByText } = render(<NotificationFilters {...baseProps} setReadFilter={setReadFilter} />);
    fireEvent.press(getByText("notificationControls.unread"));
    expect(setReadFilter).toHaveBeenCalled();
  });
});

describe("SelectionBar", () => {
  test("shows select all when no selection", () => {
    const { getByText } = render(<SelectionBar allVisibleSelected={false} colors={{}} onDeleteSelected={jest.fn()} onToggleAll={jest.fn()} selectedCount={0} />);
    expect(getByText("notificationControls.selectAll")).toBeTruthy();
  });

  test("shows selected count when items selected", () => {
    const { getByText } = render(<SelectionBar allVisibleSelected={false} colors={{}} onDeleteSelected={jest.fn()} onToggleAll={jest.fn()} selectedCount={3} />);
    expect(getByText("notificationControls.selectedCount")).toBeTruthy();
  });

  test("calls onToggleAll when pressed", () => {
    const onToggleAll = jest.fn();
    const { getByText } = render(<SelectionBar allVisibleSelected={false} colors={{}} onDeleteSelected={jest.fn()} onToggleAll={onToggleAll} selectedCount={0} />);
    fireEvent.press(getByText("notificationControls.selectAll"));
    expect(onToggleAll).toHaveBeenCalled();
  });
});
