jest.mock("../../constants/api", () => ({
  API_ENDPOINTS: { UPLOAD_IMAGE: "https://api.cloudinary.com/v1_1/test-cloud/image/upload" },
  CLOUDINARY_UPLOAD_PRESET: "test_preset"
}));

import uploadProfileImage from "../profileImage";

describe("profileImage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => { jest.clearAllMocks(); });
  afterEach(() => { global.fetch = originalFetch; });

  test("throws when imageAsset is missing uri", async () => {
    await expect(uploadProfileImage({})).rejects.toThrow("Không tìm thấy ảnh để tải lên.");
    await expect(uploadProfileImage(null)).rejects.toThrow("Không tìm thấy ảnh để tải lên.");
    await expect(uploadProfileImage({ uri: "" })).rejects.toThrow("Không tìm thấy ảnh để tải lên.");
  });

  test("uploads image and returns secure_url", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ secure_url: "https://res.cloudinary.com/test/image/upload/v1/profile.jpg" })
    });

    const result = await uploadProfileImage({
      uri: "file:///tmp/photo.jpg",
      fileName: "profile.jpg",
      mimeType: "image/jpeg"
    });

    expect(result).toBe("https://res.cloudinary.com/test/image/upload/v1/profile.jpg");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.cloudinary.com/v1_1/test-cloud/image/upload",
      expect.objectContaining({ method: "POST" })
    );
  });

  test("falls back to defaults when fileName or mimeType missing", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ secure_url: "https://res.cloudinary.com/test/image/upload/v1/default.jpg" })
    });

    const result = await uploadProfileImage({ uri: "file:///tmp/photo.jpg" });

    expect(result).toBeTruthy();
    const callBody = global.fetch.mock.calls[0][1].body;
    expect(callBody.get("upload_preset")).toBe("test_preset");
  });

  test("throws on non-ok response", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("Tải ảnh thất bại.")
    });

    await expect(uploadProfileImage({ uri: "file:///tmp/bad.jpg" })).rejects.toThrow("Tải ảnh thất bại.");
  });

  test("throws when response has no secure_url", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    });

    await expect(uploadProfileImage({ uri: "file:///tmp/empty.jpg" })).rejects.toThrow("Không nhận được URL ảnh từ dịch vụ upload.");
  });
});
