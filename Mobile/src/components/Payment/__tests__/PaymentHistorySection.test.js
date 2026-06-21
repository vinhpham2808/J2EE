import React from "react";
import { create, act } from "react-test-renderer";
import PaymentHistorySection from "../PaymentHistorySection";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock AppIcon
jest.mock("../../ui/AppIcon", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({ name, testID }) => <View testID={testID || `icon-${name}`} />;
});

// Mock colors
jest.mock("../../../constants/colors", () => ({
  COLORS: {},
  useAppColors: () => ({
    TEXT: "#000",
    TEXT_SECONDARY: "#555",
    TEXT_MUTED: "#999",
    PRIMARY: "#6C63FF",
    BG: "#F5F5F5",
    CARD: "#FFF",
    CARD_BORDER: "#E0E0E0",
    INCOME: "#4CAF50",
    INCOME_LIGHT: "#E8F5E9",
    WARNING: "#FF9800",
    WARNING_LIGHT: "#FFF3E0",
    EXPENSE: "#F44336",
    EXPENSE_LIGHT: "#FFEBEE",
    INFO: "#2196F3",
    INFO_LIGHT: "#E3F2FD",
  }),
}));

// Mock format utils
jest.mock("../../../utils/format", () => ({
  formatMoney: (amount) => `${amount}đ`,
}));

// Mock paymentStatus utils
jest.mock("../../../utils/paymentStatus", () => ({
  formatPaymentDate: (val) => (val ? "01/01/2024 10:00" : "--"),
  getPaymentStatusMeta: (status) => {
    const map = {
      PAID: { label: "Đã thanh toán", tone: "success", icon: "checkmark-circle-outline" },
      PENDING: { label: "Chờ thanh toán", tone: "warning", icon: "time-outline" },
      FAILED: { label: "Thất bại", tone: "danger", icon: "alert-circle-outline" },
      CANCELLED: { label: "Đã hủy", tone: "muted", icon: "close-circle-outline" },
    };
    return map[status] || { label: status || "PENDING", tone: "muted", icon: "help-circle-outline" };
  },
}));

const defaultProps = {
  deletingCode: null,
  loading: false,
  onDelete: jest.fn(),
  onRefresh: jest.fn(),
  payments: [],
  refreshing: false,
};

const samplePayments = [
  {
    orderCode: "ORDER001",
    paymentLinkId: "link-1",
    planName: "Premium Plan",
    status: "PAID",
    amount: 199000,
    updatedAt: "2024-01-01T10:00:00Z",
  },
  {
    orderCode: "ORDER002",
    paymentLinkId: "link-2",
    planName: "Basic Plan",
    status: "PENDING",
    amount: 99000,
    createdAt: "2024-01-02T09:00:00Z",
  },
];

describe("PaymentHistorySection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders section title and subtitle", () => {
    let root;
    act(() => {
      root = create(<PaymentHistorySection {...defaultProps} />);
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const texts = allText.map((t) => t.props.children);
    expect(texts).toContain("paymentHistory.sectionTitle");
    expect(texts).toContain("paymentHistory.sectionSubtitle");
  });

  it("renders refresh button", () => {
    let root;
    act(() => {
      root = create(<PaymentHistorySection {...defaultProps} />);
    });
    const { Pressable } = require("react-native");
    const pressables = root.root.findAllByType(Pressable);
    const refreshBtn = pressables.find(
      (p) => p.props.accessibilityRole === "button"
    );
    expect(refreshBtn).toBeTruthy();
    expect(refreshBtn.props.accessibilityLabel).toBe("paymentHistory.refreshAccessibility");
  });

  it("shows ActivityIndicator in refresh button when refreshing=true", () => {
    let root;
    act(() => {
      root = create(<PaymentHistorySection {...defaultProps} refreshing={true} />);
    });
    const { ActivityIndicator } = require("react-native");
    const indicators = root.root.findAllByType(ActivityIndicator);
    expect(indicators.length).toBeGreaterThanOrEqual(1);
  });

  it("shows ActivityIndicator in refresh button when loading=true", () => {
    let root;
    act(() => {
      root = create(<PaymentHistorySection {...defaultProps} loading={true} />);
    });
    const { ActivityIndicator } = require("react-native");
    const indicators = root.root.findAllByType(ActivityIndicator);
    expect(indicators.length).toBeGreaterThanOrEqual(1);
  });

  it("disables refresh button when refreshing or loading", () => {
    let root;
    act(() => {
      root = create(<PaymentHistorySection {...defaultProps} refreshing={true} />);
    });
    const { Pressable } = require("react-native");
    const refreshBtn = root.root
      .findAllByType(Pressable)
      .find((p) => p.props.accessibilityRole === "button");
    expect(refreshBtn.props.disabled).toBe(true);
  });

  it("shows loading state with loading text when loading=true", () => {
    let root;
    act(() => {
      root = create(<PaymentHistorySection {...defaultProps} loading={true} />);
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const texts = allText.map((t) => t.props.children);
    expect(texts).toContain("paymentHistory.loading");
  });

  it("shows empty state when payments array is empty", () => {
    let root;
    act(() => {
      root = create(<PaymentHistorySection {...defaultProps} payments={[]} />);
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const texts = allText.map((t) => t.props.children);
    expect(texts).toContain("paymentHistory.empty");
  });

  it("renders payment cards when payments provided", () => {
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection {...defaultProps} payments={samplePayments} />
      );
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const texts = allText.map((t) => t.props.children);
    expect(texts).toContain("Premium Plan");
    expect(texts).toContain("Basic Plan");
  });

  it("renders formatted amount for each payment", () => {
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection {...defaultProps} payments={samplePayments} />
      );
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const texts = allText.map((t) => t.props.children);
    expect(texts).toContain("199000đ");
    expect(texts).toContain("99000đ");
  });

  it("renders status badge label for each payment", () => {
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection {...defaultProps} payments={samplePayments} />
      );
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const texts = allText.map((t) => t.props.children);
    expect(texts).toContain("Đã thanh toán");
    expect(texts).toContain("Chờ thanh toán");
  });

  it("renders formatted date for each payment", () => {
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection {...defaultProps} payments={samplePayments} />
      );
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const texts = allText.map((t) => t.props.children);
    expect(texts.filter((t) => t === "01/01/2024 10:00").length).toBeGreaterThanOrEqual(1);
  });

  it("renders delete buttons for each payment", () => {
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection {...defaultProps} payments={samplePayments} />
      );
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const deleteTexts = allText.filter(
      (t) => t.props.children === "paymentHistory.deleteButton"
    );
    expect(deleteTexts.length).toBe(samplePayments.length);
  });

  it("calls onDelete with orderCode when delete button pressed", () => {
    const onDelete = jest.fn();
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection
          {...defaultProps}
          payments={samplePayments}
          onDelete={onDelete}
        />
      );
    });
    const { Pressable } = require("react-native");
    // Find all pressables that are not the refresh button
    const pressables = root.root
      .findAllByType(Pressable)
      .filter((p) => p.props.accessibilityRole !== "button");
    // First delete button should call onDelete with ORDER001
    act(() => {
      pressables[0].props.onPress();
    });
    expect(onDelete).toHaveBeenCalledWith("ORDER001");
  });

  it("calls onRefresh when refresh button is pressed", () => {
    const onRefresh = jest.fn();
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection {...defaultProps} onRefresh={onRefresh} />
      );
    });
    const { Pressable } = require("react-native");
    const refreshBtn = root.root
      .findAllByType(Pressable)
      .find((p) => p.props.accessibilityRole === "button");
    act(() => {
      refreshBtn.props.onPress();
    });
    expect(onRefresh).toHaveBeenCalled();
  });

  it("shows ActivityIndicator in delete button when that payment is being deleted", () => {
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection
          {...defaultProps}
          payments={samplePayments}
          deletingCode="ORDER001"
        />
      );
    });
    const { ActivityIndicator } = require("react-native");
    const indicators = root.root.findAllByType(ActivityIndicator);
    // One in the delete button for ORDER001
    expect(indicators.length).toBeGreaterThanOrEqual(1);
  });

  it("disables delete button for the payment being deleted", () => {
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection
          {...defaultProps}
          payments={samplePayments}
          deletingCode="ORDER001"
        />
      );
    });
    const { Pressable } = require("react-native");
    const pressables = root.root
      .findAllByType(Pressable)
      .filter((p) => p.props.accessibilityRole !== "button");
    // First delete button (ORDER001) should be disabled
    expect(pressables[0].props.disabled).toBe(true);
    // Second delete button (ORDER002) should NOT be disabled
    expect(pressables[1].props.disabled).toBe(false);
  });

  it("uses planName fallback (description) when planName missing", () => {
    const paymentsWithDesc = [
      {
        orderCode: "ORDER003",
        description: "Fallback Description",
        status: "PAID",
        amount: 50000,
      },
    ];
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection {...defaultProps} payments={paymentsWithDesc} />
      );
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const texts = allText.map((t) => t.props.children);
    expect(texts).toContain("Fallback Description");
  });

  it("uses t('planNameFallback') when both planName and description are missing", () => {
    const paymentsNoName = [
      {
        orderCode: "ORDER004",
        status: "PAID",
        amount: 50000,
      },
    ];
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection {...defaultProps} payments={paymentsNoName} />
      );
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const texts = allText.map((t) => t.props.children);
    expect(texts).toContain("paymentHistory.planNameFallback");
  });

  it("renders receipt label text for each payment card", () => {
    let root;
    act(() => {
      root = create(
        <PaymentHistorySection {...defaultProps} payments={samplePayments} />
      );
    });
    const allText = root.root.findAllByType(require("react-native").Text);
    const receiptLabels = allText.filter(
      (t) => t.props.children === "paymentHistory.receiptLabel"
    );
    expect(receiptLabels.length).toBe(samplePayments.length);
  });
});
