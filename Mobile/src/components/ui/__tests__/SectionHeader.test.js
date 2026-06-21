jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({ TEXT: "#111", PRIMARY: "#7C4DFF" }),
}));
jest.mock("../../../utils/layoutScale", () => ({ scale: (n) => n }));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SectionHeader from "../SectionHeader";

describe("SectionHeader", () => {
  it("renders title", () => {
    const { getByText } = render(<SectionHeader title="Giao dịch gần đây" />);
    expect(getByText("Giao dịch gần đây")).toBeTruthy();
  });

  it("renders action title when both actionTitle and onActionPress provided", () => {
    const { getByText } = render(
      <SectionHeader title="Title" actionTitle="Xem tất cả" onActionPress={jest.fn()} />
    );
    expect(getByText("Xem tất cả")).toBeTruthy();
  });

  it("does NOT render action when actionTitle is missing", () => {
    const { queryByText } = render(
      <SectionHeader title="Title" onActionPress={jest.fn()} />
    );
    expect(queryByText("Xem tất cả")).toBeNull();
  });

  it("does NOT render action when onActionPress is missing", () => {
    const { queryByText } = render(
      <SectionHeader title="Title" actionTitle="Xem tất cả" />
    );
    expect(queryByText("Xem tất cả")).toBeNull();
  });

  it("calls onActionPress when action is pressed", () => {
    const onActionPress = jest.fn();
    const { getByText } = render(
      <SectionHeader title="Title" actionTitle="Xem tất cả" onActionPress={onActionPress} />
    );
    fireEvent.press(getByText("Xem tất cả"));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });
});
