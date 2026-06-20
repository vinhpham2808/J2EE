jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { PRIMARY: "#E8597A", CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", TEXT_SECONDARY: "#999", BG: "#F5F5F5", WHITE: "#FFF", ROSE_MIST: "#FFE4E9" },
  useAppColors: () => ({ PRIMARY: "#E8597A", CARD: "#FFF", CARD_BORDER: "#EEE", TEXT: "#333", TEXT_SECONDARY: "#999", BG: "#F5F5F5", WHITE: "#FFF", ROSE_MIST: "#FFE4E9" }),
}));
jest.mock("../../../utils/categoryIcons", () => ({
  CategoryVectorIcon: ({ iconValue, size, color }) => null,
  getIconColor: jest.fn(() => "#E8597A"),
}));

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import CategoryGridSelector from "../CategoryGridSelector";

describe("CategoryGridSelector", () => {
  const categories = [
    { id: 1, name: "Food", icon: "fast-food", color: "#FF6B6B" },
    { id: 2, name: "Transport", icon: "car", color: "#4ECDC4" },
    { id: 3, name: "Shopping", icon: "cart", color: "#FFB84D" },
  ];

  test("renders label and placeholder when no selection", () => {
    const { getByText } = render(<CategoryGridSelector categories={categories} label="Category" />);
    expect(getByText("Category")).toBeTruthy();
    expect(getByText("categoryGridSelector.placeholder")).toBeTruthy();
  });

  test("renders selected category name", () => {
    const { getByText, queryByText } = render(<CategoryGridSelector categories={categories} selectedId={1} />);
    expect(getByText("Food")).toBeTruthy();
    expect(queryByText("categoryGridSelector.placeholder")).toBeNull();
  });

  test("shows loading state", () => {
    const { getByText } = render(<CategoryGridSelector loading />);
    expect(getByText("categoryGridSelector.loading")).toBeTruthy();
  });

  test("opens modal on press", () => {
    const { getByText } = render(<CategoryGridSelector categories={categories} label="Cat" />);
    fireEvent.press(getByText("Cat"));
    expect(getByText("categoryGridSelector.title")).toBeTruthy();
  });

  test("displays all categories in modal", () => {
    const { getByText } = render(<CategoryGridSelector categories={categories} label="Cat" />);
    fireEvent.press(getByText("Cat"));
    expect(getByText("Food")).toBeTruthy();
    expect(getByText("Transport")).toBeTruthy();
    expect(getByText("Shopping")).toBeTruthy();
  });

  test("selects category from modal", () => {
    const onSelect = jest.fn();
    const { getByText, queryByText } = render(<CategoryGridSelector categories={categories} label="Cat" onSelect={onSelect} />);
    fireEvent.press(getByText("Cat"));
    fireEvent.press(getByText("Food"));
    expect(onSelect).toHaveBeenCalledWith("1");
    expect(queryByText("categoryGridSelector.title")).toBeNull();
  });

  test("filters categories by search text", () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<CategoryGridSelector categories={categories} label="Cat" />);
    fireEvent.press(getByText("Cat"));
    const input = getByPlaceholderText("categoryGridSelector.searchPlaceholder");
    fireEvent.changeText(input, "Foo");
    expect(getByText("Food")).toBeTruthy();
    expect(queryByText("Transport")).toBeNull();
  });

  test("shows empty text when no categories match", () => {
    const { getByText, getByPlaceholderText } = render(<CategoryGridSelector categories={categories} label="Cat" emptyText="Nothing here" />);
    fireEvent.press(getByText("Cat"));
    const input = getByPlaceholderText("categoryGridSelector.searchPlaceholder");
    fireEvent.changeText(input, "ZZZZ");
    expect(getByText("Nothing here")).toBeTruthy();
  });

  test("shows recent categories", () => {
    const { getByText } = render(<CategoryGridSelector categories={categories} label="Cat" recentIds={[1, 2]} />);
    fireEvent.press(getByText("Cat"));
    expect(getByText("categoryGridSelector.recentTitle")).toBeTruthy();
  });

  test("calls onCreateNew when create button pressed", () => {
    const onCreateNew = jest.fn();
    const { getByText } = render(<CategoryGridSelector categories={categories} label="Cat" onCreateNew={onCreateNew} />);
    fireEvent.press(getByText("Cat"));
    fireEvent.press(getByText("categoryGridSelector.createNew"));
    expect(onCreateNew).toHaveBeenCalled();
  });

  test("closes modal on backdrop press", () => {
    const { getByText, queryByText } = render(<CategoryGridSelector categories={categories} label="Cat" />);
    fireEvent.press(getByText("Cat"));
    expect(queryByText("categoryGridSelector.title")).toBeTruthy();
  });

  test("clears search on clear button", () => {
    const { getByText, getByPlaceholderText } = render(<CategoryGridSelector categories={categories} label="Cat" />);
    fireEvent.press(getByText("Cat"));
    const input = getByPlaceholderText("categoryGridSelector.searchPlaceholder");
    fireEvent.changeText(input, "Foo");
  });

  test("highlighted prop applies highlight style", () => {
    const { getByText } = render(<CategoryGridSelector categories={categories} label="Category" highlighted hintText="Pick one" />);
    expect(getByText("Pick one")).toBeTruthy();
  });

  test("shows chevron when highlighted", () => {
    const { getByText } = render(<CategoryGridSelector categories={categories} label="Cat" highlighted />);
    fireEvent.press(getByText("Cat"));
  });
});
