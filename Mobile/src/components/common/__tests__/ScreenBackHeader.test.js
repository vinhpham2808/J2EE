jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({ TEXT: "#1A0F14" }),
}));
jest.mock("../../../utils/layoutScale", () => ({ scale: (v) => v }));

import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import ScreenBackHeader from "../ScreenBackHeader";

describe("ScreenBackHeader", () => {
  test("renders title", () => {
    const { getByText } = render(<ScreenBackHeader title="Settings" />);
    expect(getByText("Settings")).toBeTruthy();
  });

  test("renders right element when provided", () => {
    const { getByText } = render(<ScreenBackHeader title="Title" right={<Text>Save</Text>} />);
    expect(getByText("Save")).toBeTruthy();
  });

  test("applies custom style", () => {
    const { getByText } = render(<ScreenBackHeader title="Title" style={{ marginTop: 10 }} />);
    expect(getByText("Title")).toBeTruthy();
  });
});
