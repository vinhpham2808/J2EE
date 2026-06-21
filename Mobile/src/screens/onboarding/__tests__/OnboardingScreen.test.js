import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnboardingScreen, { ONBOARDING_KEY } from "../OnboardingScreen";

FlatList.prototype.scrollToIndex = jest.fn();

const mockReplace = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: (props) => React.createElement(View, props),
  };
});
jest.mock("../../../constants/colors", () => ({
  COLORS: {
    APP_BACKGROUND: "#FFFFFF",
    TEXT: "#000000",
    TEXT_SECONDARY: "#666666",
    BORDER: "#E0E0E0",
  },
  useAppColors: () => ({
    APP_BACKGROUND: "#FFFFFF",
    TEXT: "#000000",
    TEXT_SECONDARY: "#666666",
    BORDER: "#E0E0E0",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (x) => x,
  clampScale: (x) => x,
  useDynamicViewport: () => ({ width: 375 }),
}));

jest.mock("../../../components/ui/AppIcon", () => {
  const React = require("react");
  const { View } = require("react-native");
  return (props) => React.createElement(View, props);
});

jest.mock("../../../components/common/LanguagePill", () => {
  const React = require("react");
  const { View } = require("react-native");
  return (props) => React.createElement(View, props);
});

jest.mock("../../../assets/logo&banner/applogo.png", () => "applogo.png");

describe("OnboardingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders onboarding screen correctly", () => {
    const { getByText } = render(<OnboardingScreen />);

    // Skip text
    expect(getByText("onboarding.skip")).toBeTruthy();

    // First slide content
    expect(getByText("onboarding.slides.planTitle")).toBeTruthy();
    expect(getByText("onboarding.slides.planSubtitle")).toBeTruthy();

    // CTA Button
    expect(getByText("onboarding.continue")).toBeTruthy();
  });

  test("clicking skip button marks onboarding as done and replaces route with Login", async () => {
    const { getByText } = render(<OnboardingScreen />);

    await act(async () => {
      fireEvent.press(getByText("onboarding.skip"));
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(ONBOARDING_KEY, "1");
    expect(mockReplace).toHaveBeenCalledWith("Login");
  });

  test("clicking continue button advances slides and finishes onboarding on final slide", async () => {
    const { getByText, queryByText } = render(<OnboardingScreen />);

    // Slide 0: Wallet/Plan. CTA is Continue.
    expect(getByText("onboarding.continue")).toBeTruthy();
    
    // Slide 0 -> Slide 1
    await act(async () => {
      fireEvent.press(getByText("onboarding.continue"));
    });
    // Local index state advances to 1

    // Slide 1 -> Slide 2 (Last index)
    await act(async () => {
      fireEvent.press(getByText("onboarding.continue"));
    });
    // Local index state advances to 2 (Last Slide)

    // Now button text should be "Start" (onboarding.start)
    expect(queryByText("onboarding.continue")).toBeNull();
    expect(getByText("onboarding.start")).toBeTruthy();

    // Finish onboarding
    await act(async () => {
      fireEvent.press(getByText("onboarding.start"));
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(ONBOARDING_KEY, "1");
    expect(mockReplace).toHaveBeenCalledWith("Login");
  });

  test("onViewableItemsChanged callback changes the current slide index", () => {
    const { getByText, queryByText, UNSAFE_getByType } = render(<OnboardingScreen />);
    
    const { FlatList } = require("react-native");
    const flatList = UNSAFE_getByType(FlatList);

    // Initial dot status
    expect(getByText("onboarding.continue")).toBeTruthy();

    // Trigger FlatList item change (slide index to 1)
    act(() => {
      flatList.props.onViewableItemsChanged({
        viewableItems: [{ index: 1 }],
      });
    });

    // Trigger FlatList item change (slide index to 2 - last slide)
    act(() => {
      flatList.props.onViewableItemsChanged({
        viewableItems: [{ index: 2 }],
      });
    });

    expect(queryByText("onboarding.continue")).toBeNull();
    expect(getByText("onboarding.start")).toBeTruthy();
  });
});
