import { Alert } from "react-native";

jest.mock("expo-file-system", () => ({ documentDirectory: "file:///mock-dir/", downloadAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

const mockFileSystem = require("expo-file-system");
const mockSharing = require("expo-sharing");

import { downloadAndShareFile } from "../downloadFile";

describe("downloadFile", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => { jest.clearAllMocks(); });

  test("downloads and shares file successfully", async () => {
    mockFileSystem.downloadAsync.mockResolvedValueOnce({ uri: "file:///tmp/report.xlsx", status: 200 });
    mockSharing.isAvailableAsync.mockResolvedValueOnce(true);

    await downloadAndShareFile("https://example.com/report.xlsx", "report.xlsx");

    expect(mockFileSystem.downloadAsync).toHaveBeenCalledWith("https://example.com/report.xlsx", "file:///mock-dir/report.xlsx");
    expect(mockSharing.shareAsync).toHaveBeenCalledWith("file:///tmp/report.xlsx", {
      dialogTitle: "Mở hoặc lưu báo cáo",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      UTI: "com.microsoft.excel.xls"
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test("uses PDF mime type when filename ends with .pdf", async () => {
    mockFileSystem.downloadAsync.mockResolvedValueOnce({ uri: "file:///tmp/report.pdf", status: 200 });
    mockSharing.isAvailableAsync.mockResolvedValueOnce(true);

    await downloadAndShareFile("https://example.com/report.pdf", "report.pdf");

    expect(mockSharing.shareAsync).toHaveBeenCalledWith("file:///tmp/report.pdf", expect.objectContaining({
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf"
    }));
  });

  test("shows success alert when sharing is not available", async () => {
    mockFileSystem.downloadAsync.mockResolvedValueOnce({ uri: "file:///tmp/doc.xlsx", status: 200 });
    mockSharing.isAvailableAsync.mockResolvedValueOnce(false);

    await downloadAndShareFile("https://example.com/doc.xlsx", "doc.xlsx");

    expect(alertSpy).toHaveBeenCalledWith("Thành công", "Đã tải file thành công, nhưng thiết bị không hỗ trợ chia sẻ/mở trực tiếp.");
  });

  test("throws error when download status is not 200", async () => {
    mockFileSystem.downloadAsync.mockResolvedValueOnce({ uri: "file:///tmp/bad.xlsx", status: 500 });

    await downloadAndShareFile("https://example.com/bad.xlsx", "bad.xlsx");

    expect(alertSpy).toHaveBeenCalledWith("Lỗi", "Không thể tải file báo cáo lúc này.");
  });

  test("catches and alerts on network error", async () => {
    mockFileSystem.downloadAsync.mockRejectedValueOnce(new Error("Network failure"));

    await downloadAndShareFile("https://example.com/fail.xlsx", "fail.xlsx");

    expect(alertSpy).toHaveBeenCalledWith("Lỗi", "Không thể tải file báo cáo lúc này.");
  });
});
