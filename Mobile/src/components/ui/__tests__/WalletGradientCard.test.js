jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, colors, ...props }) =>
      React.createElement(View, { testID: "gradient", ...props }, children),
  };
});
jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    WALLET_GRADIENT_START: "#7C4DFF",
    WALLET_GRADIENT_END: "#4FACFE",
  }),
}));

import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import WalletGradientCard from "../WalletGradientCard";

describe("WalletGradientCard", () => {
  it("renders children inside the gradient card", () => {
    const { getByText } = render(
      <WalletGradientCard><Text>Balance</Text></WalletGradientCard>
    );
    expect(getByText("Balance")).toBeTruthy();
  });

  it("renders the gradient container", () => {
    const { getByTestId } = render(
      <WalletGradientCard><Text>Content</Text></WalletGradientCard>
    );
    expect(getByTestId("gradient")).toBeTruthy();
  });

  it("renders without crash when no children provided", () => {
    const { toJSON } = render(<WalletGradientCard />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders without crash when no gradientColors provided (uses defaults)", () => {
    const { toJSON } = render(
      <WalletGradientCard><Text>Default</Text></WalletGradientCard>
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders without crash with custom gradientColors", () => {
    const { toJSON } = render(
      <WalletGradientCard gradientColors={["#FF0000", "#0000FF"]}>
        <Text>Custom</Text>
      </WalletGradientCard>
    );
    expect(toJSON()).toBeTruthy();
  });
});
