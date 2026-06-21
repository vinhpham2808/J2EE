import React from "react";
import { render } from "@testing-library/react-native";
import PaymentCheckoutHeader from "../PaymentCheckoutHeader";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "paymentCheckoutHeader.description": "Vui lòng quét mã QR bên dưới để thực hiện thanh toán.",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
  }),
}));

describe("PaymentCheckoutHeader", () => {
  test("renders checkout header details correctly", () => {
    const { getByText } = render(<PaymentCheckoutHeader title="Thanh toán Premium" />);

    expect(getByText("Thanh toán Premium")).toBeTruthy();
    expect(getByText("Vui lòng quét mã QR bên dưới để thực hiện thanh toán.")).toBeTruthy();
  });
});
