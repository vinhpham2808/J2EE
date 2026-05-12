package com.example.moneymanager.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
public class S3Service {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    // Magic bytes for allowed image formats
    private static final byte[] MAGIC_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] MAGIC_PNG  = {(byte) 0x89, 0x50, 0x4E, 0x47};
    private static final byte[] MAGIC_GIF  = {0x47, 0x49, 0x46, 0x38};
    private static final byte[] MAGIC_WEBP_RIFF = {0x52, 0x49, 0x46, 0x46};

    @Autowired
    private S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.region}")
    private String region;

    public String uploadBytes(byte[] data, String filename, String contentType, String username) {
        String safeUsername = username != null ? username.replaceAll("[^a-zA-Z0-9@.-]", "_") : "anonymous";
        String key = "userData/" + safeUsername + "/" + UUID.randomUUID() + "_" + filename;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(data));

        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }

    public String uploadFile(MultipartFile file, String username) throws IOException {
        validateImageFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        String safeUsername = username != null ? username.replaceAll("[^a-zA-Z0-9@.-]", "_") : "anonymous";
        String fileName = "userData/" + safeUsername + "/" + UUID.randomUUID() + extension;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, fileName);
    }

    private void validateImageFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File không được để trống");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IOException("Tên file không hợp lệ");
        }

        int lastDot = originalFilename.lastIndexOf('.');
        String extension = lastDot >= 0 ? originalFilename.substring(lastDot + 1).toLowerCase() : "";
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IOException("Loại file không được phép. Chỉ chấp nhận: jpg, jpeg, png, webp, gif");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IOException("Content-Type không hợp lệ: " + contentType);
        }

        // Validate magic bytes to prevent content-type spoofing
        byte[] header = file.getBytes();
        if (!hasValidMagicBytes(header)) {
            throw new IOException("Nội dung file không hợp lệ");
        }
    }

    private boolean hasValidMagicBytes(byte[] data) {
        if (data == null || data.length < 4) return false;
        return startsWith(data, MAGIC_JPEG)
                || startsWith(data, MAGIC_PNG)
                || startsWith(data, MAGIC_GIF)
                || (startsWith(data, MAGIC_WEBP_RIFF) && data.length >= 12
                        && data[8] == 0x57 && data[9] == 0x45 && data[10] == 0x42 && data[11] == 0x50);
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}

