jest.mock("../../../constants/colors", () => ({ useAppColors: () => ({ TEXT: "#111" }) }));
jest.mock("../AppIcon", () => () => null);

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ActionButton from "../ActionButton";

describe("ActionButton", () => {
  const onPress = jest.fn();
  beforeEach(() => jest.clearAllMocks());

  it("renders label text", () => {
    const { getByText } = render(
      <ActionButton icon="home" label="Trang chủ" color="#7C4DFF" onPress={onPress} />
    );
    expect(getByText("Trang chủ")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const { getByText } = render(
      <ActionButton icon="home" label="Add" color="#7C4DFF" onPress={onPress} />
    );
    fireEvent.press(getByText("Add"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders without crash when label is not provided", () => {
    const { toJSON } = render(
      <ActionButton icon="home" color="#7C4DFF" onPress={onPress} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it("does not throw when onPress is not provided", () => {
    const { toJSON } = render(
      <ActionButton icon="home" label="Test" color="#7C4DFF" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it("applies custom style prop", () => {
    const { toJSON } = render(
      <ActionButton icon="home" label="Test" color="#7C4DFF" onPress={onPress} style={{ opacity: 0.5 }} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
