import React from "react";
import { render } from "@testing-library/react-native";
import CategoryListHeader from "../CategoryListHeader";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "recentCategories.title": "Danh mục gần đây",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    TEXT: "#1A0F14",
  },
  useAppColors: () => ({
    TEXT: "#1A0F14",
  }),
}));

jest.mock("../../common/ShowMoreButton", () => "ShowMoreButton");

describe("CategoryListHeader", () => {
  const defaultProps = {
    canExpand: true,
    hasCategories: true,
    onToggle: jest.fn(),
    showAll: false,
  };

  test("renders null when hasCategories is false", () => {
    const { toJSON } = render(
      <CategoryListHeader {...defaultProps} hasCategories={false} />
    );
    expect(toJSON()).toBeNull();
  });

  test("renders title and ShowMoreButton when hasCategories is true", () => {
    const { getByText, UNSAFE_getByType } = render(
      <CategoryListHeader {...defaultProps} />
    );

    expect(getByText("Danh mục gần đây")).toBeTruthy();

    const showMore = UNSAFE_getByType("ShowMoreButton");
    expect(showMore.props.visible).toBe(true);
    expect(showMore.props.expanded).toBe(false);
  });
});
