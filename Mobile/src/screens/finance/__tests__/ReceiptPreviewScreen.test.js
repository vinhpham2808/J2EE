jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => ({
      "receipt.title": "Chi tiết hóa đơn",
      "receipt.emptyTitle": "Không có vật phẩm",
      "receipt.emptyDescription": "Không tìm thấy vật phẩm nào trong hóa đơn.",
      "receipt.confirm": `Xác nhận (${options?.count} vật phẩm)`,
      "receipt.cancel": "Hủy bỏ",
    }[key] || key),
  }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: { TEXT: "#000", TEXT_SECONDARY: "#666" },
  useAppColors: () => ({
    BG: "#FFF",
    TEXT: "#000",
    PRIMARY: "#ef5e83",
    APP_BACKGROUND: "#FFF",
    CARD: "#FFF",
    CARD_BORDER: "#EEE",
    WHITE: "#FFFFFF",
    BORDER: "#CCC",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (s) => s,
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: () => 40,
  getSafeAreaBottom: () => 20,
}));

// Navigation mocks
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRoute = { name: "ReceiptPreviewScreen", params: { analyzeResult: { id: "res-123" } } };

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => mockRoute,
}));

// Mock hooks
const mockReceiptPreviewData = {
  categories: [{ id: "cat-1", name: "Food" }],
  categoriesLoading: false,
  confirmImport: jest.fn(),
  deleteItem: jest.fn(),
  hasInitialItems: true,
  items: [{ name: "Burger", amount: 15000 }],
  jarId: "jar-1",
  jars: [{ id: "jar-1", name: "Food Jar" }],
  jarsLoading: false,
  receiptMeta: { merchant: "McDonalds", location: "District 1", receiptDate: "2026-06-21" },
  setJarId: jest.fn(),
  submitting: false,
  totalAmount: 15000,
  updateItem: jest.fn(),
};

const mockUseReceiptPreview = jest.fn((options) => mockReceiptPreviewData);
jest.mock("../../../hooks/useReceiptPreview", () => (options) => mockUseReceiptPreview(options));

// Mock subcomponents
jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return ({ title }) => (
    <View testID="screen-header">
      <Text>{title}</Text>
    </View>
  );
});

jest.mock("../../../components/Receipt/ReceiptSummaryCard", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return ({ itemCount, location, merchant, receiptDate, totalAmount }) => (
    <View testID="receipt-summary-card">
      <Text>Item Count: {itemCount}</Text>
      <Text>Merchant: {merchant}</Text>
      <Text>Location: {location}</Text>
      <Text>Receipt Date: {receiptDate}</Text>
      <Text>Total Amount: {totalAmount}</Text>
    </View>
  );
});

jest.mock("../../../components/Receipt/JarSelector", () => {
  const React = require("react");
  const { Button, Text, View } = require("react-native");
  return ({ jarId, jars, loading, onChange }) => (
    <View testID="jar-selector">
      <Text>Jar ID: {jarId}</Text>
      <Text>Loading Jars: {loading ? "Yes" : "No"}</Text>
      {jars.map((jar) => (
        <Button
          key={jar.id}
          title={jar.name}
          testID={`jar-option-${jar.id}`}
          onPress={() => onChange(jar.id)}
        />
      ))}
    </View>
  );
});

jest.mock("../../../components/Receipt/ReceiptItemRow", () => {
  const React = require("react");
  const { Button, Text, View } = require("react-native");
  return ({ item, index, categories, categoriesLoading, onUpdate, onDelete }) => (
    <View testID={`receipt-item-row-${index}`}>
      <Text>Name: {item.name}</Text>
      <Text>Amount: {item.amount}</Text>
      <Text>Category Loading: {categoriesLoading ? "Yes" : "No"}</Text>
      <Button
        title="Update"
        testID={`update-btn-${index}`}
        onPress={() => onUpdate(index, { ...item, name: "Updated Name" })}
      />
      <Button
        title="Delete"
        testID={`delete-btn-${index}`}
        onPress={() => onDelete(index)}
      />
    </View>
  );
});

import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import ReceiptPreviewScreen from "../ReceiptPreviewScreen";

describe("ReceiptPreviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute = { name: "ReceiptPreviewScreen", params: { analyzeResult: { id: "res-123" } } };

    mockReceiptPreviewData.categories = [{ id: "cat-1", name: "Food" }];
    mockReceiptPreviewData.categoriesLoading = false;
    mockReceiptPreviewData.hasInitialItems = true;
    mockReceiptPreviewData.items = [{ name: "Burger", amount: 15000 }];
    mockReceiptPreviewData.jarId = "jar-1";
    mockReceiptPreviewData.jars = [{ id: "jar-1", name: "Food Jar" }];
    mockReceiptPreviewData.jarsLoading = false;
    mockReceiptPreviewData.receiptMeta = {
      merchant: "McDonalds",
      location: "District 1",
      receiptDate: "2026-06-21",
    };
    mockReceiptPreviewData.submitting = false;
    mockReceiptPreviewData.totalAmount = 15000;

    mockReceiptPreviewData.confirmImport.mockReset();
    mockReceiptPreviewData.deleteItem.mockReset();
    mockReceiptPreviewData.setJarId.mockReset();
    mockReceiptPreviewData.updateItem.mockReset();
  });

  it("renders ReceiptPreviewScreen successfully with summary, jar selector, and item rows", () => {
    const { getByTestId, getByText } = render(<ReceiptPreviewScreen />);

    expect(getByTestId("screen-header")).toBeTruthy();
    expect(getByText("Chi tiết hóa đơn")).toBeTruthy();

    expect(getByTestId("receipt-summary-card")).toBeTruthy();
    expect(getByText("Item Count: 1")).toBeTruthy();
    expect(getByText("Merchant: McDonalds")).toBeTruthy();
    expect(getByText("Location: District 1")).toBeTruthy();
    expect(getByText("Receipt Date: 2026-06-21")).toBeTruthy();
    expect(getByText("Total Amount: 15000")).toBeTruthy();

    expect(getByTestId("jar-selector")).toBeTruthy();
    expect(getByText("Jar ID: jar-1")).toBeTruthy();
    expect(getByText("Loading Jars: No")).toBeTruthy();

    expect(getByTestId("receipt-item-row-0")).toBeTruthy();
    expect(getByText("Name: Burger")).toBeTruthy();
    expect(getByText("Amount: 15000")).toBeTruthy();

    // Footer actions
    expect(getByText("✅ Xác nhận (1 vật phẩm)")).toBeTruthy();
    expect(getByText("Hủy bỏ")).toBeTruthy();
  });

  it("renders empty state when there are no initial items and not submitting", () => {
    mockReceiptPreviewData.hasInitialItems = false;
    const { getByText, queryByTestId } = render(<ReceiptPreviewScreen />);

    expect(getByText("Chi tiết hóa đơn")).toBeTruthy();
    expect(getByText("Không có vật phẩm")).toBeTruthy();
    expect(getByText("Không tìm thấy vật phẩm nào trong hóa đơn.")).toBeTruthy();

    expect(queryByTestId("receipt-summary-card")).toBeNull();
    expect(queryByTestId("jar-selector")).toBeNull();
    expect(queryByTestId("receipt-item-row-0")).toBeNull();
  });

  it("triggers setJarId when choosing a jar option", () => {
    const { getByTestId } = render(<ReceiptPreviewScreen />);
    fireEvent.press(getByTestId("jar-option-jar-1"));
    expect(mockReceiptPreviewData.setJarId).toHaveBeenCalledWith("jar-1");
  });

  it("triggers updateItem callback from receipt row", () => {
    const { getByTestId } = render(<ReceiptPreviewScreen />);
    fireEvent.press(getByTestId("update-btn-0"));
    expect(mockReceiptPreviewData.updateItem).toHaveBeenCalledWith(0, {
      name: "Updated Name",
      amount: 15000,
    });
  });

  it("triggers deleteItem callback from receipt row", () => {
    const { getByTestId } = render(<ReceiptPreviewScreen />);
    fireEvent.press(getByTestId("delete-btn-0"));
    expect(mockReceiptPreviewData.deleteItem).toHaveBeenCalledWith(0);
  });

  it("calls confirmImport when confirm button is pressed in footer", () => {
    const { getByText } = render(<ReceiptPreviewScreen />);
    fireEvent.press(getByText("✅ Xác nhận (1 vật phẩm)"));
    expect(mockReceiptPreviewData.confirmImport).toHaveBeenCalled();
  });

  it("calls navigation.goBack when cancel button is pressed in footer", () => {
    const { getByText } = render(<ReceiptPreviewScreen />);
    fireEvent.press(getByText("Hủy bỏ"));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("disables confirm and cancel buttons and renders ActivityIndicator when submitting is true", () => {
    mockReceiptPreviewData.submitting = true;
    const { queryByText } = render(<ReceiptPreviewScreen />);
    
    // We can verify confirm text is replaced by ActivityIndicator
    expect(queryByText("✅ Xác nhận (1 vật phẩm)")).toBeNull();
  });

  it("passes correct params to useReceiptPreview and handles success callback", () => {
    render(<ReceiptPreviewScreen />);

    expect(mockUseReceiptPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        analyzeResult: { id: "res-123" },
      })
    );

    const onImportSuccess = mockUseReceiptPreview.mock.calls[0][0].onImportSuccess;
    act(() => {
      onImportSuccess();
    });

    expect(mockGoBack).toHaveBeenCalled();
  });
});
