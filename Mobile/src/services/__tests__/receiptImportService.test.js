jest.mock("../apiClient", () => ({ post: jest.fn() }));

import { analyzeReceipt, analyzeReceiptFile, confirmReceiptImport } from "../receiptImportService";

describe("receiptImportService", () => {
  const apiClient = require("../apiClient");

  beforeEach(() => { jest.clearAllMocks(); });

  describe("analyzeReceipt", () => {
    test("throws when imageAsset has no uri", async () => {
      await expect(analyzeReceipt({})).rejects.toThrow("Không tìm thấy ảnh hóa đơn để phân tích.");
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    test("posts FormData with image asset", async () => {
      const asset = { uri: "file://photo.jpg", fileName: "photo.jpg", mimeType: "image/jpeg" };
      apiClient.post.mockResolvedValueOnce({ data: { items: [] } });

      const result = await analyzeReceipt(asset);
      expect(result).toEqual({ items: [] });
      expect(apiClient.post).toHaveBeenCalledWith(
        "/expenses/import-receipt/analyze",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data", Accept: "application/json" } }
      );
    });

    test("uses fallback fileName and mimeType when missing", async () => {
      const asset = { uri: "file://img.jpg" };
      apiClient.post.mockResolvedValueOnce({ data: {} });

      await analyzeReceipt(asset);
      const callArg = apiClient.post.mock.calls[0][1];
      expect(callArg).toBeInstanceOf(FormData);
    });
  });

  describe("analyzeReceiptFile", () => {
    test("throws when fileAsset has no uri", async () => {
      await expect(analyzeReceiptFile(null)).rejects.toThrow("Không tìm thấy file hóa đơn để phân tích.");
    });

    test("throws for unsupported mime type", async () => {
      await expect(analyzeReceiptFile({ uri: "file://doc.txt", mimeType: "text/plain" })).rejects.toThrow(
        "Định dạng không được hỗ trợ"
      );
    });

    test("accepts PDF mime type", async () => {
      const asset = { uri: "file://receipt.pdf", fileName: "receipt.pdf", mimeType: "application/pdf" };
      apiClient.post.mockResolvedValueOnce({ data: { items: [] } });

      const result = await analyzeReceiptFile(asset);
      expect(result).toEqual({ items: [] });
    });

    test("accepts image mime types", async () => {
      const asset = { uri: "file://photo.png", name: "photo.png", mimeType: "image/png" };
      apiClient.post.mockResolvedValueOnce({ data: {} });

      await analyzeReceiptFile(asset);
      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  describe("confirmReceiptImport", () => {
    test("posts confirmation payload", async () => {
      const payload = { merchant: "Store", items: [{ name: "Milk", amount: 50 }] };
      apiClient.post.mockResolvedValueOnce({ data: { status: "ok" } });

      const result = await confirmReceiptImport(payload);
      expect(result).toEqual({ status: "ok" });
      expect(apiClient.post).toHaveBeenCalledWith("/expenses/import-receipt/confirm", payload);
    });
  });
});
