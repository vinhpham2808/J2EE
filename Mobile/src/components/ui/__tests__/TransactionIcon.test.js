jest.mock("../../../utils/categoryIcons", () => ({
  getIconColor: jest.fn(() => "#FF5722"),
  CategoryVectorIcon: () => null,
}));

import React from "react";
import { render } from "@testing-library/react-native";
import { create, act } from "react-test-renderer";
import { View } from "react-native";
import TransactionIcon from "../TransactionIcon";
import { getIconColor } from "../../../utils/categoryIcons";

describe("TransactionIcon", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crash", () => {
    const { toJSON } = render(<TransactionIcon iconValue="food" />);
    expect(toJSON()).toBeTruthy();
  });

  it("calls getIconColor when color prop is not provided", () => {
    render(<TransactionIcon iconValue="food" />);
    expect(getIconColor).toHaveBeenCalledWith("food");
  });

  it("does NOT call getIconColor when color prop is provided", () => {
    render(<TransactionIcon iconValue="food" color="#123456" />);
    expect(getIconColor).not.toHaveBeenCalled();
  });

  it("uses default containerSize=40 when not specified", () => {
    let root;
    act(() => { root = create(<TransactionIcon iconValue="food" />); });
    const container = root.root.findByType(View);
    const styleArr = container.props.style;
    const flat = [].concat(styleArr);
    const sizeStyle = flat.find((s) => s && s.width !== undefined);
    expect(sizeStyle.width).toBe(40);
    expect(sizeStyle.height).toBe(40);
  });

  it("uses custom containerSize when provided", () => {
    let root;
    act(() => { root = create(<TransactionIcon iconValue="food" containerSize={60} />); });
    const container = root.root.findByType(View);
    const styleArr = container.props.style;
    const flat = [].concat(styleArr);
    const sizeStyle = flat.find((s) => s && s.width !== undefined);
    expect(sizeStyle.width).toBe(60);
    expect(sizeStyle.height).toBe(60);
  });
});
