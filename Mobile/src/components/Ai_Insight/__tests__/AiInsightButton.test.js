import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AiInsightButton from "../AiInsightButton";
jest.mock("../../../contexts/AuthContext", () => {
  const React = require("react");
  return {
    AuthContext: React.createContext({ user: null }),
  };
});
import { AuthContext } from "../../../contexts/AuthContext";

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    ROSE_MIST: "#FFE4EA",
    CARD_BORDER: "#F0E2E6",
    PRIMARY: "#EF5E83",
    GOLD: "#FFB84D",
  }),
  COLORS: {
    ROSE_MIST: "#FFE4EA",
    CARD_BORDER: "#F0E2E6",
    PRIMARY: "#EF5E83",
    GOLD: "#FFB84D",
  },
}));

describe("AiInsightButton", () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  const renderWithUser = (user, props = {}) => {
    return render(
      <AuthContext.Provider value={{ user }}>
        <AiInsightButton onPress={mockOnPress} {...props} />
      </AuthContext.Provider>
    );
  };

  test("renders AI text and icon", () => {
    const { getByText } = renderWithUser({ subscriptionPlan: "FREE" });
    expect(getByText("✨")).toBeTruthy();
    expect(getByText("AI")).toBeTruthy();
  });

  test("does not render premium gold dot for FREE user", () => {
    const { toJSON } = renderWithUser({
      subscriptionPlan: "FREE",
      subscriptionStatus: "INACTIVE",
    });

    const tree = toJSON();
    const labelWrap = tree.children[1];
    expect(labelWrap.children.length).toBe(1); // Only <Text>AI</Text>
  });

  test("renders premium gold dot for active PREMIUM user", () => {
    const { toJSON } = renderWithUser({
      subscriptionPlan: "PREMIUM",
      subscriptionStatus: "ACTIVE",
    });

    const tree = toJSON();
    const labelWrap = tree.children[1];
    expect(labelWrap.children.length).toBe(2); // <Text>AI</Text> and the proDot view
  });

  test("renders premium gold dot for active BASIC user", () => {
    const { toJSON } = renderWithUser({
      subscriptionPlan: "BASIC",
      subscriptionStatus: "ACTIVE",
    });

    const tree = toJSON();
    const labelWrap = tree.children[1];
    expect(labelWrap.children.length).toBe(2);
  });

  test("does not render gold dot for inactive PREMIUM user", () => {
    const { toJSON } = renderWithUser({
      subscriptionPlan: "PREMIUM",
      subscriptionStatus: "EXPIRED",
    });

    const tree = toJSON();
    const labelWrap = tree.children[1];
    expect(labelWrap.children.length).toBe(1);
  });

  test("calls onPress when button is pressed", () => {
    const { getByText } = renderWithUser({ subscriptionPlan: "FREE" });
    const button = getByText("AI");
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
