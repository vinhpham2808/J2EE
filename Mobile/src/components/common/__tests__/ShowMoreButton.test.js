jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { PRIMARY: "#E8597A" },
  useAppColors: () => ({ PRIMARY: "#E8597A" }),
}));

import React from "react";
import { render, fireEvent, act, renderHook } from "@testing-library/react-native";
import ShowMoreButton, { useVisibleItems } from "../ShowMoreButton";

describe("ShowMoreButton", () => {
  test("renders nothing when visible is false", () => {
    const { queryByRole } = render(<ShowMoreButton visible={false} onPress={jest.fn()} />);
    expect(queryByRole("button")).toBeNull();
  });

  test("renders view more label by default", () => {
    const { getByText } = render(<ShowMoreButton expanded={false} onPress={jest.fn()} />);
    expect(getByText("commonComponents.viewMore")).toBeTruthy();
  });

  test("renders view less label when expanded", () => {
    const { getByText } = render(<ShowMoreButton expanded onPress={jest.fn()} />);
    expect(getByText("commonComponents.viewLess")).toBeTruthy();
  });

  test("uses custom labels", () => {
    const { getByText } = render(<ShowMoreButton expanded={false} onPress={jest.fn()} moreLabel="Show more" lessLabel="Show less" />);
    expect(getByText("Show more")).toBeTruthy();
  });

  test("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<ShowMoreButton expanded={false} onPress={onPress} moreLabel="Show" />);
    fireEvent.press(getByText("Show"));
    expect(onPress).toHaveBeenCalled();
  });

  test("applies custom style", () => {
    const { getByText } = render(<ShowMoreButton expanded={false} onPress={jest.fn()} moreLabel="Show" style={{ margin: 10 }} />);
    expect(getByText("Show")).toBeTruthy();
  });
});

describe("useVisibleItems", () => {
  const items = [1, 2, 3, 4, 5];

  test("returns initial visible items", () => {
    const { result } = renderHook(() => useVisibleItems(items));
    expect(result.current.visibleItems).toEqual([1, 2, 3]);
    expect(result.current.canToggle).toBe(true);
    expect(result.current.expanded).toBe(false);
  });

  test("returns all items when expanded", () => {
    const { result } = renderHook(() => useVisibleItems(items));
    act(() => result.current.toggle());
    expect(result.current.visibleItems).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.expanded).toBe(true);
  });

  test("toggle expands and collapses", () => {
    const { result } = renderHook(() => useVisibleItems(items));
    act(() => result.current.toggle());
    expect(result.current.expanded).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.expanded).toBe(false);
    expect(result.current.visibleItems).toEqual([1, 2, 3]);
  });

  test("canToggle is false when initialCount >= items length", () => {
    const { result } = renderHook(() => useVisibleItems([1, 2], { initialCount: 5 }));
    expect(result.current.canToggle).toBe(false);
    expect(result.current.visibleItems).toEqual([1, 2]);
  });

  test("showMore increments visible count in incremental mode", () => {
    const { result } = renderHook(() => useVisibleItems(items, { initialCount: 2, step: 2, mode: "incremental" }));
    expect(result.current.visibleItems).toEqual([1, 2]);
    act(() => result.current.showMore());
    expect(result.current.visibleItems).toEqual([1, 2, 3, 4]);
    act(() => result.current.showMore());
    expect(result.current.visibleItems).toEqual([1, 2, 3, 4, 5]);
  });

  test("canShowMore returns true when more items available", () => {
    const { result } = renderHook(() => useVisibleItems(items, { initialCount: 2 }));
    expect(result.current.canShowMore).toBe(true);
  });

  test("resets when resetKey changes", () => {
    const { result, rerender } = renderHook(
      ({ resetKey }) => useVisibleItems(items, { initialCount: 2, resetKey }),
      { initialProps: { resetKey: "a" } }
    );
    act(() => result.current.toggle());
    expect(result.current.expanded).toBe(true);
    rerender({ resetKey: "b" });
    expect(result.current.expanded).toBe(false);
  });

  test("handles non-array items", () => {
    const { result } = renderHook(() => useVisibleItems(null));
    expect(result.current.visibleItems).toEqual([]);
    expect(result.current.canToggle).toBe(false);
  });
});
