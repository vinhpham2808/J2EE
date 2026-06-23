package com.example.moneymanager.service;

import com.example.moneymanager.config.GptOssKeyRotator;
import com.example.moneymanager.config.GptOssProperties;
import com.example.moneymanager.config.OcrKeyRotator;
import com.example.moneymanager.config.OcrProperties;
import com.example.moneymanager.config.GeminiProperties;
import com.example.moneymanager.config.GeminiKeyRotator;
import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.dto.ExpenseResponseDTO;
import com.example.moneymanager.dto.ReceiptImportAnalyzeResponseDTO;
import com.example.moneymanager.dto.ReceiptImportConfirmRequestDTO;
import com.example.moneymanager.dto.ReceiptImportItemDTO;
import com.example.moneymanager.dto.ReceiptImportResponseDTO;
import com.example.moneymanager.entity.CategoryEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.exception.ForbiddenException;
import com.example.moneymanager.exception.ReceiptImportException;
import com.example.moneymanager.repository.CategoryRepository;
import com.example.moneymanager.util.OpenRouterResponseParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.function.Supplier;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReceiptImportService {

    private static final long MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
    private static final String EXPENSE_TYPE = "expense";
    private static final String OTHER_CATEGORY_NAME = "Khác";
    private static final String OTHER_CATEGORY_ICON = "CircleHelp";
    private static final String RECEIPT_OCR_MODEL = "gemini-3.1-flash-lite";

    private final RestClient ocrRestClient;
    private final OcrProperties ocrProperties;
    private final OcrKeyRotator ocrKeyRotator;
    private final RestClient gptOssRestClient;
    private final GptOssProperties gptOssProperties;
    private final GptOssKeyRotator gptOssKeyRotator;
    private final RestClient geminiRestClient;
    private final GeminiProperties geminiProperties;
    private final GeminiKeyRotator geminiKeyRotator;
    private final ObjectMapper objectMapper;
    private final ProfileService profileService;
    private final CategoryRepository categoryRepository;
    private final ExpenseService expenseService;
    private final SubscriptionService subscriptionService;
    private final AiViolationService aiViolationService;
    private final S3Service s3Service;

    public ReceiptImportResponseDTO importReceipt(MultipartFile file) {
        ensureAiReceiptAccess();
        ReceiptImportAnalyzeResponseDTO preview = analyzeReceipt(file);
        return confirmImport(ReceiptImportConfirmRequestDTO.builder()
            .merchant(preview.getMerchant())
            .location(preview.getLocation())
            .receiptDate(preview.getReceiptDate())
            .items(preview.getItems())
            .receiptImageUrl(preview.getReceiptImageUrl())
            .build());
        }

        public ReceiptImportAnalyzeResponseDTO analyzeReceipt(MultipartFile file) {
        ensureAiReceiptAccess();
        ProfileEntity profile = profileService.getCurrentProfile();
        subscriptionService.ensureCanImportReceipt(profile);

        if (file == null || file.isEmpty()) {
            throw new ReceiptImportException("Vui lòng chọn hình ảnh hóa đơn để import.");
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (java.io.IOException e) {
            throw new ReceiptImportException("Không thể đọc tệp ảnh.", e);
        }

        validateFile(file, fileBytes);

        String receiptImageUrl = null;
        try {
            receiptImageUrl = s3Service.uploadFile(file, profile.getEmail());
        } catch (Exception e) {
            log.error("Failed to upload receipt to S3: ", e);
            throw new ReceiptImportException("Không thể tải hóa đơn lên S3: " + e.getMessage(), e);
        }

        List<CategoryEntity> expenseCategories = new ArrayList<>(
                categoryRepository.findByTypeAndProfileId(EXPENSE_TYPE, profile.getId())
        );
        CategoryEntity otherCategory = ensureOtherExpenseCategory(profile, expenseCategories);

        JsonNode aiResult = analyzeReceiptWithOcrProvider(fileBytes);
        return buildPreviewFromAiResult(aiResult, expenseCategories, otherCategory, receiptImageUrl);
    }

    @Transactional
    public ReceiptImportResponseDTO confirmImport(ReceiptImportConfirmRequestDTO requestDTO) {
        ProfileEntity profile = profileService.getCurrentProfile();
        subscriptionService.ensureCanImportReceipt(profile);

        if (requestDTO == null || requestDTO.getItems() == null || requestDTO.getItems().isEmpty()) {
            throw new ReceiptImportException("Danh sách chi tiêu import không được để trống.");
        }

        String merchant = safeText(requestDTO.getMerchant());
        String location = safeText(requestDTO.getLocation());
        String normalizedReceiptLocation = !location.isBlank() ? location : merchant;
        LocalDate defaultDate = requestDTO.getReceiptDate() != null ? requestDTO.getReceiptDate() : LocalDate.now();
        List<CategoryEntity> expenseCategories = new ArrayList<>(
            categoryRepository.findByTypeAndProfileId(EXPENSE_TYPE, profile.getId())
        );
        CategoryEntity otherCategory = ensureOtherExpenseCategory(profile, expenseCategories);

        // Check subscription quota once upfront for the entire batch.
        // Using addExpense() in a loop would re-check quota after each saved item,
        // causing the 2nd+ items to fail when approaching the monthly limit.
        subscriptionService.ensureCanCreateTransaction(profile, defaultDate);

        List<ExpenseDTO> importedExpenses = new ArrayList<>();
        for (ReceiptImportItemDTO item : requestDTO.getItems()) {
            if (item == null) {
                continue;
            }

            String itemName = safeText(item.getName());
            BigDecimal amount = item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO;
            if (itemName.isBlank() || amount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            CategoryEntity matchedCategory = item.getCategoryId() != null
                    ? categoryRepository.findByIdAndProfileId(item.getCategoryId(), profile.getId())
                    .orElse(otherCategory)
                    : otherCategory;

            LocalDate transactionDate = item.getDate() != null ? item.getDate() : defaultDate;
            // Use addExpenseInternal to bypass per-item subscription checks already done above
            ExpenseResponseDTO created = expenseService.addExpenseInternal(
                    ExpenseDTO.builder()
                            .name(itemName)
                            .icon(item.getIcon() != null && !item.getIcon().isBlank() ? item.getIcon() : matchedCategory.getIcon())
                            .receiptLocation(normalizedReceiptLocation)
                            .receiptImageUrl(requestDTO.getReceiptImageUrl())
                            .categoryId(matchedCategory.getId())
                            .amount(amount)
                            .date(transactionDate)
                            .jarId(requestDTO.getJarId())
                            .build(),
                    profile
            );

            importedExpenses.add(ExpenseDTO.builder()
                    .id(created.getId())
                    .name(created.getName())
                    .icon(created.getIcon())
                    .receiptLocation(created.getReceiptLocation())
                    .categoryId(created.getCategoryId())
                    .categoryName(created.getCategoryName())
                    .amount(created.getAmount())
                    .date(created.getDate())
                    .createdAt(created.getCreatedAt())
                    .updatedAt(created.getUpdatedAt())
                    .build());
        }

        if (importedExpenses.isEmpty()) {
            throw new ReceiptImportException("Không có dòng chi tiêu hợp lệ để lưu từ hóa đơn.");
        }

        return ReceiptImportResponseDTO.builder()
                .merchant(merchant)
                .receiptDate(requestDTO.getReceiptDate())
                .detectedItemCount(requestDTO.getItems().size())
                .importedCount(importedExpenses.size())
                .importedExpenses(importedExpenses)
                .build();
    }

        private ReceiptImportAnalyzeResponseDTO buildPreviewFromAiResult(
            JsonNode aiResult,
            List<CategoryEntity> expenseCategories,
            CategoryEntity otherCategory,
            String receiptImageUrl
        ) {
        LocalDate receiptDate = parseReceiptDate(aiResult.path("receiptDate").asText(null));
        String merchant = safeText(aiResult.path("merchant").asText(""));
        String receiptLocation = safeText(aiResult.path("location").asText(""));

        JsonNode itemsNode = aiResult.path("items");
        if (!itemsNode.isArray() || itemsNode.isEmpty()) {
            throw new ReceiptImportException("Không tìm thấy dòng chi tiêu hợp lệ từ hình ảnh hóa đơn.");
        }

        List<ReceiptImportItemDTO> items = new ArrayList<>();
        for (JsonNode item : itemsNode) {
            String itemName = safeText(item.path("name").asText(""));
            BigDecimal amount = parseAmount(item.path("amount"));
            String categoryHint = safeText(item.path("categoryHint").asText(""));

            if (itemName.isBlank() || amount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            LocalDate transactionDate = receiptDate != null ? receiptDate : LocalDate.now();
                CategoryEntity matchedCategory = resolveCategory(expenseCategories, categoryHint, itemName, otherCategory);
            items.add(ReceiptImportItemDTO.builder()
                    .name(itemName)
                    .amount(amount)
                    .categoryId(matchedCategory.getId())
                    .categoryHint(categoryHint)
                    .icon(matchedCategory.getIcon())
                    .date(transactionDate)
                    .build());
        }

        if (items.isEmpty()) {
            throw new ReceiptImportException("Không có dòng chi tiêu hợp lệ để preview từ hóa đơn.");
        }

        return ReceiptImportAnalyzeResponseDTO.builder()
                .merchant(merchant)
                .location(receiptLocation)
                .receiptDate(receiptDate)
                .detectedItemCount(itemsNode.size())
                .items(items)
                .receiptImageUrl(receiptImageUrl)
                .build();
    }

    private static final byte[] MAGIC_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] MAGIC_PNG  = {(byte) 0x89, 0x50, 0x4E, 0x47};
    private static final byte[] MAGIC_GIF  = {0x47, 0x49, 0x46, 0x38};
    private static final byte[] MAGIC_WEBP_RIFF = {0x52, 0x49, 0x46, 0x46};
    private static final byte[] MAGIC_PDF  = {0x25, 0x50, 0x44, 0x46, 0x2D}; // %PDF-

    private void validateFile(MultipartFile file, byte[] fileBytes) {
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new ReceiptImportException("Kích thước ảnh quá lớn. Vui lòng chọn ảnh tối đa 10MB.");
        }

        String contentType = file.getContentType();
        String baseContentType = contentType == null ? "" : contentType.split(";")[0].trim().toLowerCase(Locale.ROOT);
        if (!baseContentType.startsWith("image/") && !baseContentType.equals("application/pdf")) {
            throw new ReceiptImportException("Định dạng tệp không hợp lệ. Vui lòng chọn tệp ảnh hoặc PDF.");
        }

        if (!hasValidFileMagicBytes(fileBytes)) {
            throw new ReceiptImportException("Nội dung tệp không hợp lệ. Vui lòng chọn tệp ảnh thực sự.");
        }
    }

    // First-pass integrity check only — not a guarantee of full file parsability.
    private boolean hasValidFileMagicBytes(byte[] data) {
        if (data == null || data.length < 4) return false;
        return startsWith(data, MAGIC_JPEG)
                || startsWith(data, MAGIC_PNG)
                || startsWith(data, MAGIC_GIF)
                || startsWith(data, MAGIC_PDF)
                || (startsWith(data, MAGIC_WEBP_RIFF) && data.length >= 12
                        && data[8] == 0x57 && data[9] == 0x45 && data[10] == 0x42 && data[11] == 0x50);
    }

    private String canonicalMimeType(byte[] data) {
        if (data != null && startsWith(data, MAGIC_PDF)) return "application/pdf";
        if (data != null && startsWith(data, MAGIC_PNG)) return "image/png";
        if (data != null && startsWith(data, MAGIC_GIF)) return "image/gif";
        if (data != null && startsWith(data, MAGIC_WEBP_RIFF) && data.length >= 12
                && data[8] == 0x57 && data[9] == 0x45 && data[10] == 0x42 && data[11] == 0x50) {
            return "image/webp";
        }
        if (data != null && startsWith(data, MAGIC_JPEG)) return "image/jpeg";
        throw new ReceiptImportException("Nội dung tệp không hợp lệ.");
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }

    private JsonNode analyzeReceiptWithOcrProvider(byte[] fileBytes) {
        OcrProviderConfig providerConfig = resolveReceiptOcrProvider();
        if (providerConfig == null) {
            throw new ReceiptImportException("OCR API ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\u00ECnh.");
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(fileBytes);
            String requestJson = objectMapper.writeValueAsString(buildGeminiOcrRequest(base64Image, fileBytes));
            String configuredModel = providerConfig.model();
            final String modelToUse = (configuredModel == null || configuredModel.isBlank())
                    ? RECEIPT_OCR_MODEL
                    : configuredModel;

            Exception lastFailure = null;
            for (int attempt = 1; attempt <= providerConfig.maxAttempts(); attempt++) {
                try {
                    String responseJson = providerConfig.restClient().post()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/v1beta/models/{model}:generateContent")
                                    .queryParam("key", providerConfig.apiKeySupplier().get())
                                    .build(modelToUse))
                            .body(requestJson)
                            .retrieve()
                            .body(String.class);

                    if (responseJson == null || responseJson.isBlank()) {
                        throw new ReceiptImportException(providerConfig.providerName() + " OCR kh\u00F4ng tr\u1EA3 v\u1EC1 d\u1EEF li\u1EC7u.");
                    }

                    JsonNode root = objectMapper.readTree(responseJson);
                    String text = extractGeminiText(root);
                    if (text == null || text.isBlank()) {
                        throw new ReceiptImportException(providerConfig.providerName() + " OCR kh\u00F4ng tr\u1EA3 v\u1EC1 k\u1EBFt qu\u1EA3 ph\u00E2n t\u00EDch h\u00F3a \u0111\u01A1n.");
                    }

                    return objectMapper.readTree(sanitizeJsonResponse(text));
                } catch (Exception exception) {
                    lastFailure = exception;
                    if (attempt < providerConfig.maxAttempts()) {
                        log.warn("Receipt OCR attempt {}/{} failed on provider {}. Rotating key. Cause: {}",
                                attempt,
                                providerConfig.maxAttempts(),
                                providerConfig.providerName(),
                                exception.getMessage());
                    }
                }
            }

            throw lastFailure != null
                    ? lastFailure
                    : new ReceiptImportException("Receipt OCR kh\u00F4ng tr\u1EA3 v\u1EC1 k\u1EBFt qu\u1EA3.");
        } catch (Exception exception) {
            throw new ReceiptImportException("Kh\u00F4ng th\u1EC3 k\u1EBFt n\u1ED1i v\u1EDBi OCR API \u0111\u1EC3 ph\u00E2n t\u00EDch h\u00F3a \u0111\u01A1n: " + exception.getMessage(), exception);
        }
    }

    private ObjectNode buildGeminiOcrRequest(String base64Image, byte[] fileBytes) {
        ObjectNode requestBody = objectMapper.createObjectNode();

        ObjectNode sysInstructionNode = objectMapper.createObjectNode();
        ArrayNode sysParts = objectMapper.createArrayNode();
        ObjectNode sysPart = objectMapper.createObjectNode();
        sysPart.put("text", "You are the OCR engine for the Money Manager application. Read the receipt image and return only valid JSON that matches the required schema.");
        sysParts.add(sysPart);
        sysInstructionNode.set("parts", sysParts);
        requestBody.set("systemInstruction", sysInstructionNode);

        ArrayNode contents = objectMapper.createArrayNode();
        ObjectNode contentNode = objectMapper.createObjectNode();
        contentNode.put("role", "user");
        ArrayNode parts = objectMapper.createArrayNode();

        ObjectNode textPart = objectMapper.createObjectNode();
        textPart.put("text", """
                Read the receipt image and return only valid JSON in this schema:
                {
                  "merchant": "string",
                  "location": "string" or null,
                  "receiptDate": "YYYY-MM-DD" or null,
                  "items": [
                    {
                      "name": "string",
                      "amount": number,
                      "categoryHint": "food|transport|shopping|utilities|health|education|entertainment|other"
                    }
                  ]
                }
                Rules:
                - Do not add markdown or any text outside the JSON payload.
                - Extract as many readable line items as possible, not just one line.
                - For receipts with multiple products, return every product in items in the original order.
                - If quantity x unit price is shown, calculate amount = quantity * unit price for that item.
                - Ignore totals, VAT, and discounts unless they are actual purchased items.
                - location is the store location or branch shown on the receipt. Use null when unclear.
                - Use null for receiptDate when the date is missing.
                - Only keep items with amount > 0.
                """);
        parts.add(textPart);

        ObjectNode inlineDataPart = objectMapper.createObjectNode();
        ObjectNode inlineData = objectMapper.createObjectNode();
        inlineData.put("mimeType", canonicalMimeType(fileBytes));
        inlineData.put("data", base64Image);
        inlineDataPart.set("inlineData", inlineData);
        parts.add(inlineDataPart);

        contentNode.set("parts", parts);
        contents.add(contentNode);
        requestBody.set("contents", contents);

        ObjectNode genConfig = objectMapper.createObjectNode();
        genConfig.put("responseMimeType", "application/json");
        requestBody.set("generationConfig", genConfig);
        return requestBody;
    }

    private JsonNode analyzeReceiptWithGemini(MultipartFile file, byte[] fileBytes) {
        try {
            String base64Image = Base64.getEncoder().encodeToString(fileBytes);
            String apiKey = geminiKeyRotator.nextKey();
            String model = geminiProperties.model();

            // 1. Build Gemini native body
            ObjectNode requestBody = objectMapper.createObjectNode();
            
            // systemInstruction
            ObjectNode sysInstructionNode = objectMapper.createObjectNode();
            ArrayNode sysParts = objectMapper.createArrayNode();
            ObjectNode sysPart = objectMapper.createObjectNode();
            sysPart.put("text", "Bạn là hệ thống OCR tài chính cho ứng dụng Money Manager. Hãy đọc ảnh hóa đơn và chỉ trả về JSON hợp lệ theo đúng schema.");
            sysParts.add(sysPart);
            sysInstructionNode.set("parts", sysParts);
            requestBody.set("systemInstruction", sysInstructionNode);

            // contents
            ArrayNode contents = objectMapper.createArrayNode();
            ObjectNode contentNode = objectMapper.createObjectNode();
            contentNode.put("role", "user");
            ArrayNode parts = objectMapper.createArrayNode();

            // text part
            ObjectNode textPart = objectMapper.createObjectNode();
            textPart.put("text", """
                    Hãy đọc ảnh hóa đơn và chỉ trả về JSON hợp lệ theo đúng schema:
                    {
                      "merchant": "string",
                      "location": "string" hoặc null,
                      "receiptDate": "YYYY-MM-DD" hoặc null,
                      "items": [
                        {
                          "name": "string",
                          "amount": number,
                          "categoryHint": "food|transport|shopping|utilities|health|education|entertainment|other"
                        }
                      ]
                    }
                    Quy tắc:
                    - Không thêm markdown, không thêm ký tự thừa ngoài JSON.
                    - BẮT BUỘC trích xuất tối đa số dòng sản phẩm có thể đọc được trong hóa đơn, không chỉ 1 dòng.
                    - Với hóa đơn nhiều sản phẩm, trả về đầy đủ tất cả sản phẩm trong mảng items theo thứ tự xuất hiện.
                    - Nếu có số lượng x đơn giá, hãy tính amount = số lượng * đơn giá cho từng sản phẩm.
                    - Bỏ qua dòng tổng kết như tổng tiền, VAT, giảm giá nếu không phải mặt hàng mua cụ thể.
                    - location là địa điểm/cửa hàng trên hóa đơn (địa chỉ hoặc tên chi nhánh). Nếu không rõ thì null.
                    - Nếu thiếu ngày hóa đơn thì dùng null cho receiptDate.
                    - Chỉ lấy item có amount > 0.
                    """);
            parts.add(textPart);

            // inlineData part
            ObjectNode inlineDataPart = objectMapper.createObjectNode();
            ObjectNode inlineData = objectMapper.createObjectNode();
            inlineData.put("mimeType", canonicalMimeType(fileBytes));
            inlineData.put("data", base64Image);
            inlineDataPart.set("inlineData", inlineData);
            parts.add(inlineDataPart);

            contentNode.set("parts", parts);
            contents.add(contentNode);
            requestBody.set("contents", contents);

            // generationConfig
            ObjectNode genConfig = objectMapper.createObjectNode();
            genConfig.put("responseMimeType", "application/json");
            requestBody.set("generationConfig", genConfig);

            String requestJson = objectMapper.writeValueAsString(requestBody);
            
            String finalModel = model;
            if (finalModel == null || finalModel.isBlank()) {
                finalModel = "gemini-3.1-flash-lite";
            }

            String finalModelParam = finalModel;
            String responseJson = geminiRestClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .queryParam("key", apiKey)
                            .build(finalModelParam))
                    .body(requestJson)
                    .retrieve()
                    .body(String.class);

            if (responseJson == null || responseJson.isBlank()) {
                throw new ReceiptImportException("Gemini OCR không trả về dữ liệu.");
            }

            JsonNode root = objectMapper.readTree(responseJson);
            String text = extractGeminiText(root);
            if (text == null || text.isBlank()) {
                throw new ReceiptImportException("Gemini OCR không trả về kết quả phân tích hóa đơn.");
            }

            String cleanJson = sanitizeJsonResponse(text);
            return objectMapper.readTree(cleanJson);

        } catch (Exception exception) {
            throw new ReceiptImportException("Không thể kết nối với OCR API để phân tích hóa đơn: " + exception.getMessage(), exception);
        }
    }

    private OcrProviderConfig resolveReceiptOcrProvider() {
        if (isOcrProviderConfigured()) {
            return new OcrProviderConfig(
                    "dedicated-ocr",
                    ocrRestClient,
                    ocrKeyRotator::nextKey,
                    ocrProperties.model(),
                    ocrKeyRotator.keyCount()
            );
        }

        if (geminiKeyRotator.hasKeys()) {
            return new OcrProviderConfig(
                    "gemini-fallback",
                    geminiRestClient,
                    geminiKeyRotator::nextKey,
                    geminiProperties.model(),
                    geminiKeyRotator.keyCount()
            );
        }

        return null;
    }

    private boolean isOcrProviderConfigured() {
        return ocrKeyRotator.hasKeys()
                && ocrProperties.baseUrl() != null
                && !ocrProperties.baseUrl().isBlank();
    }

    private String extractGeminiText(JsonNode responseBody) {
        if (responseBody == null) return null;
        JsonNode candidates = responseBody.get("candidates");
        if (candidates == null || !candidates.isArray() || candidates.isEmpty()) return null;
        StringBuilder builder = new StringBuilder();
        for (JsonNode candidate : candidates) {
            JsonNode content = candidate.get("content");
            if (content == null) continue;
            JsonNode parts = content.get("parts");
            if (parts == null || !parts.isArray()) continue;
            for (JsonNode part : parts) {
                JsonNode textNode = part.get("text");
                if (textNode != null && !textNode.isNull()) {
                    if (!builder.isEmpty()) builder.append('\n');
                    builder.append(textNode.asText());
                }
            }
        }
        return builder.toString().trim();
    }

    private ObjectNode buildGptOssOcrRequest(String base64Image, String mimeType, String model) {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", model);
        requestBody.put("stream", false);

        ArrayNode messages = objectMapper.createArrayNode();
        ObjectNode userMessage = objectMapper.createObjectNode();
        userMessage.put("role", "user");

        ArrayNode content = objectMapper.createArrayNode();

        ObjectNode textPart = objectMapper.createObjectNode();
        textPart.put("type", "text");
        textPart.put("text", """
                Bạn là hệ thống OCR tài chính cho ứng dụng Money Manager.
                Hãy đọc ảnh hóa đơn và chỉ trả về JSON hợp lệ theo đúng schema:
                {
                  "merchant": "string",
                  "location": "string" hoặc null,
                  "receiptDate": "YYYY-MM-DD" hoặc null,
                  "items": [
                    {
                      "name": "string",
                      "amount": number,
                      "categoryHint": "food|transport|shopping|utilities|health|education|entertainment|other"
                    }
                  ]
                }
                Quy tắc:
                - Không thêm markdown, không thêm ký tự thừa ngoài JSON.
                - BẮT BUỘC trích xuất tối đa số dòng sản phẩm có thể đọc được trong hóa đơn, không chỉ 1 dòng.
                - Với hóa đơn nhiều sản phẩm, trả về đầy đủ tất cả sản phẩm trong mảng items theo thứ tự xuất hiện.
                - Nếu có số lượng x đơn giá, hãy tính amount = số lượng * đơn giá cho từng sản phẩm.
                - Bỏ qua dòng tổng kết như tổng tiền, VAT, giảm giá nếu không phải mặt hàng mua cụ thể.
                - location là địa điểm/cửa hàng trên hóa đơn (địa chỉ hoặc tên chi nhánh). Nếu không rõ thì null.
                - Nếu thiếu ngày hóa đơn thì dùng null cho receiptDate.
                - Chỉ lấy item có amount > 0.
                """);
        content.add(textPart);

        ObjectNode imagePart = objectMapper.createObjectNode();
        imagePart.put("type", "image_url");

        ObjectNode imageUrl = objectMapper.createObjectNode();
        imageUrl.put("url", "data:" + mimeType + ";base64," + base64Image);
        imagePart.set("image_url", imageUrl);
        content.add(imagePart);

        userMessage.set("content", content);
        messages.add(userMessage);
        requestBody.set("messages", messages);

        return requestBody;
    }

    private String sanitizeJsonResponse(String rawText) {
        String cleaned = rawText.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }
        return cleaned;
    }

    private BigDecimal parseAmount(JsonNode amountNode) {
        if (amountNode == null || amountNode.isNull()) {
            return BigDecimal.ZERO;
        }

        if (amountNode.isNumber()) {
            return amountNode.decimalValue();
        }

        String text = amountNode.asText("").replaceAll("[^\\d]", "").trim();
        if (text.isBlank()) {
            return BigDecimal.ZERO;
        }

        try {
            return new BigDecimal(text);
        } catch (NumberFormatException ignored) {
            return BigDecimal.ZERO;
        }
    }

    private LocalDate parseReceiptDate(String rawDate) {
        if (rawDate == null || rawDate.isBlank() || "null".equalsIgnoreCase(rawDate)) {
            return null;
        }
        try {
            return LocalDate.parse(rawDate.trim());
        } catch (Exception ignored) {
            return null;
        }
    }

    private CategoryEntity resolveCategory(List<CategoryEntity> categories, String hint, String name, CategoryEntity otherCategory) {
        String normalizedHint = normalize(hint);
        String normalizedName = normalize(name);

        if ("other".equals(normalizedHint) || "khac".equals(normalizedHint)) {
            return otherCategory;
        }

        if (!normalizedHint.isBlank()) {
            CategoryEntity exact = categories.stream()
                    .filter(category -> normalizedHint.contains(normalize(category.getName()))
                            || normalize(category.getName()).contains(normalizedHint))
                    .findFirst()
                    .orElse(null);
            if (exact != null) {
                return exact;
            }
        }

        if (!normalizedName.isBlank()) {
            CategoryEntity byName = categories.stream()
                    .filter(category -> normalizedName.contains(normalize(category.getName()))
                            || normalize(category.getName()).contains(normalizedName))
                    .findFirst()
                    .orElse(null);
            if (byName != null) {
                return byName;
            }
        }

        return otherCategory;
    }

    private CategoryEntity ensureOtherExpenseCategory(ProfileEntity profile, List<CategoryEntity> expenseCategories) {
        CategoryEntity existing = categoryRepository
                .findByNameIgnoreCaseAndTypeAndProfileId(OTHER_CATEGORY_NAME, EXPENSE_TYPE, profile.getId())
                .orElse(null);
        if (existing != null) {
            boolean alreadyIncluded = expenseCategories.stream().anyMatch(category -> Objects.equals(category.getId(), existing.getId()));
            if (!alreadyIncluded) {
                expenseCategories.add(existing);
            }
            return existing;
        }

        CategoryEntity created = categoryRepository.save(CategoryEntity.builder()
                .name(OTHER_CATEGORY_NAME)
                .type(EXPENSE_TYPE)
                .icon(OTHER_CATEGORY_ICON)
                .profile(profile)
                .build());
        expenseCategories.add(created);
        return created;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        String decomposed = Normalizer.normalize(value, Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "");

        return decomposed.toLowerCase(Locale.ROOT)
                .replace("đ", "d")
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String safeText(String value) {
        return Objects.requireNonNullElse(value, "").trim();
    }

    private void ensureAiReceiptAccess() {
        if (aiViolationService.isAiBlocked(profileService.getCurrentProfile())) {
            throw new ForbiddenException(
                    "Tính năng AI nhập hóa đơn tạm thời không khả dụng do vi phạm chính sách sử dụng."
            );
        }
    }

    private record OcrProviderConfig(
            String providerName,
            RestClient restClient,
            Supplier<String> apiKeySupplier,
            String model,
            int maxAttempts
    ) {
    }
}
