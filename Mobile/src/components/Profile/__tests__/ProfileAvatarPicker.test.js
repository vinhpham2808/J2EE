import React from "react";
import { create, act } from "react-test-renderer";
import { Image, Pressable, Text } from "react-native";
import ProfileAvatarPicker from "../ProfileAvatarPicker";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {},
  useAppColors: () => ({
    TEXT: "#000",
    BG: "#FFF",
    CARD: "#FFF",
    CARD_BORDER: "#E0E0E0",
    PRIMARY: "#EF5E83",
    PRIMARY_LIGHT: "rgba(239,94,131,0.2)",
    EXPENSE: "#F44336",
  }),
}));

// Mock Ionicons
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Ionicons: ({ name }) => <View testID={`ionicon-${name}`} />,
  };
});

const baseProps = {
  fullName: "Nguyen Van A",
  onPickImage: jest.fn(),
  onRemoveImage: jest.fn(),
  previewUri: null,
};

describe("ProfileAvatarPicker", () => {
  beforeEach(() => jest.clearAllMocks());

  // ---- Placeholder state (no previewUri) ----
  it("renders first letter of fullName as placeholder when no previewUri", () => {
    let root;
    act(() => {
      root = create(<ProfileAvatarPicker {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("N");
  });

  it("renders 'U' when fullName is empty and no previewUri", () => {
    let root;
    act(() => {
      root = create(<ProfileAvatarPicker {...baseProps} fullName="" />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("U");
  });

  it("does NOT render Image when previewUri is null", () => {
    let root;
    act(() => {
      root = create(<ProfileAvatarPicker {...baseProps} previewUri={null} />);
    });
    const images = root.root.findAllByType(Image);
    expect(images.length).toBe(0);
  });

  it("does NOT render remove button when previewUri is null", () => {
    let root;
    act(() => {
      root = create(<ProfileAvatarPicker {...baseProps} previewUri={null} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).not.toContain("profileAvatar.removePhoto");
  });

  // ---- Preview state (with previewUri) ----
  it("renders Image with correct uri when previewUri is set", () => {
    let root;
    act(() => {
      root = create(
        <ProfileAvatarPicker {...baseProps} previewUri="https://example.com/avatar.png" />
      );
    });
    const image = root.root.findByType(Image);
    expect(image.props.source).toEqual({ uri: "https://example.com/avatar.png" });
  });

  it("renders remove photo button when previewUri is set", () => {
    let root;
    act(() => {
      root = create(
        <ProfileAvatarPicker {...baseProps} previewUri="https://example.com/avatar.png" />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("profileAvatar.removePhoto");
  });

  it("does NOT render placeholder letter when previewUri is set", () => {
    let root;
    act(() => {
      root = create(
        <ProfileAvatarPicker {...baseProps} previewUri="https://example.com/avatar.png" />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    // The initial letter "N" should not be present
    expect(texts).not.toContain("N");
  });

  // ---- Interactions ----
  it("calls onPickImage when camera button is pressed", () => {
    const onPickImage = jest.fn();
    let root;
    act(() => {
      root = create(<ProfileAvatarPicker {...baseProps} onPickImage={onPickImage} />);
    });
    act(() => {
      root.root.findByType(Pressable).props.onPress();
    });
    expect(onPickImage).toHaveBeenCalled();
  });

  it("calls onRemoveImage when remove button is pressed", () => {
    const onRemoveImage = jest.fn();
    let root;
    act(() => {
      root = create(
        <ProfileAvatarPicker
          {...baseProps}
          previewUri="https://example.com/avatar.png"
          onRemoveImage={onRemoveImage}
        />
      );
    });
    const pressables = root.root.findAllByType(Pressable);
    // Last pressable = remove button
    act(() => {
      pressables[pressables.length - 1].props.onPress();
    });
    expect(onRemoveImage).toHaveBeenCalled();
  });

  it("renders camera Ionicon inside the edit button", () => {
    let root;
    act(() => {
      root = create(<ProfileAvatarPicker {...baseProps} />);
    });
    const cameraIcon = root.root.findByProps({ testID: "ionicon-camera" });
    expect(cameraIcon).toBeTruthy();
  });
});
