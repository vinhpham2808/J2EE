jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#B8A6AC", BORDER: "#EEE", SURFACE: "#FFF", EXPENSE_COLOR: "#EF4444" }),
}));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 44, bottom: 0 }) }));
jest.mock("../../../utils/safeArea", () => ({ getSafeAreaTop: (insets, padding) => insets.top + padding }));
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock("../../ui/AppIcon", () => ({ name, size, color, style }) => null);
jest.mock("../../ui/AmountText", () => ({ value, style }) => null);

import React from "react";
import { render } from "@testing-library/react-native";
import HomeTopHeader from "../HomeTopHeader";

describe("HomeTopHeader", () => {
  test("renders total balance label", () => {
    const { getByText } = render(<HomeTopHeader />);
    expect(getByText("dashboard.totalBalance")).toBeTruthy();
  });

  test("renders hidden balance text", () => {
    const { getByText } = render(<HomeTopHeader isBalanceVisible={false} />);
    expect(getByText("\u2022\u2022\u2022\u2022\u2022\u2022")).toBeTruthy();
  });

  test("renders unread badge when count > 0", () => {
    const { getByText } = render(<HomeTopHeader unreadCount={3} />);
    expect(getByText("3")).toBeTruthy();
  });

  test("shows 9+ for high unread count", () => {
    const { getByText } = render(<HomeTopHeader unreadCount={15} />);
    expect(getByText("9+")).toBeTruthy();
  });
});
