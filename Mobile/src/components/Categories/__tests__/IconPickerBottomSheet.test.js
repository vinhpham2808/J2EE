import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Pressable, Animated } from "react-native";
import IconPickerBottomSheet from "../IconPickerBottomSheet";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "iconPicker.subtitle": "Vui lòng chọn biểu tượng cho danh mục",
        "iconPicker.all": "Tất cả",
        "iconPicker.recent": "Gần đây",
        "iconPicker.emptyRecentTitle": "Chưa có biểu tượng gần đây",
        "iconPicker.emptyRecentText": "Hãy sử dụng một số biểu tượng trước",
        "iconPicker.done": "Xong",
      };
      if (key === "iconPicker.selectIcon") {
        return `Chọn ${options?.label}`;
      }
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
  },
}));

jest.mock("../../../utils/categoryIcons", () => {
  const React = require("react");
  return {
    CategoryVectorIcon: "CategoryVectorIcon",
    getIconLocaleKey: (icon) => `icon.${icon}`,
    getCategoryIconPresets: (type) => [
      { value: "food", label: "Ăn uống", color: "#FF0000" },
      { value: "shopping", label: "Mua sắm", color: "#00FF00" },
    ],
  };
});

describe("IconPickerBottomSheet", () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSelect: jest.fn(),
    selectedIcon: "food",
    type: "expense",
  };

  beforeEach(() => {
    defaultProps.onClose.mockClear();
    defaultProps.onSelect.mockClear();

    jest.spyOn(Animated, "parallel").mockImplementation((animations) => ({
      start: (callback) => {
        animations.forEach((anim) => anim.start());
        if (callback) callback({ finished: true });
      },
      stop: () => {},
    }));

    jest.spyOn(Animated, "spring").mockImplementation((value, config) => ({
      start: (callback) => {
        value.setValue(config.toValue);
        if (callback) callback({ finished: true });
      },
      stop: () => {},
    }));

    jest.spyOn(Animated, "timing").mockImplementation((value, config) => ({
      start: (callback) => {
        value.setValue(config.toValue);
        if (callback) callback({ finished: true });
      },
      stop: () => {},
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders header, summary, and tabs count correctly", () => {
    const { getByText } = render(<IconPickerBottomSheet {...defaultProps} />);

    expect(getByText("iconPicker.title")).toBeTruthy();
    expect(getByText("Vui lòng chọn biểu tượng cho danh mục")).toBeTruthy();
    expect(getByText("icon.food")).toBeTruthy(); // Selected icon label
    expect(getByText("Tất cả 2")).toBeTruthy(); // 2 items in preset list
    expect(getByText("Gần đây")).toBeTruthy();
    expect(getByText("Xong")).toBeTruthy();
  });

  test("renders all items inside FlatList", () => {
    const { getByLabelText } = render(<IconPickerBottomSheet {...defaultProps} />);

    // Renders the icon buttons using accessibility label
    expect(getByLabelText("Chọn Ăn uống")).toBeTruthy();
    expect(getByLabelText("Chọn Mua sắm")).toBeTruthy();
  });

  test("triggers onSelect when an icon option is clicked", () => {
    const { getByLabelText } = render(<IconPickerBottomSheet {...defaultProps} />);

    const shoppingIconBtn = getByLabelText("Chọn Mua sắm");
    fireEvent.press(shoppingIconBtn);

    expect(defaultProps.onSelect).toHaveBeenCalledWith("shopping");
  });

  test("adds selected icon to recent tab and can switch to it", () => {
    const { getByLabelText, getByText, queryByLabelText } = render(
      <IconPickerBottomSheet {...defaultProps} />
    );

    const shoppingBtn = getByLabelText("Chọn Mua sắm");
    fireEvent.press(shoppingBtn);
    expect(defaultProps.onSelect).toHaveBeenCalledWith("shopping");

    const recentTabBtn = getByText("Gần đây 1");
    fireEvent.press(recentTabBtn);

    expect(getByLabelText("Chọn Mua sắm")).toBeTruthy();
    expect(queryByLabelText("Chọn Ăn uống")).toBeNull();
  });

  test("triggers onClose when close, done, or backdrop buttons are pressed", () => {
    const { getByText } = render(<IconPickerBottomSheet {...defaultProps} />);

    // Close button "×"
    const closeBtn = getByText("×");
    fireEvent.press(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    // Done button
    const doneBtn = getByText("Xong");
    fireEvent.press(doneBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
