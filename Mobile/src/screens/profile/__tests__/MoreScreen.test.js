import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";
import MoreScreen from "../MoreScreen";
import { AuthContext } from "../../../contexts/AuthContext";

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock safe area insets
const mockInsets = { top: 10, bottom: 20, left: 0, right: 0 };
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
}));

// Mock translation
const mockT = jest.fn((key) => key);
const mockI18n = {
  t: jest.fn((key) => `translated_${key}`),
};
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18n,
  }),
}));

// Mock AuthContext
const mockSignOut = jest.fn();
const mockUser = { name: "Test User", email: "test@example.com" };
jest.mock("../../../contexts/AuthContext", () => {
  const React = require("react");
  return {
    AuthContext: React.createContext({
      user: null,
      signOut: jest.fn(),
    }),
  };
});

// Mock ThemeContext
const mockToggleTheme = jest.fn();
const mockUseTheme = jest.fn(() => ({
  theme: "light",
  toggleTheme: mockToggleTheme,
}));
jest.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => mockUseTheme(),
  THEME_MODES: { LIGHT: "light", DARK: "dark" },
}));

// Mock useEmailPreferences
const mockToggleDailyEmail = jest.fn();
const mockUseEmailPreferences = jest.fn(() => ({
  dailyReportPref: { type: "DAILY_EXPENSE_REPORT", isEnabled: true },
  isDailyEnabled: true,
  isUpdating: false,
  toggleDailyEmail: mockToggleDailyEmail,
}));
jest.mock("../../../hooks/useEmailPreferences", () => ({
  __esModule: true,
  default: () => mockUseEmailPreferences(),
}));

// Mock useLanguagePreference
const mockChangeLanguageHook = jest.fn();
const mockUseLanguagePreference = jest.fn(() => ({
  languageCode: "vi",
  language: { settingsLabel: "Tiếng Việt" },
  loaded: true,
  changeLanguage: mockChangeLanguageHook,
}));
jest.mock("../../../hooks/useLanguagePreference", () => ({
  __esModule: true,
  default: () => mockUseLanguagePreference(),
}));

// Mock colors
jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFFFFF",
  }),
}));

// Mock safeArea
jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaContentStyle: (insets) => ({ paddingTop: insets.top }),
}));

// Mock subcomponents
jest.mock("../../../components/More/MoreSettings", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  const MockMoreSettings = ({
    appNotifications,
    isDark,
    languageLabel,
    onItemPress,
    onThemeChange,
    onAppNotificationsChange,
  }) => {
    return (
      <Pressable testID="more-settings-mock">
        <Text testID="more-settings-notifications">
          {appNotifications ? "notifications-enabled" : "notifications-disabled"}
        </Text>
        <Text testID="more-settings-dark">
          {isDark ? "dark-mode" : "light-mode"}
        </Text>
        <Text testID="more-settings-lang-label">
          {languageLabel}
        </Text>
        <Pressable
          testID="more-settings-lang-press"
          onPress={() => onItemPress({ key: "language" })}
        />
        <Pressable
          testID="more-settings-about-press"
          onPress={() => onItemPress({ key: "about" })}
        />
        <Pressable
          testID="more-settings-privacy-press"
          onPress={() => onItemPress({ key: "privacy" })}
        />
        <Pressable
          testID="more-settings-other-press"
          onPress={() =>
            onItemPress({ key: "other", route: "Help", params: { from: "more" } })
          }
        />
        <Pressable
          testID="more-settings-theme-toggle"
          onPress={() => onThemeChange()}
        />
        <Pressable
          testID="more-settings-app-notifications-toggle"
          onPress={() => onAppNotificationsChange(false)}
        />
        <Text>MoreSettings Mock</Text>
      </Pressable>
    );
  };

  const MockLogoutButton = ({ onPress }) => {
    return (
      <Pressable testID="logout-button-mock" onPress={onPress}>
        <Text>LogoutButton Mock</Text>
      </Pressable>
    );
  };

  return {
    __esModule: true,
    default: MockMoreSettings,
    LogoutButton: MockLogoutButton,
  };
});

jest.mock("../../../components/More/LanguageSelector", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ visible, onApply, onClose }) => {
      if (!visible) return null;
      return (
        <Pressable testID="language-selector-mock" onPress={onClose}>
          <Pressable
            testID="language-selector-apply"
            onPress={() => onApply("en")}
          />
          <Text>LanguageSelector Mock</Text>
        </Pressable>
      );
    },
  };
});

jest.mock("../../../components/More/ProfileHero", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ user, onPress }) => {
      return (
        <Pressable testID="profile-hero-mock" onPress={onPress}>
          <Text>ProfileHero Mock: {user?.name}</Text>
        </Pressable>
      );
    },
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }) => (
      <Text testID={`ionicons-${name}`}>{`Icon-${name}`}</Text>
    ),
  };
});

jest.useFakeTimers();

describe("MoreScreen", () => {
  let alertSpy;
  let linkingSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    linkingSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const renderWithAuth = (user = mockUser, signOut = mockSignOut) => {
    return render(
      <AuthContext.Provider value={{ user, signOut }}>
        <MoreScreen />
      </AuthContext.Provider>
    );
  };

  test("Renders components with correct values and colors in light mode", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      toggleTheme: mockToggleTheme,
    });

    const { getByTestId, queryByTestId, toJSON } = renderWithAuth();

    // Container color check
    const tree = toJSON();
    expect(tree.props.style).toContainEqual({ backgroundColor: "#FFFFFF" });

    // ProfileHero is rendered with user
    expect(getByTestId("profile-hero-mock")).toBeTruthy();

    // MoreSettings is rendered with correct initial values
    expect(getByTestId("more-settings-mock")).toBeTruthy();
    expect(getByTestId("more-settings-notifications").props.children).toBe(
      "notifications-enabled"
    );
    expect(getByTestId("more-settings-dark").props.children).toBe("light-mode");
    expect(getByTestId("more-settings-lang-label").props.children).toBe(
      "Tiếng Việt"
    );

    // LogoutButton is rendered
    expect(getByTestId("logout-button-mock")).toBeTruthy();

    // LanguageSelector is hidden by default
    expect(queryByTestId("language-selector-mock")).toBeNull();
  });

  test("Renders components with correct values and colors in dark mode", () => {
    mockUseTheme.mockReturnValue({
      theme: "dark",
      toggleTheme: mockToggleTheme,
    });

    const { getByTestId } = renderWithAuth();

    expect(getByTestId("more-settings-dark").props.children).toBe("dark-mode");
  });

  test("ProfileHero click navigates to Profile", () => {
    const { getByTestId } = renderWithAuth();
    const profileHero = getByTestId("profile-hero-mock");

    act(() => {
      fireEvent.press(profileHero);
    });

    expect(mockNavigate).toHaveBeenCalledWith("Profile");
  });

  test("LogoutButton click calls AuthContext's signOut", () => {
    const { getByTestId } = renderWithAuth();
    const logoutBtn = getByTestId("logout-button-mock");

    act(() => {
      fireEvent.press(logoutBtn);
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  test("Theme toggle calls ThemeContext's toggleTheme", () => {
    const { getByTestId } = renderWithAuth();
    const themeToggle = getByTestId("more-settings-theme-toggle");

    act(() => {
      fireEvent.press(themeToggle);
    });

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  test("MoreSettings item clicks: language opens LanguageSelector", () => {
    const { getByTestId, queryByTestId } = renderWithAuth();

    expect(queryByTestId("language-selector-mock")).toBeNull();

    act(() => {
      fireEvent.press(getByTestId("more-settings-lang-press"));
    });

    expect(getByTestId("language-selector-mock")).toBeTruthy();
  });

  test("MoreSettings item clicks: about displays Alert.alert", () => {
    const { getByTestId } = renderWithAuth();

    act(() => {
      fireEvent.press(getByTestId("more-settings-about-press"));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "more.aboutTitle",
      "more.aboutMessage",
      [{ text: "common.close", style: "cancel" }]
    );
  });

  test("MoreSettings item clicks: privacy calls Linking.openURL", () => {
    const { getByTestId } = renderWithAuth();

    act(() => {
      fireEvent.press(getByTestId("more-settings-privacy-press"));
    });

    expect(linkingSpy).toHaveBeenCalledWith(
      "https://www.privacypolicies.com/live/c9bcdecb-94c6-422f-a464-143a10f62e33"
    );
  });

  test("MoreSettings item clicks: other items call navigation.navigate", () => {
    const { getByTestId } = renderWithAuth();

    act(() => {
      fireEvent.press(getByTestId("more-settings-other-press"));
    });

    expect(mockNavigate).toHaveBeenCalledWith("Help", { from: "more" });
  });

  test("updates app notifications preference status when onAppNotificationsChange called", () => {
    const { getByTestId } = renderWithAuth();

    expect(getByTestId("more-settings-notifications").props.children).toBe(
      "notifications-enabled"
    );

    act(() => {
      fireEvent.press(getByTestId("more-settings-app-notifications-toggle"));
    });

    expect(getByTestId("more-settings-notifications").props.children).toBe(
      "notifications-disabled"
    );
  });

  test("LanguageSelector apply action works correctly", async () => {
    mockChangeLanguageHook.mockResolvedValueOnce({
      changedMessageKey: "language.enChanged",
    });

    const { getByTestId, getByText, queryByText } = renderWithAuth();

    // 1. Open LanguageSelector
    act(() => {
      fireEvent.press(getByTestId("more-settings-lang-press"));
    });

    // 2. Click Apply inside selector
    const applyBtn = getByTestId("language-selector-apply");
    await act(async () => {
      fireEvent.press(applyBtn);
    });

    // 3. Verifications
    expect(mockChangeLanguageHook).toHaveBeenCalledWith("en");
    expect(alertSpy).toHaveBeenCalledWith("language.alertTitle", "language.changed");

    // Toast shows up
    expect(getByText("translated_language.enChanged")).toBeTruthy();

    // 4. Clicking close button on the toast hides it
    const closeIcon = getByTestId("ionicons-close");
    act(() => {
      fireEvent.press(closeIcon);
    });

    // Toast is hidden
    expect(queryByText("translated_language.enChanged")).toBeNull();
  });

  test("languageToast is automatically dismissed after 2200ms", async () => {
    mockChangeLanguageHook.mockResolvedValueOnce({
      changedMessageKey: "language.enChanged",
    });

    const { getByTestId, getByText, queryByText } = renderWithAuth();

    act(() => {
      fireEvent.press(getByTestId("more-settings-lang-press"));
    });

    const applyBtn = getByTestId("language-selector-apply");
    await act(async () => {
      fireEvent.press(applyBtn);
    });

    expect(getByText("translated_language.enChanged")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2200);
    });

    expect(queryByText("translated_language.enChanged")).toBeNull();
  });
});
