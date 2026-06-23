import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Linking } from "react-native";
import HelpScreen from "../HelpScreen";

// 1. Mock hook useSafeAreaInsets
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 20,
    bottom: 30,
    left: 0,
    right: 0,
  })),
}));

// 2. Mock hook useTranslation
jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => key),
  })),
}));

// 3. Mock hook useAppColors relative to this directory
jest.mock("../../../constants/colors", () => ({
  useAppColors: jest.fn(() => ({
    BG: "#FFF5F7",
    CARD: "#FFFFFF",
    CARD_BORDER: "#F0E2E6",
    TEXT: "#1A0F14",
    ACTION_VOICE: "#A855F7",
    TEXT_MUTED: "#B8A6AC",
  })),
}));

// 4. Mock Ionicons component
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: jest.fn(({ name }) => <Text testID={`mock-icon-${name}`}>{name}</Text>),
  };
});

// 5. Mock ScreenBackHeader relative to this directory
jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return jest.fn(({ title }) => <Text testID="mock-header">{title}</Text>);
});

// 6. Mock Linking from react-native
jest.mock("react-native", () => {
  const rn = jest.requireActual("react-native");
  rn.Linking = {
    ...rn.Linking,
    openURL: jest.fn(() => Promise.resolve(true)),
  };
  return rn;
});

describe("HelpScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with header and list items", () => {
    const { getByText, getByTestId } = render(<HelpScreen />);

    // Test that the ScreenBackHeader renders correctly
    expect(getByTestId("mock-header")).toBeTruthy();
    expect(getByText("help.title")).toBeTruthy();

    // Test that the list items (website, followFacebook) render correctly
    expect(getByText("help.website")).toBeTruthy();
    expect(getByText("help.followFacebook")).toBeTruthy();
  });

  it("triggers Linking.openURL with correct website URL when clicked", async () => {
    const { getByText } = render(<HelpScreen />);

    const websiteRow = getByText("help.website");

    await act(async () => {
      fireEvent.press(websiteRow);
    });

    expect(Linking.openURL).toHaveBeenCalledWith("https://moneymanager.example.com");
  });

  it("triggers Linking.openURL with correct followFacebook URL when clicked", async () => {
    const { getByText } = render(<HelpScreen />);

    const facebookRow = getByText("help.followFacebook");

    await act(async () => {
      fireEvent.press(facebookRow);
    });

    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://www.facebook.com/profile.php?id=61579017999960"
    );
  });
});
