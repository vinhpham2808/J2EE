jest.mock("../services/authGoogleService", () => ({
  configureGoogleSignin: jest.fn(),
}));

jest.mock("../i18n", () => ({
  hydrateStoredLanguage: jest.fn(),
}));

jest.mock("../navigation/AppNavigator", () => () => null);

jest.mock("../contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }) => children,
  useTheme: () => ({ theme: "light", loaded: true }),
  THEME_MODES: { DARK: "dark", LIGHT: "light" },
}));

jest.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
}));

jest.mock("../contexts/AppAlertContext", () => ({
  AppAlertProvider: ({ children }) => children,
}));

import React from "react";
import { render } from "@testing-library/react-native";
import App from "../App";

describe("App", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<App />);
    expect(toJSON()).toBeTruthy();
  });
});
