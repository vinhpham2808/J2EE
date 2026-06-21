import React from "react";
import { render, act } from "@testing-library/react-native";
import ProfileScreen from "../ProfileScreen";
import { AuthContext } from "../../../contexts/AuthContext";
import ScreenBackHeader from "../../../components/common/ScreenBackHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 1. Mock useSafeAreaInsets
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 40, bottom: 20, left: 0, right: 0 })),
}));

// 2. Mock AuthContext
jest.mock("../../../contexts/AuthContext", () => {
  const React = require("react");
  const AuthContext = React.createContext({ user: null });
  return {
    AuthContext,
  };
});

// 3. Mock useTranslation
jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(() => ({
    t: (key) => key,
  })),
}));

// 4. Mock ScreenBackHeader
jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return jest.fn(({ title }) => <Text testID="mock-screen-header">{title}</Text>);
});

// 5. Mock StatusBadge
jest.mock("../../../components/ui/StatusBadge", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return jest.fn(({ plan }) => <Text testID="mock-status-badge">Plan: {plan}</Text>);
});

// 6. Mock Ionicons
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: jest.fn(({ name }) => <Text testID={`mock-ionicons-${name}`}>{name}</Text>),
  };
});

// Mock useAppColors & COLORS
jest.mock("../../../constants/colors", () => ({
  COLORS: {
    WHITE: "#FFFFFF",
  },
  useAppColors: () => ({
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E0E0E0",
    TEXT: "#000000",
    TEXT_SECONDARY: "#666666",
    TEXT_MUTED: "#999999",
    PRIMARY: "#EF5E83",
    PRIMARY_LIGHT: "#FFEBF0",
  }),
}));

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Renders screen header and cards correctly", () => {
    const mockUser = {
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      subscriptionPlan: "PREMIUM",
      profileImageUrl: "",
    };

    const renderResult = render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <ProfileScreen />
      </AuthContext.Provider>
    );

    const { getByTestId, getByText, getAllByText, getAllByTestId } = renderResult;

    // Check screen header
    const screenHeader = getByTestId("mock-screen-header");
    expect(screenHeader).toBeTruthy();
    expect(screenHeader.props.children).toBe("finance.profile.title");

    // Check status badges (one in hero card, one in service plan group section)
    const statusBadges = getAllByTestId("mock-status-badge");
    expect(statusBadges.length).toBe(2);
    expect(statusBadges[0].props.children).toContain("PREMIUM");
    expect(statusBadges[1].props.children).toContain("PREMIUM");

    // Check section title texts from i18n keys
    expect(getByText("finance.profile.personalInfo")).toBeTruthy();
    expect(getByText("finance.profile.servicePlan")).toBeTruthy();

    // Check InfoRow labels and values
    expect(getByText("finance.profile.fullName")).toBeTruthy();
    expect(getAllByText("Jane Doe").length).toBeGreaterThan(0);
    expect(getByText("Email")).toBeTruthy();
    expect(getAllByText("jane.doe@example.com").length).toBeGreaterThan(0);
    expect(getByText("finance.profile.phone")).toBeTruthy();
    expect(getByText("finance.profile.notUpdated")).toBeTruthy();

    // Check Chevron icon in InfoRow
    expect(getByTestId("mock-ionicons-chevron-forward")).toBeTruthy();
  });

  test("Handles standard user state: renders avatar text (initial of fullName) if profileImageUrl is missing, renders fullName, email, and subscription plan badge", () => {
    const mockUser = {
      fullName: "Alice Smith",
      email: "alice@example.com",
      subscriptionPlan: "PRO",
      profileImageUrl: "",
    };

    const renderResult = render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <ProfileScreen />
      </AuthContext.Provider>
    );

    const { getByText, getAllByText, queryByTestId, getAllByTestId, UNSAFE_queryByType } = renderResult;

    // Renders initial letter of fullName
    expect(getByText("A")).toBeTruthy();

    // profileImageUrl is missing, so Image component shouldn't exist
    const image = UNSAFE_queryByType("Image");
    expect(image).toBeNull();

    // Renders user details
    expect(getAllByText("Alice Smith").length).toBeGreaterThan(0);
    expect(getAllByText("alice@example.com").length).toBeGreaterThan(0);

    // Renders subscription badges
    const statusBadges = getAllByTestId("mock-status-badge");
    expect(statusBadges[0].props.children).toContain("PRO");
  });

  test("Handles user state with profileImageUrl: renders Image component with uri source", () => {
    const mockUser = {
      fullName: "Bob Johnson",
      email: "bob@example.com",
      subscriptionPlan: "FREE",
      profileImageUrl: "https://example.com/bob.jpg",
    };

    const renderResult = render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <ProfileScreen />
      </AuthContext.Provider>
    );

    const { queryByText, UNSAFE_getByType } = renderResult;

    // Should NOT render avatar initial text "B"
    expect(queryByText("B")).toBeNull();

    // Should render Image component with the uri source
    const image = UNSAFE_getByType("Image");
    expect(image).toBeTruthy();
    expect(image.props.source).toEqual({ uri: "https://example.com/bob.jpg" });
  });

  test("Handles missing user details: displays anonymous fallbacks (profile.anonymousUser, profile.missingEmail)", () => {
    const renderResult = render(
      <AuthContext.Provider value={{ user: null }}>
        <ProfileScreen />
      </AuthContext.Provider>
    );

    const { getByText, getAllByText, getAllByTestId } = renderResult;

    // Renders fallbacks for fullName and email
    expect(getAllByText("profile.anonymousUser").length).toBeGreaterThan(0);
    expect(getAllByText("profile.missingEmail").length).toBeGreaterThan(0);

    // Renders avatar text initial of the fallback fullName ("p" from "profile.anonymousUser", capitalized to "P")
    expect(getByText("P")).toBeTruthy();

    // Renders default "FREE" subscription badge
    const statusBadges = getAllByTestId("mock-status-badge");
    expect(statusBadges[0].props.children).toContain("FREE");
  });
});
