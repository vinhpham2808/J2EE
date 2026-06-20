jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({ COLORS: { PRIMARY: "#E8597A", DARK_TEXT: "#1A0F14" } }));
jest.mock("../../../assets/logo&banner/loadingscreen.png", () => "loadingscreen.png");

import React from "react";
import { render, act } from "@testing-library/react-native";
import LoadingScreen from "../LoadingScreen";

jest.useFakeTimers();

describe("LoadingScreen", () => {
  afterAll(() => { jest.useRealTimers(); });

  test("renders progress bar", () => {
    const { getByText } = render(<LoadingScreen />);
    expect(getByText("loadingScreen.loading")).toBeTruthy();
  });

  test("calls onComplete when animation finishes", () => {
    const onComplete = jest.fn();
    render(<LoadingScreen onComplete={onComplete} />);
    act(() => { jest.advanceTimersByTime(2000); });
    expect(onComplete).toHaveBeenCalled();
  });

  test("displays percentage text", () => {
    const { getByText } = render(<LoadingScreen />);
    expect(getByText(/^\d+%$/)).toBeTruthy();
  });
});
