import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Switch } from "react-native";
import MoreSettings, { LogoutButton } from "../MoreSettings";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "more.groups.account": "Tài khoản",
        "more.groups.customization": "Tùy biến",
        "more.groups.finance": "Tài chính",
        "more.groups.appInfo": "Thông tin ứng dụng",
        "more.groups.notifications": "Thông báo",
        "more.groups.appearance": "Giao diện",
        "more.items.editProfile": "Chỉnh sửa hồ sơ",
        "more.items.language": "Ngôn ngữ",
        "more.items.appNotifications": "Thông báo ứng dụng",
        "more.items.emailReminder": "Nhắc nhở qua email",
        "more.items.darkMode": "Chế độ tối",
        "more.darkModeOn": "Đang bật",
        "more.lightModeOn": "Đang tắt",
        "more.logout": "Đăng xuất",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    WHITE: "#FFFFFF",
    ACTION_EXPENSE: "#F97316",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    BG: "#F9F9FA",
    WHITE: "#FFFFFF",
    EXPENSE: "#EF4444",
  }),
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }) => <Text>Icon: {name}</Text>,
  };
});

describe("MoreSettings", () => {
  const mockEmailPreferences = {
    isDailyEnabled: true,
    toggleDailyEmail: jest.fn(),
    isUpdating: false,
    dailyReportPref: true,
  };
  const mockOnAppNotificationsChange = jest.fn();
  const mockOnThemeChange = jest.fn();
  const mockOnItemPress = jest.fn();

  const defaultProps = {
    appNotifications: true,
    emailPreferences: mockEmailPreferences,
    isDark: false,
    languageLabel: "Tiếng Việt",
    onAppNotificationsChange: mockOnAppNotificationsChange,
    onThemeChange: mockOnThemeChange,
    onItemPress: mockOnItemPress,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders settings groups and settings items correctly", () => {
    const { getByText } = render(<MoreSettings {...defaultProps} />);

    // Group titles
    expect(getByText("Tài khoản")).toBeTruthy();
    expect(getByText("Tùy biến")).toBeTruthy();
    expect(getByText("Thông báo")).toBeTruthy();

    // Item titles
    expect(getByText("Chỉnh sửa hồ sơ")).toBeTruthy();
    expect(getByText("Ngôn ngữ")).toBeTruthy();
    expect(getByText("Chế độ tối")).toBeTruthy();

    // Language value
    expect(getByText("Tiếng Việt")).toBeTruthy();
  });

  test("handles switch changes", () => {
    const { UNSAFE_getAllByType } = render(<MoreSettings {...defaultProps} />);

    const switches = UNSAFE_getAllByType(Switch);
    expect(switches.length).toBe(3); // App notifications, Email reminder, Dark mode

    // 1. Toggle App Notifications switch
    fireEvent(switches[0], "valueChange", false);
    expect(mockOnAppNotificationsChange).toHaveBeenCalledWith(false);

    // 2. Toggle Email Reminder switch
    fireEvent(switches[1], "valueChange", false);
    expect(mockEmailPreferences.toggleDailyEmail).toHaveBeenCalledTimes(1);

    // 3. Toggle Dark Mode switch
    fireEvent(switches[2], "valueChange", true);
    expect(mockOnThemeChange).toHaveBeenCalledWith(true);
  });

  test("handles clicking non-switch items", () => {
    const { getByText } = render(<MoreSettings {...defaultProps} />);

    fireEvent.press(getByText("Chỉnh sửa hồ sơ"));
    expect(mockOnItemPress).toHaveBeenCalledWith(expect.objectContaining({ key: "edit-profile" }));
  });
});

describe("LogoutButton", () => {
  test("renders logout button and triggers click", () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<LogoutButton onPress={mockOnPress} />);

    expect(getByText("Đăng xuất")).toBeTruthy();
    fireEvent.press(getByText("Đăng xuất"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
