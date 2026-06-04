import { API_ENDPOINTS, CLOUDINARY_UPLOAD_PRESET } from "../constants/api";

export default async function uploadProfileImage(imageAsset) {
  if (!imageAsset?.uri) {
    throw new Error("Không tìm thấy ảnh để tải lên.");
  }

  const fileName = imageAsset.fileName || imageAsset.uri.split("/").pop() || "profile.jpg";
  const mimeType = imageAsset.mimeType || "image/jpeg";

  const formData = new FormData();
  formData.append("file", {
    uri: imageAsset.uri,
    name: fileName,
    type: mimeType
  });
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(API_ENDPOINTS.UPLOAD_IMAGE, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "Tải ảnh thất bại.");
  }

  const data = await response.json();
  if (!data?.secure_url) {
    throw new Error("Không nhận được URL ảnh từ dịch vụ upload.");
  }

  return data.secure_url;
}