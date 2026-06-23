jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BADGE_POSITIVE_BG: "#E8F5E9",
    BADGE_POSITIVE_FG: "#22C55E",
    BADGE_NEGATIVE_BG: "#FEECEC",
    BADGE_NEGATIVE_FG: "#EF4444",
    TEXT_MUTED: "#B8A6AC",
  }),
}));
jest.mock("../AppIcon", () => () => null);

import React from "react";
import { render } from "@testing-library/react-native";
import ChangeRateBadge from "../ChangeRateBadge";

describe("ChangeRateBadge", () => {
  // ─── Number value ────────────────────────────────────────────────────────────

  it("renders '+5.0%' for positive number 5", () => {
    const { getByText } = render(<ChangeRateBadge value={5} />);
    expect(getByText("+5.0%")).toBeTruthy();
  });

  it("renders '-3.2%' for negative number -3.2", () => {
    const { getByText } = render(<ChangeRateBadge value={-3.2} />);
    expect(getByText("-3.2%")).toBeTruthy();
  });

  it("renders '+0.0%' for zero", () => {
    const { getByText } = render(<ChangeRateBadge value={0} />);
    expect(getByText("+0.0%")).toBeTruthy();
  });

  // ─── String value ────────────────────────────────────────────────────────────

  it("prepends '+' for positive string without sign", () => {
    const { getByText } = render(<ChangeRateBadge value="10%" />);
    expect(getByText("+10%")).toBeTruthy();
  });

  it("keeps negative string as-is", () => {
    const { getByText } = render(<ChangeRateBadge value="-5%" />);
    expect(getByText("-5%")).toBeTruthy();
  });

  // ─── Label ───────────────────────────────────────────────────────────────────

  it("renders label when provided", () => {
    const { getByText } = render(<ChangeRateBadge value={5} label="vs last month" />);
    expect(getByText("vs last month")).toBeTruthy();
  });

  it("does NOT render label when label is undefined", () => {
    const { queryByText } = render(<ChangeRateBadge value={5} />);
    expect(queryByText("vs last month")).toBeNull();
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────────

  it("renders without crash when value is undefined", () => {
    const { toJSON } = render(<ChangeRateBadge value={undefined} />);
    expect(toJSON()).toBeTruthy();
  });
});
