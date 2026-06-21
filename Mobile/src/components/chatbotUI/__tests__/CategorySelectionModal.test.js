import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CategorySelectionModal from "../CategorySelectionModal";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "categorySelectionModal.title": "Chọn danh mục",
        "categorySelectionModal.empty": "Không tìm thấy danh mục",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    ROSE_MIST: "#FFE4EA",
    INCOME: "#4CDAD9",
    OVERLAY: "rgba(0,0,0,0.5)",
  },
  useAppColors: () => ({
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    ROSE_MIST: "#FFE4EA",
    INCOME: "#4CDAD9",
    OVERLAY: "rgba(0,0,0,0.5)",
  }),
}));

describe("CategorySelectionModal", () => {
  const mockClose = jest.fn();
  const mockSelect = jest.fn();
  const categories = [
    { id: 1, name: "Ăn uống", icon: "🍔" },
    { id: 2, name: "Mua sắm", icon: "🛍️" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly when visible", () => {
    const { getByText } = render(
      <CategorySelectionModal
        visible={true}
        categories={categories}
        onClose={mockClose}
        onSelect={mockSelect}
      />
    );

    expect(getByText("Chọn danh mục")).toBeTruthy();
    expect(getByText("Ăn uống")).toBeTruthy();
    expect(getByText("🍔")).toBeTruthy();
    expect(getByText("Mua sắm")).toBeTruthy();
    expect(getByText("🛍️")).toBeTruthy();
  });

  test("triggers onSelect when a category is pressed", () => {
    const { getByText } = render(
      <CategorySelectionModal
        visible={true}
        categories={categories}
        onClose={mockClose}
        onSelect={mockSelect}
      />
    );

    fireEvent.press(getByText("Ăn uống"));
    expect(mockSelect).toHaveBeenCalledWith("Ăn uống");
  });

  test("triggers onClose when close button is pressed", () => {
    const { getByText } = render(
      <CategorySelectionModal
        visible={true}
        categories={categories}
        onClose={mockClose}
        onSelect={mockSelect}
      />
    );

    fireEvent.press(getByText("✕"));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  test("renders empty placeholder when no categories provided", () => {
    const { getByText } = render(
      <CategorySelectionModal
        visible={true}
        categories={[]}
        onClose={mockClose}
        onSelect={mockSelect}
      />
    );

    expect(getByText("Không tìm thấy danh mục")).toBeTruthy();
  });
});
