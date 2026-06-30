import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import JarTransferView from "../JarTransferView";
import apiClient from "../../../services/apiClient";

const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "jarTransfer.title": "Chuyển tiền giữa các hũ",
        "jarTransfer.description": "Chọn hũ nguồn và hũ đích để chuyển tiền.",
        "jarTransfer.fromLabel": "Từ hũ",
        "jarTransfer.toLabel": "Đến hũ",
        "jarTransfer.fromPlaceholder": "Chọn hũ nguồn",
        "jarTransfer.toPlaceholder": "Chọn hũ đích",
        "jarTransfer.availableBalance": "Số dư khả dụng: ",
        "jarTransfer.amountLabel": "Số tiền chuyển",
        "jarTransfer.amountPlaceholder": "Nhập số tiền...",
        "jarTransfer.transfer": "Chuyển tiền",
        "jarTransfer.transferring": "Đang chuyển...",
        "jarTransfer.modalFromTitle": "Chọn hũ nguồn",
        "jarTransfer.modalToTitle": "Chọn hũ đích",
        "jarTransfer.close": "Đóng",
        "jarTransfer.balance": "Số dư: ",
        "jarTransfer.emptyList": "Không có hũ nào.",
        "jarTransfer.missingFromTitle": "Thiếu hũ nguồn",
        "jarTransfer.missingFromMsg": "Vui lòng chọn hũ nguồn.",
        "jarTransfer.missingToTitle": "Thiếu hũ đích",
        "jarTransfer.missingToMsg": "Vui lòng chọn hũ đích.",
        "jarTransfer.sameJarTitle": "Trùng hũ",
        "jarTransfer.sameJarMsg": "Hũ nguồn và hũ đích không được trùng nhau.",
        "jarTransfer.invalidAmountTitle": "Số tiền không hợp lệ",
        "jarTransfer.invalidAmountMsg": "Vui lòng nhập số tiền lớn hơn 0.",
        "jarTransfer.insufficientTitle": "Số dư không đủ",
        "jarTransfer.insufficientMsg": `Số dư của hũ nguồn không đủ để thực hiện chuyển khoản.`,
        "jarTransfer.successTitle": "Chuyển tiền thành công",
        "jarTransfer.successMsg": `Chuyển thành công số tiền ${options?.amount} từ hũ ${options?.from} sang hũ ${options?.to}.`,
        "jarTransfer.failTitle": "Lỗi",
        "jarTransfer.failMsg": "Chuyển tiền thất bại.",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../services/apiClient", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    BG: "#F9F9FA",
    PRIMARY: "#8B5CF6",
    ROSE_MIST: "#FFE4E9",
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatCurrencyInput: (val) => val.replace(/[^\d]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, "."),
  parseCurrencyInput: (val) => Number(val.replace(/[^\d]/g, "")),
  getApiErrorMessage: (err, fallback) => err?.response?.data?.message || err?.message || fallback,
}));

jest.mock("../../../utils/jar", () => ({
  formatJarMoney: (val) => `${val} VND`,
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: (insets) => insets.top,
  getSafeAreaBottom: (insets) => insets.bottom,
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

jest.mock("../../ui/AppIcon", () => "AppIcon");
jest.mock("../../common/ScreenBackHeader", () => "ScreenBackHeader");

describe("JarTransferView", () => {
  const mockJarsData = [
    { id: 1, name: "Ví tổng", currentBalance: 5000000, icon: "💳", color: "#8B5CF6" },
    { id: 2, name: "Tiết kiệm", currentBalance: 1000000, icon: "🐖", color: "#10B981" },
    { id: 3, name: "Ăn uống", currentBalance: 300000, icon: "🍔", color: "#EF4444" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    apiClient.get.mockResolvedValue({ data: mockJarsData });
  });

  test("fetches jars on mount and auto selects source and destination jars", async () => {
    const { getByText } = render(<JarTransferView />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/jars");
      expect(getByText("Ví tổng")).toBeTruthy();
      expect(getByText("Tiết kiệm")).toBeTruthy();
    });
  });

  test("switches source jar if destination jar is set to the same", async () => {
    const { getByText } = render(<JarTransferView />);
    
    await waitFor(() => {
      expect(getByText("Ví tổng")).toBeTruthy();
    });

    // Open "To" Picker modal and select "Ví tổng" to make it the same
    const toSelector = getByText("Tiết kiệm");
    fireEvent.press(toSelector);
    
    // Within modal select "Ví tổng"
    const modalItem = getByText("Số dư: 5000000 VND");
    fireEvent.press(modalItem);

    // Now, the "From" hũ should have auto-switched to "Tiết kiệm"
    await waitFor(() => {
      expect(getByText("Tiết kiệm")).toBeTruthy(); // From selector is now Tiết kiệm
    });
  });

  test("validates empty amount or invalid amount", async () => {
    const { getByText, getByPlaceholderText } = render(<JarTransferView />);
    
    await waitFor(() => {
      expect(getByText("Ví tổng")).toBeTruthy();
    });

    // Enter empty or 0 amount
    const amountInput = getByPlaceholderText("Nhập số tiền...");
    fireEvent.changeText(amountInput, "0");

    const transferBtn = getByText("Chuyển tiền");
    fireEvent.press(transferBtn);

    expect(Alert.alert).toHaveBeenCalledWith("Số tiền không hợp lệ", "Vui lòng nhập số tiền lớn hơn 0.");
  });

  test("validates insufficient balance in source jar", async () => {
    const { getByText, getByPlaceholderText } = render(<JarTransferView />);
    
    await waitFor(() => {
      expect(getByText("Ví tổng")).toBeTruthy();
    });

    // Enter amount greater than 5000000 VND (source jar balance)
    const amountInput = getByPlaceholderText("Nhập số tiền...");
    fireEvent.changeText(amountInput, "6.000.000");

    const transferBtn = getByText("Chuyển tiền");
    fireEvent.press(transferBtn);

    expect(Alert.alert).toHaveBeenCalledWith("Số dư không đủ", expect.any(String));
  });

  test("successfully submits transfer POST request and navigates back", async () => {
    apiClient.post.mockResolvedValueOnce({ data: { success: true } });
    const { getByText, getByPlaceholderText } = render(<JarTransferView />);
    
    await waitFor(() => {
      expect(getByText("Ví tổng")).toBeTruthy();
    });

    const amountInput = getByPlaceholderText("Nhập số tiền...");
    fireEvent.changeText(amountInput, "500.000");

    const transferBtn = getByText("Chuyển tiền");
    fireEvent.press(transferBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/jars/transfer", {
        fromJarId: 1,
        toJarId: 2,
        amount: 500000,
      });
      expect(Alert.alert).toHaveBeenCalledWith("Chuyển tiền thành công", expect.any(String));
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });
});
