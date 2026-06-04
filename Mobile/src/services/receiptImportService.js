import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Upload ảnh hóa đơn hoặc file PDF để backend phân tích (Gemini Vision OCR).
 * Dùng cho ExpenseScreen (ImagePicker — camera/thư viện ảnh).
 *
 * @param {object} imageAsset - Kết quả từ expo-image-picker (có uri, mimeType, fileName)
 * @returns {Promise<object>} ReceiptImportAnalyzeResponseDTO
 */
export async function analyzeReceipt(imageAsset) {
  if (!imageAsset?.uri) {
    throw new Error("Không tìm thấy ảnh hóa đơn để phân tích.");
  }

  const fileName =
    imageAsset.fileName ||
    imageAsset.uri.split("/").pop() ||
    "receipt.jpg";
  const mimeType = imageAsset.mimeType || "image/jpeg";

  const formData = new FormData();
  formData.append("file", {
    uri: imageAsset.uri,
    name: fileName,
    type: mimeType,
  });

  const response = await apiClient.post(API_ENDPOINTS.ANALYZE_EXPENSE_RECEIPT, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  });

  return response.data;
}

/**
 * Upload file hóa đơn (ảnh hoặc PDF) từ bất kỳ nguồn nào.
 * Hỗ trợ cả ImagePicker asset lẫn DocumentPicker asset (PDF).
 *
 * @param {{ uri: string, name?: string, fileName?: string, mimeType?: string }} fileAsset
 * @returns {Promise<object>} ReceiptImportAnalyzeResponseDTO
 */
export async function analyzeReceiptFile(fileAsset) {
  if (!fileAsset?.uri) {
    throw new Error("Không tìm thấy file hóa đơn để phân tích.");
  }

  const fileName =
    fileAsset.name ||
    fileAsset.fileName ||
    fileAsset.uri.split("/").pop() ||
    "receipt.jpg";

  const mimeType = fileAsset.mimeType || "image/jpeg";

  const SUPPORTED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  if (!SUPPORTED_TYPES.includes(mimeType)) {
    throw new Error(
      "Định dạng không được hỗ trợ. Vui lòng chọn ảnh (JPEG, PNG, WebP, GIF) hoặc PDF."
    );
  }

  const formData = new FormData();
  formData.append("file", {
    uri: fileAsset.uri,
    name: fileName,
    type: mimeType,
  });

  const response = await apiClient.post(API_ENDPOINTS.ANALYZE_EXPENSE_RECEIPT, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  });

  return response.data;
}

/**
 * Xác nhận lưu các item từ hóa đơn thành các khoản chi thực tế.
 *
 * @param {object} payload - ReceiptImportConfirmRequestDTO
 * @param {string} payload.merchant
 * @param {string} payload.location
 * @param {string} payload.receiptDate - ISO date string
 * @param {number} [payload.jarId]
 * @param {Array} payload.items - Mảng ReceiptImportItemDTO đã được người dùng chỉnh sửa
 * @returns {Promise<object>} ReceiptImportResponseDTO
 */
export async function confirmReceiptImport(payload) {
  const response = await apiClient.post(API_ENDPOINTS.CONFIRM_EXPENSE_RECEIPT_IMPORT, payload);
  return response.data;
}
