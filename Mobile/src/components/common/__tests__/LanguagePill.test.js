jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({ "language.alertTitle": "Ngôn ngữ", "language.changed": "Đã thay đổi ngôn ngữ" }[key] || key),
  }),
}));

jest.mock("../../../hooks/useLanguagePreference", () => () => ({
  languageCode: "vi",
  changeLanguage: jest.fn(),
}));

const mockLanguageInfo = { flag: "🇻🇳", shortLabel: "VN", label: "Tiếng Việt" };
jest.mock("../../../constants/languages", () => ({
  getLanguageInfo: () => mockLanguageInfo,
}));

jest.mock("../../../components/More/LanguageSelector", () => "LanguageSelector");

import React from "react";
import { render } from "@testing-library/react-native";
import LanguagePill from "../LanguagePill";

describe("LanguagePill", () => {
  test("renders flag and language label", () => {
    const { getByText } = render(<LanguagePill />);
    expect(getByText("VN")).toBeTruthy();
  });
});
