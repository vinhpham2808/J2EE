jest.mock("react-native/Libraries/Utilities/Platform", () => {
  const platform = {
    OS: "android",
    select: (obj) => obj.android || obj.default,
  };
  return {
    __esModule: true,
    default: platform,
    ...platform,
  };
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    NavigationContainer: React.forwardRef(({ children, linking }, ref) => {
      React.useEffect(() => {
        if (ref) {
          const mockNav = {
            canGoBack: jest.fn(() => false),
            navigate: jest.fn(),
          };
          if (typeof ref === "function") {
            ref(mockNav);
          } else {
            ref.current = mockNav;
          }
        }
      }, [ref]);
      return React.createElement(View, { testID: "navigation-container" }, children);
    }),
  };
});

jest.mock("@react-navigation/native-stack", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => React.createElement("StackNavigator", null, children),
      Screen: ({ name }) => React.createElement("StackScreen", { name }),
    }),
  };
});

jest.mock("../../contexts/AuthContext", () => {
  const React = require("react");
  const AuthContext = React.createContext({
    user: null,
    isBootstrapping: true,
  });
  return {
    AuthContext,
    AuthProvider: ({ children, value }) =>
      React.createElement(AuthContext.Provider, { value }, children),
  };
});

jest.mock("../../screens/onboarding/OnboardingScreen", () => {
  const React = require("react");
  const OnboardingMock = () => null;
  OnboardingMock.ONBOARDING_KEY = "has_completed_onboarding_v1";
  return {
    __esModule: true,
    default: OnboardingMock,
    ONBOARDING_KEY: "has_completed_onboarding_v1",
  };
});

jest.mock("../../components/common/LoadingScreen", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ onComplete }) =>
    React.createElement(
      TouchableOpacity,
      { testID: "loading-screen", onPress: onComplete },
      React.createElement(Text, null, "LoadingScreen")
    );
});

jest.mock("../MainTabs", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => React.createElement(View, { testID: "main-tabs" });
});

// Auth Stack screens mocks
jest.mock("../../screens/auth/LoginScreen", () => () => null);
jest.mock("../../screens/auth/SignupScreen", () => () => null);
jest.mock("../../screens/auth/SetupProfileScreen", () => () => null);
jest.mock("../../screens/auth/CreatePasswordScreen", () => () => null);
jest.mock("../../screens/auth/ForgotPasswordScreen", () => () => null);
jest.mock("../../screens/auth/ForgotPasswordOtpScreen", () => () => null);
jest.mock("../../screens/auth/ResetPasswordScreen", () => () => null);
jest.mock("../../screens/auth/VerifyOtpScreen", () => () => null);

// Colors mock
jest.mock("../../constants/colors", () => ({
  COLORS: { DARK_TEXT: "#000" },
}));

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, BackHandler } from "react-native";
import AppNavigator from "../AppNavigator";
import { AuthContext } from "../../contexts/AuthContext";
import { appNavigationRef } from "../navigationRef";

describe("AppNavigator", () => {
  let backPressCallback = null;

  beforeEach(() => {
    jest.clearAllMocks();
    backPressCallback = null;
    appNavigationRef.current = null;

    // Spy on BackHandler & Alert
    jest.spyOn(BackHandler, "addEventListener").mockImplementation((event, cb) => {
      if (event === "hardwareBackPress") {
        backPressCallback = cb;
      }
      return { remove: jest.fn() };
    });
    jest.spyOn(BackHandler, "exitApp").mockImplementation(() => {});
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  const renderNavigator = (contextValue) => {
    return render(
      <AuthContext.Provider value={contextValue}>
        <AppNavigator />
      </AuthContext.Provider>
    );
  };

  it("renders LoadingScreen when bootstrapping", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    const { getByTestId } = renderNavigator({
      user: null,
      isBootstrapping: true,
    });

    expect(getByTestId("loading-screen")).toBeTruthy();

    await act(async () => {
      await Promise.resolve();
    });
  });

  it("renders LoadingScreen while onboarding status is being resolved", async () => {
    let resolveStoragePromise;
    AsyncStorage.getItem.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolveStoragePromise = resolve;
      });
    });

    const { getByTestId } = renderNavigator({
      user: null,
      isBootstrapping: false,
    });

    // Onboarding status is unresolved, so it renders LoadingScreen
    expect(getByTestId("loading-screen")).toBeTruthy();

    await act(async () => {
      resolveStoragePromise("1");
    });
  });

  it("renders AuthStack (login screen) when user is not logged in and onboarding resolved", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce("1"); // onboarding completed

    const { getByTestId, queryByTestId } = renderNavigator({
      user: null,
      isBootstrapping: false,
    });

    // Wait for the resolveOnboarding promise to resolve
    await act(async () => {
      await Promise.resolve();
    });

    // First renders loading screen due to isStartupDelayDone = false
    expect(getByTestId("loading-screen")).toBeTruthy();

    // Trigger splash completion
    await act(async () => {
      fireEvent.press(getByTestId("loading-screen"));
    });

    // Now loading screen should be gone, and navigation container should be rendered
    expect(queryByTestId("loading-screen")).toBeNull();
    expect(getByTestId("navigation-container")).toBeTruthy();
    expect(queryByTestId("main-tabs")).toBeNull();
  });

  it("renders MainTabs when user is logged in", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce("1");

    const { getByTestId, queryByTestId } = renderNavigator({
      user: { id: "123", email: "user@example.com" },
      isBootstrapping: false,
    });

    // Wait for resolveOnboarding promise to resolve
    await act(async () => {
      await Promise.resolve();
    });

    // Complete startup splash delay
    await act(async () => {
      fireEvent.press(getByTestId("loading-screen"));
    });

    expect(getByTestId("main-tabs")).toBeTruthy();
    expect(queryByTestId("loading-screen")).toBeNull();
  });

  describe("Android hardware back press behavior", () => {
    it("registers back press listener on mount", async () => {
      AsyncStorage.getItem.mockResolvedValueOnce("1");
      renderNavigator({
        user: { id: "123", email: "user@example.com" },
        isBootstrapping: false,
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(BackHandler.addEventListener).toHaveBeenCalledWith(
        "hardwareBackPress",
        expect.any(Function)
      );
    });

    it("does not intercept back press if navigation can go back", async () => {
      AsyncStorage.getItem.mockResolvedValueOnce("1");
      const { getByTestId } = renderNavigator({
        user: { id: "123", email: "user@example.com" },
        isBootstrapping: false,
      });

      // Wait for resolveOnboarding promise to resolve
      await act(async () => {
        await Promise.resolve();
      });

      // Complete startup delay to set up appNavigationRef
      await act(async () => {
        fireEvent.press(getByTestId("loading-screen"));
      });

      appNavigationRef.current.canGoBack = jest.fn(() => true);

      expect(backPressCallback).toBeTruthy();
      const handled = backPressCallback();
      // If it can go back, navigation will handle it (handled should be false)
      expect(handled).toBe(false);
    });

    it("triggers exit confirmation alert if navigation cannot go back", async () => {
      AsyncStorage.getItem.mockResolvedValueOnce("1");
      const { getByTestId } = renderNavigator({
        user: { id: "123", email: "user@example.com" },
        isBootstrapping: false,
      });

      // Wait for resolveOnboarding promise to resolve
      await act(async () => {
        await Promise.resolve();
      });

      // Complete startup delay to set up appNavigationRef
      await act(async () => {
        fireEvent.press(getByTestId("loading-screen"));
      });

      appNavigationRef.current.canGoBack = jest.fn(() => false);

      expect(backPressCallback).toBeTruthy();
      const handled = backPressCallback();
      // It should intercept (handled should be true) and show Alert
      expect(handled).toBe(true);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Thoát ứng dụng?",
        "Bạn có chắc chắn muốn thoát ứng dụng không?",
        expect.any(Array),
        expect.any(Object)
      );
    });

    it("exits app when user confirms exit on Alert dialog", async () => {
      AsyncStorage.getItem.mockResolvedValueOnce("1");
      const { getByTestId } = renderNavigator({
        user: { id: "123", email: "user@example.com" },
        isBootstrapping: false,
      });

      // Wait for resolveOnboarding promise to resolve
      await act(async () => {
        await Promise.resolve();
      });

      // Complete startup delay to set up appNavigationRef
      await act(async () => {
        fireEvent.press(getByTestId("loading-screen"));
      });

      appNavigationRef.current.canGoBack = jest.fn(() => false);

      backPressCallback();

      // Get the buttons passed to Alert.alert
      const alertButtons = Alert.alert.mock.calls[0][2];
      const exitButton = alertButtons.find((btn) => btn.text === "Thoát");
      expect(exitButton).toBeTruthy();

      // Trigger confirm press callback
      exitButton.onPress();

      expect(BackHandler.exitApp).toHaveBeenCalled();
    });
  });
});
