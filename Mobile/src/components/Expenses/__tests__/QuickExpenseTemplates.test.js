jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("@react-native-async-storage/async-storage", () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock("../../../services/apiClient", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../../constants/api", () => ({ API_ENDPOINTS: { GET_JARS: "/jars", ADD_EXPENSE: "/expenses" } }));
jest.mock("../../../constants/colors", () => ({
  COLORS: { CARD: "#FFF", CARD_BORDER: "#EEE", PRIMARY: "#E8597A", TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#999", BG: "#F5F5F5", WHITE: "#FFF", ROSE_MIST: "#FFE4E9", OVERLAY: "rgba(0,0,0,0.45)", PRIMARY_GLOW: "#FFE4E9", PRIMARY_DARK: "#C0405E", EXPENSE: "#EF4444" },
  useAppColors: () => ({ CARD: "#FFF", CARD_BORDER: "#EEE", PRIMARY: "#E8597A", TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#999", BG: "#F5F5F5", WHITE: "#FFF", ROSE_MIST: "#FFE4E9", OVERLAY: "rgba(0,0,0,0.45)", PRIMARY_GLOW: "#FFE4E9", PRIMARY_DARK: "#C0405E", EXPENSE: "#EF4444" }),
}));
jest.mock("../../../services/categoryService", () => ({ fetchCategoriesByType: jest.fn() }));
jest.mock("../../../utils/format", () => ({ formatMoney: (v) => String(v), todayIso: () => "2026-06-19" }));
jest.mock("../QuickExpenseTemplateModals", () => ({
  JarPickerModal: ({ template, jars, onConfirm, onClose }) => null,
  TemplateFormModal: ({ template, categories, jars, onSave, onClose }) => null,
}));

import React from "react";
import { render, act } from "@testing-library/react-native";
import QuickExpenseTemplates from "../QuickExpenseTemplates";

describe("QuickExpenseTemplates", () => {
  const AsyncStorage = require("@react-native-async-storage/async-storage");
  const apiClient = require("../../../services/apiClient");
  const { fetchCategoriesByType } = require("../../../services/categoryService");

  beforeEach(() => { jest.clearAllMocks(); });

  test("renders header", () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    apiClient.get.mockResolvedValueOnce({ data: [] });
    fetchCategoriesByType.mockResolvedValueOnce([]);

    const { getByText } = render(<QuickExpenseTemplates />);
    expect(getByText("quickExpense.quickTitle")).toBeTruthy();
  });

  test("loads templates from AsyncStorage", async () => {
    const templates = JSON.stringify([{ id: "c1", emoji: "🍚", name: "My Template", amount: 50000 }]);
    AsyncStorage.getItem.mockResolvedValueOnce(templates);
    apiClient.get.mockResolvedValueOnce({ data: [] });
    fetchCategoriesByType.mockResolvedValueOnce([]);

    const { findByText } = render(<QuickExpenseTemplates />);
    expect(await findByText("My Template")).toBeTruthy();
  });

  test("shows empty state when no templates", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));
    apiClient.get.mockResolvedValueOnce({ data: [] });
    fetchCategoriesByType.mockResolvedValueOnce([]);

    const { findByText } = render(<QuickExpenseTemplates />);
    expect(await findByText("quickExpense.emptyTitle")).toBeTruthy();
  });

  test("calls API to fetch jars and categories", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    apiClient.get.mockResolvedValueOnce({ data: [{ id: 1, name: "Daily" }] });
    fetchCategoriesByType.mockResolvedValueOnce([{ id: 1, name: "Food" }]);

    render(<QuickExpenseTemplates />);
    await act(async () => {});

    expect(apiClient.get).toHaveBeenCalledWith("/jars");
    expect(fetchCategoriesByType).toHaveBeenCalledWith("expense");
  });

  test("uses default templates when AsyncStorage returns null", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    apiClient.get.mockResolvedValueOnce({ data: [] });
    fetchCategoriesByType.mockResolvedValueOnce([]);

    const { findByText } = render(<QuickExpenseTemplates />);
    expect(await findByText("Ăn cơm")).toBeTruthy();
  });

  test("handles AsyncStorage error gracefully", async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error("Storage error"));
    apiClient.get.mockResolvedValueOnce({ data: [] });
    fetchCategoriesByType.mockResolvedValueOnce([]);

    const { findByText } = render(<QuickExpenseTemplates />);
    expect(await findByText("Ăn cơm")).toBeTruthy();
  });

  test("toggles expanded state", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    apiClient.get.mockResolvedValueOnce({ data: [] });
    fetchCategoriesByType.mockResolvedValueOnce([]);

    const { findByText } = render(<QuickExpenseTemplates />);
    expect(await findByText("▲")).toBeTruthy();
  });

  test("calls onRefreshList when passed", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([{ id: "t1", emoji: "🍚", name: "Test", amount: 50000 }]));
    apiClient.get.mockResolvedValueOnce({ data: [] });
    fetchCategoriesByType.mockResolvedValueOnce([]);
    apiClient.post.mockResolvedValueOnce({});

    const onRefreshList = jest.fn();
    const { findByText } = render(<QuickExpenseTemplates onRefreshList={onRefreshList} />);
    expect(await findByText("Test")).toBeTruthy();
  });
});
