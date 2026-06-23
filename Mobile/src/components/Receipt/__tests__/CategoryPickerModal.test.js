import React from "react";
import { create, act } from "react-test-renderer";
import { Modal, Pressable, Text } from "react-native";
import CategoryPickerModal from "../CategoryPickerModal";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    TEXT: "#000",
    TEXT_SECONDARY: "#555",
    PRIMARY: "#EF5E83",
    CARD: "#FFF",
    CARD_BORDER: "#E0E0E0",
    OVERLAY: "rgba(0,0,0,0.4)",
    ROSE_MIST: "rgba(239,94,131,0.08)",
  }),
}));

jest.mock("../../../utils/categoryIcons", () => ({
  CategoryVectorIcon: () => null,
  getIconColor: () => "#888",
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (n) => n,
}));

const sampleCategories = [
  { id: 1, name: "Food", icon: "food" },
  { id: 2, name: "Transport", icon: "transport" },
  { id: 3, name: "Health", icon: "health" },
];

const baseProps = {
  categories: sampleCategories,
  loading: false,
  onClose: jest.fn(),
  onSelect: jest.fn(),
  selectedId: null,
  visible: true,
};

describe("CategoryPickerModal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders Modal with visible=true", () => {
    let root;
    act(() => {
      root = create(<CategoryPickerModal {...baseProps} />);
    });
    const modal = root.root.findByType(Modal);
    expect(modal.props.visible).toBe(true);
  });

  it("passes visible=false to Modal when not visible", () => {
    let root;
    act(() => {
      root = create(<CategoryPickerModal {...baseProps} visible={false} />);
    });
    const modal = root.root.findByType(Modal);
    expect(modal.props.visible).toBe(false);
  });

  it("renders title and close button texts", () => {
    let root;
    act(() => {
      root = create(<CategoryPickerModal {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("categoryPickerModal.title");
    expect(texts).toContain("categoryPickerModal.close");
  });

  it("shows loading text when loading=true", () => {
    let root;
    act(() => {
      root = create(
        <CategoryPickerModal {...baseProps} loading={true} categories={[]} />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("categoryPickerModal.loading");
  });

  it("shows empty text when not loading and categories is empty", () => {
    let root;
    act(() => {
      root = create(
        <CategoryPickerModal {...baseProps} categories={[]} />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("categoryPickerModal.emptyExpense");
  });

  it("renders a pressable row for each category", () => {
    let root;
    act(() => {
      root = create(<CategoryPickerModal {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("Food");
    expect(texts).toContain("Transport");
    expect(texts).toContain("Health");
  });

  it("renders checkmark ✓ next to selected category", () => {
    let root;
    act(() => {
      root = create(<CategoryPickerModal {...baseProps} selectedId={2} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("✓");
  });

  it("does NOT render checkmark when no category is selected", () => {
    let root;
    act(() => {
      root = create(<CategoryPickerModal {...baseProps} selectedId={null} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).not.toContain("✓");
  });

  it("calls onSelect and onClose when a category row is pressed", () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    let root;
    act(() => {
      root = create(
        <CategoryPickerModal
          {...baseProps}
          onSelect={onSelect}
          onClose={onClose}
        />
      );
    });
    // Find pressables that correspond to category rows (skip overlay + close btn)
    const allPressables = root.root.findAllByType(Pressable);
    // overlay [0], close btn [1], category items [2+]
    act(() => {
      allPressables[2].props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith("1");
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when overlay is pressed", () => {
    const onClose = jest.fn();
    let root;
    act(() => {
      root = create(<CategoryPickerModal {...baseProps} onClose={onClose} />);
    });
    const allPressables = root.root.findAllByType(Pressable);
    act(() => {
      allPressables[0].props.onPress();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when close button is pressed", () => {
    const onClose = jest.fn();
    let root;
    act(() => {
      root = create(<CategoryPickerModal {...baseProps} onClose={onClose} />);
    });
    const allPressables = root.root.findAllByType(Pressable);
    act(() => {
      allPressables[1].props.onPress();
    });
    expect(onClose).toHaveBeenCalled();
  });
});
