jest.mock("../../services/receiptImportService", () => ({ analyzeReceiptFile: jest.fn() }));
jest.mock("../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.message || f }));
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

jest.mock("../../assets/accessories/camera.png", () => "camera.png");
jest.mock("../../assets/accessories/gallery.png", () => "gallery.png");
jest.mock("../../assets/accessories/documentation.png", () => "documentation.png");

import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useExpenseReceiptImport from "../useExpenseReceiptImport";

describe("useExpenseReceiptImport", () => {
  const { analyzeReceiptFile } = require("../../services/receiptImportService");
  const ImagePicker = require("expo-image-picker");
  const DocumentPicker = require("expo-document-picker");

  beforeEach(() => { jest.clearAllMocks(); });

  test("returns initial state", () => {
    const navigation = { navigate: jest.fn() };
    const { result } = renderHook(() => useExpenseReceiptImport({ isPremium: true, navigation }));
    expect(result.current.isScanning).toBe(false);
    expect(result.current.handleScanReceipt).toBeDefined();
  });

  test("handleScanReceipt shows premium alert for non-premium", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const navigation = { navigate: jest.fn() };
    const { result } = renderHook(() => useExpenseReceiptImport({ isPremium: false, navigation }));

    act(() => { result.current.handleScanReceipt(); });

    expect(alertSpy).toHaveBeenCalledWith("receiptImport.premiumTitle", "receiptImport.premiumMsg", expect.any(Array));
  });

  test("handleScanReceipt shows source options for premium", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const navigation = { navigate: jest.fn() };
    const { result } = renderHook(() => useExpenseReceiptImport({ isPremium: true, navigation }));

    act(() => { result.current.handleScanReceipt(); });

    expect(alertSpy).toHaveBeenCalledWith("receiptImport.sourceTitle", "receiptImport.sourceMsg", expect.any(Array));
  });

  function triggerCameraButton(navigation, alertSpy) {
    const { result } = renderHook(() => useExpenseReceiptImport({ isPremium: true, navigation }));
    act(() => { result.current.handleScanReceipt(); });
    const alertCall = alertSpy.mock.calls.find((c) => c[0] === "receiptImport.sourceTitle");
    const cameraButton = alertCall[2].find((b) => b.text === "receiptImport.cameraOption");
    return { result, cameraButton };
  }

  function triggerGalleryButton(navigation, alertSpy) {
    const { result } = renderHook(() => useExpenseReceiptImport({ isPremium: true, navigation }));
    act(() => { result.current.handleScanReceipt(); });
    const alertCall = alertSpy.mock.calls.find((c) => c[0] === "receiptImport.sourceTitle");
    const galleryButton = alertCall[2].find((b) => b.text === "receiptImport.galleryOption");
    return { result, galleryButton };
  }

  function triggerPdfButton(navigation, alertSpy) {
    const { result } = renderHook(() => useExpenseReceiptImport({ isPremium: true, navigation }));
    act(() => { result.current.handleScanReceipt(); });
    const alertCall = alertSpy.mock.calls.find((c) => c[0] === "receiptImport.sourceTitle");
    const pdfButton = alertCall[2].find((b) => b.text === "receiptImport.documentOption");
    return { result, pdfButton };
  }

  test("camera flow: requests permission and launches camera", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: "granted" });
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: "camera://photo.jpg" }] });
    analyzeReceiptFile.mockResolvedValueOnce({ items: [{ name: "Item", amount: 100 }] });

    const navigation = { navigate: jest.fn() };
    const { cameraButton } = triggerCameraButton(navigation, alertSpy);

    await act(async () => { await cameraButton.onPress(); });
    await act(async () => {});

    expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
    expect(analyzeReceiptFile).toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith("HomeTab", { screen: "ReceiptPreview", params: expect.any(Object) });
  });

  test("camera flow: shows alert if permission denied", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: "denied" });
    alertSpy.mockClear();

    const navigation = { navigate: jest.fn() };
    const { cameraButton } = triggerCameraButton(navigation, alertSpy);

    await act(async () => { await cameraButton.onPress(); });
    await act(async () => {});

    expect(alertSpy).toHaveBeenCalledWith("receiptImport.cameraPermissionTitle", "receiptImport.cameraPermissionMsg");
  });

  test("gallery flow: validates file size", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: "granted" });
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: "gallery://photo.jpg", fileSize: 20 * 1024 * 1024 }] });
    alertSpy.mockClear();

    const navigation = { navigate: jest.fn() };
    const { galleryButton } = triggerGalleryButton(navigation, alertSpy);

    await act(async () => { await galleryButton.onPress(); });
    await act(async () => {});

    expect(alertSpy).toHaveBeenCalledWith("receiptImport.imageTooLargeTitle", "receiptImport.imageTooLargeMsg");
    expect(analyzeReceiptFile).not.toHaveBeenCalled();
  });

  test("pdf flow: handles file too large", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    DocumentPicker.getDocumentAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: "pdf://doc.pdf", size: 15 * 1024 * 1024 }] });
    alertSpy.mockClear();

    const navigation = { navigate: jest.fn() };
    const { pdfButton } = triggerPdfButton(navigation, alertSpy);

    await act(async () => { await pdfButton.onPress(); });
    await act(async () => {});

    expect(alertSpy).toHaveBeenCalledWith("receiptImport.pdfTooLargeTitle", "receiptImport.pdfTooLargeMsg");
    expect(analyzeReceiptFile).not.toHaveBeenCalled();
  });

  test("preview flow: shows alert when no items found", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: "granted" });
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: "camera://photo.jpg" }] });
    analyzeReceiptFile.mockResolvedValueOnce({ items: [] });
    alertSpy.mockClear();

    const navigation = { navigate: jest.fn() };
    const { cameraButton } = triggerCameraButton(navigation, alertSpy);

    await act(async () => { await cameraButton.onPress(); });
    await act(async () => {});

    expect(alertSpy).toHaveBeenCalledWith("receiptImport.noItemsTitle", "receiptImport.noItemsMsg");
  });

  test("preview flow: handles analysis error", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: "granted" });
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: "camera://photo.jpg" }] });
    analyzeReceiptFile.mockRejectedValueOnce(new Error("Analysis failed"));
    alertSpy.mockClear();

    const navigation = { navigate: jest.fn() };
    const { cameraButton } = triggerCameraButton(navigation, alertSpy);

    await act(async () => { await cameraButton.onPress(); });
    await act(async () => {});

    expect(alertSpy).toHaveBeenCalledWith("receiptImport.analysisErrorTitle", "Analysis failed");
  });
});
