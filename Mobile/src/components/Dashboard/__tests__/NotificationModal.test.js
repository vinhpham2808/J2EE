jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { WHITE: "#FFF" },
  useAppColors: () => ({ WHITE: "#FFF", CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#B8A6AC", BG: "#F5F5F5", ROSE_MIST: "#FFE4E9", PRIMARY: "#E8597A", EXPENSE: "#EF4444", INCOME: "#22C55E", INFO_LIGHT: "#E0F2FE" }),
}));
jest.mock("../../../constants/api", () => ({
  API_ENDPOINTS: {
    GET_NOTIFICATIONS: "/notifications",
    MARK_NOTIFICATION_READ: (id) => "/notifications/" + id + "/read",
    MARK_ALL_NOTIFICATIONS_READ: "/notifications/read-all",
    DELETE_NOTIFICATION: (id) => "/notifications/" + id,
    DELETE_NOTIFICATIONS_BULK: "/notifications/delete-bulk",
  }
}));
jest.mock("../../../utils/layoutScale", () => ({ clampScale: (v) => v, scale: (v) => v, useDynamicViewport: () => ({ insets: { top: 44, bottom: 0 } }) }));
jest.mock("../../../utils/notificationFilters", () => ({
  NOTIFICATION_READ_FILTERS: { ALL: "all", UNREAD: "unread" },
  NOTIFICATION_CATEGORY_FILTERS: { ALL: "all", FINANCIAL: "financial", BUDGET: "budget", SYSTEM: "system" },
  filterNotifications: (items, filters) => items,
  getNextSelectionForVisibleNotifications: (items, prev) => new Set(items.map((i) => i.id)),
}));
jest.mock("../../ui/AppIcon", () => ({ name, size, color, style }) => null);
jest.mock("../../../services/apiClient", () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  put: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  post: jest.fn().mockResolvedValue({}),
}));

import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import NotificationModal from "../NotificationModal";

describe("NotificationModal", () => {
  test("renders title when visible", async () => {
    const { getByText } = render(<NotificationModal visible onClose={jest.fn()} />);
    await waitFor(() => {
      expect(getByText("notificationModal.title")).toBeTruthy();
    });
  });

  test("shows all read text when no unread", async () => {
    const { getByText } = render(<NotificationModal visible onClose={jest.fn()} />);
    await waitFor(() => {
      expect(getByText("notificationModal.allRead")).toBeTruthy();
    });
  });
});
