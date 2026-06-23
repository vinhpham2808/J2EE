jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({ SURFACE: "#FFF", CARD_BORDER: "#EEE" }),
}));
jest.mock("../../../utils/layoutScale", () => ({ scale: (n) => n }));

import React from "react";
import { render } from "@testing-library/react-native";
import LoadingCard from "../LoadingCard";

describe("LoadingCard", () => {
  it("renders without crash", () => {
    const { toJSON } = render(<LoadingCard />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with custom style prop without crash", () => {
    const { toJSON } = render(<LoadingCard style={{ marginTop: 10 }} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders the shimmer card container", () => {
    const { toJSON } = render(<LoadingCard />);
    // Should render a valid element tree
    const json = toJSON();
    expect(json).not.toBeNull();
    expect(json.type).toBeTruthy();
  });
});
