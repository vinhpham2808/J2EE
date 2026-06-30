jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    GOLD: "#FFB84D",
    INFO: "#6B9DD2",
    TEXT_MUTED: "#B8A6AC",
    TEXT_SECONDARY: "#666",
  }),
}));
jest.mock("../../../utils/layoutScale", () => ({ scale: (n) => n }));

import React from "react";
import { render } from "@testing-library/react-native";
import StatusBadge from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders 'FREE' by default", () => {
    const { getByText } = render(<StatusBadge />);
    expect(getByText("FREE")).toBeTruthy();
  });

  it("renders 'PREMIUM' when plan='PREMIUM'", () => {
    const { getByText } = render(<StatusBadge plan="PREMIUM" />);
    expect(getByText("PREMIUM")).toBeTruthy();
  });

  it("renders 'BASIC' when plan='BASIC'", () => {
    const { getByText } = render(<StatusBadge plan="BASIC" />);
    expect(getByText("BASIC")).toBeTruthy();
  });

  it("renders 'FREE' for lowercase plan='free' (toUpperCase normalization)", () => {
    const { getByText } = render(<StatusBadge plan="free" />);
    expect(getByText("FREE")).toBeTruthy();
  });

  it("renders 'PREMIUM' for lowercase plan='premium'", () => {
    const { getByText } = render(<StatusBadge plan="premium" />);
    expect(getByText("PREMIUM")).toBeTruthy();
  });

  it("renders 'FREE' when plan is undefined", () => {
    const { getByText } = render(<StatusBadge plan={undefined} />);
    expect(getByText("FREE")).toBeTruthy();
  });
});
