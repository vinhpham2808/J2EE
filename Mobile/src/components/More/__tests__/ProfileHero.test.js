import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ProfileHero from "../ProfileHero";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "profile.anonymousUser": "Người dùng ẩn danh",
        "profile.missingEmail": "Chưa thiết lập email",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    WHITE: "#FFFFFF",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    BG: "#F9F9FA",
    PRIMARY: "#EF5E83",
    PRIMARY_LIGHT: "#FFEBF0",
  }),
}));

jest.mock("../../ui/StatusBadge", () => "StatusBadge");

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }) => <Text>Icon: {name}</Text>,
  };
});

describe("ProfileHero", () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders user full name, email, and subscription badge correctly", () => {
    const mockUser = {
      fullName: "Nguyễn Văn A",
      email: "vana@gmail.com",
      subscriptionPlan: "PREMIUM",
    };

    const { getByText, UNSAFE_getByType } = render(
      <ProfileHero user={mockUser} onPress={mockOnPress} />
    );

    expect(getByText("Nguyễn Văn A")).toBeTruthy();
    expect(getByText("vana@gmail.com")).toBeTruthy();
    
    // StatusBadge is rendered with the plan "PREMIUM"
    const statusBadge = UNSAFE_getByType("StatusBadge");
    expect(statusBadge.props.plan).toBe("PREMIUM");
  });

  test("renders placeholder avatar initial when profileImageUrl is empty", () => {
    const mockUser = {
      fullName: "Nguyễn Văn A",
      email: "vana@gmail.com",
    };

    const { getByText, queryByType } = render(
      <ProfileHero user={mockUser} onPress={mockOnPress} />
    );

    // Initial letter "N" of "Nguyễn Văn A" should be displayed
    expect(getByText("N")).toBeTruthy();
  });

  test("renders Image with uri when profileImageUrl is provided", () => {
    const mockUser = {
      fullName: "Nguyễn Văn A",
      email: "vana@gmail.com",
      profileImageUrl: "https://example.com/avatar.png",
    };

    const { UNSAFE_getByType, queryByText } = render(
      <ProfileHero user={mockUser} onPress={mockOnPress} />
    );

    const image = UNSAFE_getByType("Image");
    expect(image.props.source).toEqual({ uri: "https://example.com/avatar.png" });
    expect(queryByText("N")).toBeNull(); // No text placeholder avatar
  });

  test("handles anonymous fallbacks when name or email is missing", () => {
    const { getByText } = render(
      <ProfileHero user={null} onPress={mockOnPress} />
    );

    expect(getByText("Người dùng ẩn danh")).toBeTruthy();
    expect(getByText("Chưa thiết lập email")).toBeTruthy();
    // Default initial letter of anonymous is "N" (since it starts with "N")
    expect(getByText("N")).toBeTruthy();
  });

  test("calls onPress callback when card is pressed", () => {
    const mockUser = {
      fullName: "Nguyễn Văn A",
      email: "vana@gmail.com",
    };

    const { getByText } = render(
      <ProfileHero user={mockUser} onPress={mockOnPress} />
    );

    fireEvent.press(getByText("Nguyễn Văn A"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
