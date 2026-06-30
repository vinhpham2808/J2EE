import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import JarDetailView from "../JarDetailView";
import apiClient from "../../../services/apiClient";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRoute = { params: { id: 2 } };

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => mockRoute,
  useFocusEffect: (cb) => {
    const React = require("react");
    React.useEffect(cb, []);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "auth.common.error": "Lỗi",
        "auth.common.success": "Thành công",
        "jarDetail.expense": "Chi tiêu",
        "jarDetail.other": "Khác",
        "jarDetail.delete": "Xóa",
        "jarDetail.loading": "Đang tải...",
        "jarDetail.deleteConfirmTitle": "Xóa hũ tài chính",
        "jarDetail.deleteConfirmMsg": "Bạn có chắc chắn muốn xóa hũ này?",
        "jarDetail.deleteConfirm": "Xóa hũ",
        "jarDetail.deleteSuccess": "Hũ đã được xóa thành công.",
        "jarDetail.deleteExpenseConfirm": "Xóa giao dịch",
        "jarDetail.deleteExpenseMsg": "Bạn có chắc chắn muốn xóa giao dịch này?",
        "jarDetail.deleteExpenseSuccess": "Giao dịch đã được xóa.",
        "jarDetail.cancel": "Hủy",
        "jarForm.parentWalletName": "Ví tổng",
        "goalForm.title": "Mục tiêu",
        "dashboardComponents.wallet": "Số dư",
        "jarCard.actualRatio": "Tỷ lệ thực tế",
        "budgetCard.budget": "Ngân sách",
        "expenseSummary.transactions": "Số giao dịch",
        "expenseSummary.addExpense": "Thêm chi tiêu",
        "emptyState.noData": "Không có dữ liệu giao dịch.",
        "categoryForm.edit": "Sửa",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const Svg = ({ children }) => React.createElement("SvgMock", null, children);
  const G = ({ children }) => React.createElement("GMock", null, children);
  const Path = ({ fill, d }) => React.createElement("PathMock", { fill, d });
  const SvgText = ({ children, x, y }) => React.createElement(Text, { x, y }, children);
  return {
    __esModule: true,
    default: Svg,
    Svg,
    G,
    Path,
    Text: SvgText,
  };
});

jest.mock("../../../services/apiClient", () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    BG: "#F9F9FA",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    PRIMARY: "#8B5CF6",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    BG: "#F9F9FA",
    PRIMARY: "#8B5CF6",
    EXPENSE: "#EF4444",
    EXPENSE_LIGHT: "#FEE4E6",
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatDate: (val) => val ? `Formatted: ${val}` : "-",
  getApiErrorMessage: (err, fallback) => err?.response?.data?.message || err?.message || fallback,
}));

jest.mock("../../../utils/jar", () => ({
  describeDonutArc: (cx, cy, outerR, innerR, startAngle, endAngle) => `Arc ${startAngle}-${endAngle}`,
  formatJarMoney: (val) => `${val} VND`,
  getJarActualPercent: (current, total) => total > 0 ? ((current / total) * 100).toFixed(1) : "0.0",
  getJarProgressWidth: (current, total) => total > 0 ? Math.min((Math.abs(current) / total) * 100, 100) : 0,
  JAR_CATEGORY_COLORS: ["#8B5CF6", "#F59E0B"],
  PARENT_WALLET_NAME: "Ví tổng",
}));

jest.mock("../../../utils/categoryIcons", () => ({
  CategoryVectorIcon: "CategoryVectorIcon",
  getIconColor: () => "#EF4444",
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: (insets) => insets.top,
  getSafeAreaBottom: (insets) => insets.bottom,
}));

jest.mock("../../common/ScreenBackHeader", () => "ScreenBackHeader");

describe("JarDetailView", () => {
  const mockJars = [
    { id: 1, name: "Ví tổng", currentBalance: 8000000, icon: "💳", color: "#8B5CF6", targetPercentage: 0 },
    { id: 2, name: "Tiết kiệm", currentBalance: 2000000, icon: "🐖", color: "#10B981", targetPercentage: 20 },
  ];

  const mockExpenses = [
    { id: 101, jarId: 2, name: "Mua sách", date: "2026-06-20", amount: 150000, categoryName: "Giáo dục", icon: "book", note: "Sách React Native" },
    { id: 102, jarId: 2, name: "Ăn tối", date: "2026-06-19", amount: 200000, categoryName: "Ăn uống", icon: "food" },
    { id: 103, jarId: 1, name: "Đăng ký mạng", date: "2026-06-20", amount: 250000, categoryName: "Điện nước", icon: "wifi" }, // belong to Jar 1
  ];

  beforeEach(() => {
    mockRoute = { params: { id: 2 } };
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    apiClient.get.mockImplementation((url) => {
      if (url.includes("/jars")) {
        return Promise.resolve({ data: mockJars });
      }
      return Promise.resolve({ data: mockExpenses });
    });
  });

  test("renders loading screen if selected jar data is not fetched yet", async () => {
    // delay resolve to show loading screen
    apiClient.get.mockReturnValueOnce(new Promise(() => {}));

    const { getByText } = render(<JarDetailView />);
    expect(getByText("Đang tải...")).toBeTruthy();
  });

  test("renders selected jar info, progress bar, action buttons, and transactions list", async () => {
    const { getByText, queryByText, getAllByText } = render(<JarDetailView />);

    await waitFor(() => {
      // Header and Name
      expect(getByText("Tiết kiệm")).toBeTruthy();
      expect(getByText("Mục tiêu: 20%")).toBeTruthy();
      
      // Balance and Percent calculations
      // total balance = 8M + 2M = 10M.
      // selected jar (id 2) = 2M. Percent = 20%.
      expect(getByText("2000000 VND")).toBeTruthy();
      expect(getByText("20.0%")).toBeTruthy();

      // Buttons
      expect(getByText("Sửa")).toBeTruthy();
      
      // We should have multiple "Xóa" buttons (Delete Jar + Delete Expenses)
      const deleteBtns = getAllByText("Xóa");
      expect(deleteBtns.length).toBe(3); // 1 jar delete + 2 expense deletes

      // Transactions (belong to Jar 2: books and dinner)
      expect(getByText("Mua sách")).toBeTruthy();
      expect(getByText("Formatted: 2026-06-20 • Giáo dục")).toBeTruthy();
      expect(getByText("- 150000 VND")).toBeTruthy();
      expect(getByText("📝")).toBeTruthy();
      expect(getByText("Sách React Native")).toBeTruthy();

      expect(getByText("Ăn tối")).toBeTruthy();
      expect(getByText("Formatted: 2026-06-19 • Ăn uống")).toBeTruthy();
      expect(getByText("- 200000 VND")).toBeTruthy();

      // Expense belonging to Jar 1 should not render here
      expect(queryByText("Đăng ký mạng")).toBeNull();
    });
  });

  test("does not show delete jar button if selected jar is PARENT_WALLET_NAME", async () => {
    mockRoute = { params: { id: 1 } }; // Parent Wallet
    const { getByText, getAllByText } = render(<JarDetailView />);

    await waitFor(() => {
      expect(getByText("Ví tổng")).toBeTruthy();
      
      // There is 1 expense belonging to Jar 1 ("Đăng ký mạng"), so there is exactly 1 Delete expense button,
      // and NO Delete Jar button (otherwise count would be 2).
      const deleteBtns = getAllByText("Xóa");
      expect(deleteBtns.length).toBe(1);
    });
  });

  test("handles edit jar button navigation", async () => {
    const { getByText } = render(<JarDetailView />);

    await waitFor(() => {
      fireEvent.press(getByText("Sửa"));
      expect(mockNavigate).toHaveBeenCalledWith("JarForm", {
        initialData: mockJars[1],
        isEditing: true,
      });
    });
  });

  test("handles jar deletion flow with confirmation dialog", async () => {
    apiClient.delete.mockResolvedValueOnce({ data: { success: true } });
    const { getAllByText } = render(<JarDetailView />);

    await waitFor(() => {
      const deleteJarBtn = getAllByText("Xóa")[0];
      fireEvent.press(deleteJarBtn);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Xóa hũ tài chính",
      "Bạn có chắc chắn muốn xóa hũ này?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa hũ", style: "destructive", onPress: expect.any(Function) },
      ]
    );

    // Trigger delete onPress confirmation callback
    const deleteConfirmCallback = Alert.alert.mock.calls[0][2][1].onPress;
    await deleteConfirmCallback();

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith("/jars/2");
      expect(Alert.alert).toHaveBeenCalledWith("Thành công", "Hũ đã được xóa thành công.");
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  test("handles individual expense deletion flow with confirmation dialog", async () => {
    apiClient.delete.mockResolvedValueOnce({ data: { success: true } });
    const { getAllByText } = render(<JarDetailView />);

    let deleteButtons;
    await waitFor(() => {
      deleteButtons = getAllByText("Xóa"); // delete transaction buttons
      expect(deleteButtons.length).toBe(3);
    });

    // Press delete on first transaction (Mua sách, id 101)
    fireEvent.press(deleteButtons[1]); // Index 0 is Delete Jar button, index 1 is first expense Delete button

    expect(Alert.alert).toHaveBeenCalledWith(
      "Xóa giao dịch",
      "Bạn có chắc chắn muốn xóa giao dịch này?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: expect.any(Function) },
      ]
    );

    // Trigger delete expense onPress confirmation callback
    const deleteExpenseCallback = Alert.alert.mock.calls[0][2][1].onPress;
    await deleteExpenseCallback();

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith("/expenses/101");
      expect(Alert.alert).toHaveBeenCalledWith("Thành công", "Giao dịch đã được xóa.");
      // should trigger refetch (2 calls on mount + 2 calls on refetch)
      expect(apiClient.get).toHaveBeenCalledTimes(4);
    });
  });

  test("renders empty state when there are no transactions in the selected jar", async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes("/jars")) {
        return Promise.resolve({ data: mockJars });
      }
      return Promise.resolve({ data: [] }); // Empty transactions list
    });

    const { getAllByText } = render(<JarDetailView />);

    await waitFor(() => {
      expect(getAllByText("Không có dữ liệu giao dịch.").length).toBe(2);
    });
  });
});
