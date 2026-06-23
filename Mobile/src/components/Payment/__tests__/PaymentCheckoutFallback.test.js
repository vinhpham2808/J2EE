import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PaymentCheckoutFallback from "../PaymentCheckoutFallback";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    WHITE: "#FFFFFF",
  },
  useAppColors: () => ({
    BG: "#F9F9FA",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    PRIMARY: "#EF5E83",
  }),
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: (insets) => insets.top,
}));

jest.mock("../../common/ScreenBackHeader", () => "ScreenBackHeader");

describe("PaymentCheckoutFallback", () => {
  test("renders fallback body text and handles back pressed callback", () => {
    const mockOnBack = jest.fn();
    const { getByText } = render(<PaymentCheckoutFallback onBackToPayment={mockOnBack} />);

    expect(getByText("Không tìm thấy liên kết thanh toán")).toBeTruthy();
    expect(getByText("Hãy quay lại và tạo giao dịch mới.")).toBeTruthy();

    const backBtn = getByText("Quay lại thanh toán");
    expect(backBtn).toBeTruthy();

    fireEvent.press(backBtn);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
