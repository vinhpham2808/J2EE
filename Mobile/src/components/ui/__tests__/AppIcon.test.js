jest.mock("@expo/vector-icons/Ionicons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return (props) => React.createElement(View, { testID: "ionicon", ...props });
});

import React from "react";
import { create, act } from "react-test-renderer";
import AppIcon from "../AppIcon";

describe("AppIcon", () => {
  it("renders without crash", () => {
    let root;
    act(() => { root = create(<AppIcon name="home" />); });
    expect(root.toJSON()).toBeTruthy();
  });

  it("passes name prop to Ionicons", () => {
    let root;
    act(() => { root = create(<AppIcon name="settings-outline" />); });
    const icon = root.root.findByProps({ testID: "ionicon" });
    expect(icon.props.name).toBe("settings-outline");
  });

  it("uses default size=24 when size not provided", () => {
    let root;
    act(() => { root = create(<AppIcon name="home" />); });
    const icon = root.root.findByProps({ testID: "ionicon" });
    expect(icon.props.size).toBe(24);
  });

  it("uses custom size when provided", () => {
    let root;
    act(() => { root = create(<AppIcon name="home" size={32} />); });
    const icon = root.root.findByProps({ testID: "ionicon" });
    expect(icon.props.size).toBe(32);
  });

  it("passes color prop to Ionicons", () => {
    let root;
    act(() => { root = create(<AppIcon name="home" color="#FF0000" />); });
    const icon = root.root.findByProps({ testID: "ionicon" });
    expect(icon.props.color).toBe("#FF0000");
  });
});
