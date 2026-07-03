import React from "react";
import { render } from "@testing-library/react-native";
import PasswordRequirement from "../PasswordRequirement";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "auth.password.mustContain": "PHẢI CHỨA",
        "auth.password.oneNumber": "Ít nhất 1 chữ số",
        "auth.password.oneUppercase": "Ít nhất 1 chữ in hoa",
        "auth.password.oneLowercase": "Ít nhất 1 chữ in thường",
        "auth.password.oneSpecial": "Ít nhất 1 ký tự đặc biệt",
        "auth.password.eightChars": "Ít nhất 8 ký tự",
        "auth.password.mustNotContain": "KHÔNG ĐƯỢC CHỨA",
        "auth.password.over256": "Quá 256 ký tự",
        "auth.password.personalInfo": "Thông tin cá nhân",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => {
  const COLORS = {
    DARK_TEXT_SECONDARY: "#d3c3bd",
    INCOME: "#2A9D8F",
    DARK_TEXT: "#f3eeeb",
  };
  return {
    COLORS,
    useAppColors: () => ({
      TEXT: COLORS.DARK_TEXT,
      TEXT_SECONDARY: COLORS.DARK_TEXT_SECONDARY,
    }),
  };
});

describe("PasswordRequirement", () => {
  const defaultReq = {
    hasNumber: false,
    hasUppercase: false,
    hasLowercase: false,
    hasSpecial: false,
    hasMinLength: false,
    notTooLong: true,
  };

  test("renders all mustContain requirements with default met states", () => {
    const { getByText, getAllByText } = render(
      <PasswordRequirement req={defaultReq} />
    );

    expect(getByText("PHẢI CHỨA")).toBeTruthy();
    expect(getByText("KHÔNG ĐƯỢC CHỨA")).toBeTruthy();
    expect(getByText("Ít nhất 1 chữ số")).toBeTruthy();
    expect(getByText("Ít nhất 1 chữ in hoa")).toBeTruthy();
    expect(getByText("Ít nhất 1 chữ in thường")).toBeTruthy();
    expect(getByText("Ít nhất 1 ký tự đặc biệt")).toBeTruthy();
    expect(getByText("Ít nhất 8 ký tự")).toBeTruthy();
    expect(getByText("Quá 256 ký tự")).toBeTruthy();

    // Verify bullets count (6 total: 5 in mustContain, 1 in mustNotContain)
    expect(getAllByText("●").length).toBe(6);
  });

  test("applies met styling when requirement is satisfied", () => {
    const satisfiedReq = {
      ...defaultReq,
      hasNumber: true,
      hasUppercase: true,
    };

    const { getByText, getAllByText } = render(
      <PasswordRequirement req={satisfiedReq} />
    );

    const numLabel = getByText("Ít nhất 1 chữ số");
    const upperLabel = getByText("Ít nhất 1 chữ in hoa");
    const lowerLabel = getByText("Ít nhất 1 chữ in thường");

    // The text style for met is DARK_TEXT (#f3eeeb), unmet is DARK_TEXT_SECONDARY (#d3c3bd)
    expect(numLabel.props.style).toContainEqual(expect.objectContaining({ color: "#f3eeeb" }));
    expect(upperLabel.props.style).toContainEqual(expect.objectContaining({ color: "#f3eeeb" }));
    expect(lowerLabel.props.style).toContainEqual(expect.objectContaining({ color: "#d3c3bd" }));
  });

  test("renders extra personalInfo warning and uses extraMet if provided", () => {
    const extraMet = {
      notTooLong: true,
      noPersonalInfo: false,
    };

    const { getByText, getAllByText } = render(
      <PasswordRequirement req={defaultReq} extraMet={extraMet} />
    );

    expect(getByText("Thông tin cá nhân")).toBeTruthy();
    expect(getAllByText("●").length).toBe(7);

    const personalInfoLabel = getByText("Thông tin cá nhân");
    expect(personalInfoLabel.props.style).toContainEqual(expect.objectContaining({ color: "#d3c3bd" }));
  });
});
