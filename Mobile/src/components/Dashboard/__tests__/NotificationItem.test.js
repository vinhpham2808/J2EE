jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { WHITE: "#FFF" },
  useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#B8A6AC", BG: "#F5F5F5", CARD: "#FFF", CARD_BORDER: "#EEE", PRIMARY: "#E8597A", EXPENSE: "#EF4444", INCOME: "#22C55E" }),
}));
jest.mock("../../../utils/layoutScale", () => ({ clampScale: (v) => v, scale: (v) => v }));
jest.mock("../../ui/AppIcon", () => ({ name, size, color, style }) => null);

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import NotificationItem from "../NotificationItem";

describe("NotificationItem", () => {
  const item = { id: 1, title: "Test Notification", message: "This is a test", createdAt: new Date().toISOString(), isRead: false };

  test("renders title and message", () => {
    const { getByText } = render(<NotificationItem item={item} onDelete={jest.fn()} onPress={jest.fn()} onToggleSelect={jest.fn()} selected={false} />);
    expect(getByText("Test Notification")).toBeTruthy();
    expect(getByText("This is a test")).toBeTruthy();
  });

  test("renders default title when empty", () => {
    const { getByText } = render(<NotificationItem item={{}} onDelete={jest.fn()} onPress={jest.fn()} onToggleSelect={jest.fn()} selected={false} />);
    expect(getByText("notificationItem.defaultTitle")).toBeTruthy();
  });

  test("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<NotificationItem item={item} onDelete={jest.fn()} onPress={onPress} onToggleSelect={jest.fn()} selected={false} />);
    fireEvent.press(getByText("Test Notification"));
    expect(onPress).toHaveBeenCalledWith(item);
  });
});
