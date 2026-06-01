package com.example.moneymanager.service;

import com.example.moneymanager.config.GeminiProperties;
import com.example.moneymanager.dto.*;
import com.example.moneymanager.exception.ForbiddenException;
import com.example.moneymanager.entity.*;
import com.example.moneymanager.repository.*;
import com.example.moneymanager.util.AIInstructionPromptBuilder;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIOrchestrationService {

    private static final int MAX_USER_MESSAGE_LENGTH = 800;

    private static final Pattern INJECTION_PATTERN = Pattern.compile(
        "(?i)(ignore|forget|disregard).{0,20}(instruction|above|previous|system|prompt)|" +
        "(?i)(you are now|act as|pretend|roleplay)|" +
        "(?i)return.{0,30}(json|true|false|null)",
        Pattern.CASE_INSENSITIVE
    );

    private final AIChatService aiChatService;
    private final GeminiProperties geminiProperties;
    private final ProfileService profileService;
    private final ChatHistoryService chatHistoryService;
    private final ExpenseService expenseService;
    private final IncomeService incomeService;
    private final CategoryService categoryService;
    private final BudgetService budgetService;
    private final SavingGoalService savingGoalService;
    private final JarService jarService;
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final BudgetRepository budgetRepository;
    private final SavingGoalRepository savingGoalRepository;
    private final ProfileRepository profileRepository;
    private final JarRepository jarRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public AIIntentResponseDTO parseIntentFromChat(AIIntentRequestDTO request) {
        String userMessage = request.getUserMessage();
        if (userMessage == null || userMessage.isBlank()) {
            return AIIntentResponseDTO.builder()
                    .intent("INVALID_REQUEST")
                    .intentType("INVALID")
                    .validationErrors(List.of("Tin nhắn không được để trống."))
                    .build();
        }
        userMessage = sanitizeUserMessage(userMessage);

        String provider = request.getProvider() != null ? request.getProvider() : "gemini";
        String model = request.getModel() != null ? request.getModel() : geminiProperties.model();

        try {
            ProfileEntity profile = profileService.getCurrentProfile();
            SubscriptionPlan plan = profile.getSubscriptionPlan();

            // FREE users cannot use Agent at all
            if (plan == SubscriptionPlan.FREE) {
                throw new ForbiddenException("Nova Money Agent yêu cầu gói BASIC trở lên.");
            }

            String pageContext = request.getPageContext() != null ? request.getPageContext() : "dashboard";
            Map<String, Object> pageData = loadPageData(pageContext, profile);
            String systemPrompt = AIInstructionPromptBuilder.buildSystemPrompt(pageContext, pageData);

            // Trim conversation history to last 5 turns (user+assistant pairs) to keep context sharp
            List<AIChatMessageDTO> trimmedHistory = trimConversationHistory(request.getConversationHistory(), 10);

            String intentInstruction = "<user_request>\n" + userMessage + "\n</user_request>\n\n" +
                    "PHÂN LOẠI INTENT VÀ TRẢ VỀ JSON THUẦN. " +
                    "Bắt đầu { kết thúc }. Không có text ngoài JSON.";

            intentInstruction += " LUU Y: amount/targetAmount/currentAmount phai la so nguyen (vd: 75000, khong phai '75k').";
            String rawResponse = callProviderForIntent(provider, systemPrompt, intentInstruction, trimmedHistory);

            String cleanedJson = extractJson(rawResponse);
            if (cleanedJson == null || cleanedJson.isBlank()) {
                // Retry with a targeted schema reminder (not the full prompt)
                log.warn("AI returned non-JSON response, retrying with schema reminder: {}", rawResponse);
                String schemaReminder = "Yêu cầu: \"" + userMessage + "\". " +
                        "Trả về JSON với các key: intent, intentType, extractedFields, missingFields, confidence, confirmationPrompt hoặc answer. " +
                        "Chỉ JSON, không có text khác.";
                String retryResponse = callProviderForIntent(provider, systemPrompt, schemaReminder, null);
                cleanedJson = extractJson(retryResponse);
                if (cleanedJson != null && !cleanedJson.isBlank()) {
                    rawResponse = retryResponse;
                } else if (rawResponse != null && !rawResponse.isBlank()) {
                    log.warn("Retry also returned non-JSON, treating as answer: {}", retryResponse);
                    return buildAnswerResponse(rawResponse, provider, model);
                } else {
                    throw new RuntimeException("AI không trả về nội dung.");
                }
            }

            Map<String, Object> parsed;
            try {
                parsed = objectMapper.readValue(cleanedJson, new TypeReference<Map<String, Object>>() {});
            } catch (Exception parseError) {
                if (rawResponse != null && !rawResponse.isBlank()) {
                    log.warn("AI intent JSON parse failed, returning raw response as answer: {}", rawResponse, parseError);
                    return buildAnswerResponse(rawResponse, provider, model);
                }
                throw parseError;
            }

            // ── Step 1: Canonicalize intent aliases and field keys ──────────────
            parsed = canonicalizeIntentResponse(parsed);

            String intent = (String) parsed.getOrDefault("intent", "ANSWER_QUESTION");
            String intentType = (String) parsed.getOrDefault("intentType", deriveIntentType(intent));
            Map<String, Object> extractedFields = (Map<String, Object>) parsed.getOrDefault("extractedFields", new HashMap<>());
            Map<String, Object> suggestedValues = (Map<String, Object>) parsed.getOrDefault("suggestedValues", new HashMap<>());
            List<String> validationErrors = (List<String>) parsed.getOrDefault("validationErrors", new ArrayList<>());
            String confirmationPrompt = (String) parsed.get("confirmationPrompt");
            String answer = (String) parsed.get("answer");
            Double confidence = toDouble(parsed.get("confidence"));

            // ── Step 2: Heuristic reclassification ────────────────────────────
            // If AI returns ANSWER_QUESTION but the message has a clear agent verb, do not fall back
            final String finalUserMessage = userMessage;
            if ("ANSWER_QUESTION".equals(intent)) {
                String reclassified = reclassifyByPageContext(finalUserMessage, pageContext, trimmedHistory);
                if (reclassified != null) {
                    intent = reclassified;
                    intentType = "ACTION";
                    confidence = 0.65;
                    log.info("Reclassified to {} based on pageContext={}", intent, pageContext);
                }
            }

            // ── Step 3: Compute missingFields for ACTION intents ───────────────
            List<String> missingFields = (List<String>) parsed.getOrDefault("missingFields", new ArrayList<>());
            if ("ACTION".equals(intentType) && missingFields.isEmpty()) {
                missingFields = computeMissingFields(intent, extractedFields);
            }

            // ── Step 4: Generate confirmationPrompt if absent ─────────────────
            if (confirmationPrompt == null && isCrudIntent(intent)) {
                confirmationPrompt = generateConfirmationPrompt(intent, extractedFields);
            }

            // ── Step 5: Determine response status ─────────────────────────────
            String status = "ANSWER_QUESTION".equals(intent) ? "SUCCESS" : "NEED_CONFIRMATION";

            String sessionId = persistAgentUserMessage(request.getSessionId(), profile.getId(), userMessage, intent, answer);

            return AIIntentResponseDTO.builder()
                    .status(status)
                    .sessionId(sessionId)
                    .intent(intent)
                    .intentType(intentType)
                    .extractedFields(extractedFields)
                    .suggestedValues(suggestedValues)
                    .validationErrors(validationErrors)
                    .missingFields(missingFields)
                    .confirmationPrompt(confirmationPrompt)
                    .answer(answer)
                    .confidence(confidence)
                    .provider(provider)
                    .modelUsed(model)
                    .build();
        } catch (ForbiddenException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error parsing intent: {}", e.getMessage(), e);
            try {
                AIChatResponseDTO fallback = aiChatService.chat(AIChatRequestDTO.builder()
                        .provider(provider)
                        .model(model)
                        .messages(buildMessages(request))
                        .build());
                String reply = fallback.getReply();
                if (reply == null || reply.contains("sự cố") || reply.contains("chưa được cấu hình")) {
                    log.warn("Fallback AI returned error message, using neutral response");
                    reply = "Mô hình AI đang bận. Vui lòng thử lại sau vài giây nhé.";
                }
                return AIIntentResponseDTO.builder()
                        .intent("ANSWER_QUESTION")
                        .intentType("QUESTION")
                        .answer(reply)
                        .provider(fallback.getProvider())
                        .modelUsed(fallback.getModelUsed())
                        .build();
            } catch (Exception fallbackError) {
                return AIIntentResponseDTO.builder()
                        .intent("ANSWER_QUESTION")
                        .intentType("QUESTION")
                        .answer("Xin lỗi, tôi chưa xử lý được yêu cầu này. Bạn thử lại nhé.")
                        .build();
            }
        }
    }

    public AIConfirmActionResponseDTO executeConfirmedIntent(AIConfirmActionRequestDTO request) {
        ProfileEntity profile = profileService.getCurrentProfile();

        // FREE users cannot execute any Agent actions \u2014 block direct API calls too
        if (profile.getSubscriptionPlan() == SubscriptionPlan.FREE) {
            return AIConfirmActionResponseDTO.builder()
                    .status("ERROR")
                    .message("Nova Money Agent y\u00EAu c\u1EA7u g\u00F3i BASIC tr\u1EDF l\u00EAn.")
                    .build();
        }

        String intent = request.getIntent();
        Map<String, Object> data = request.getExtractedData();

        if (intent == null || data == null) {
            return AIConfirmActionResponseDTO.builder()
                    .status("ERROR")
                    .message("D\u1EEF li\u1EC7u kh\u00F4ng h\u1EE3p l\u1EC7.")
                    .build();
        }

        try {
            String validationError = validateIntentData(intent, data, profile);
            if (validationError != null) {
                return AIConfirmActionResponseDTO.builder()
                        .status("ERROR")
                        .message(validationError)
                        .build();
            }

            String resultMessage = executeIntent(intent, data, profile);

            persistAgentAssistantMessage(request.getSessionId(), resultMessage);

            return AIConfirmActionResponseDTO.builder()
                    .status("SUCCESS")
                    .message(resultMessage)
                    .undoable(false)
                    .build();
        } catch (Exception e) {
            log.error("Error executing intent {}: {}", intent, e.getMessage(), e);
            return AIConfirmActionResponseDTO.builder()
                    .status("ERROR")
                    .message("L\u1ED7i: " + e.getMessage())
                    .build();
        }
    }

    private String validateIntentData(String intent, Map<String, Object> data, ProfileEntity profile) {
        return switch (intent) {
            case "CREATE_EXPENSE", "UPDATE_EXPENSE" -> {
                Object amountObj = data.get("amount");
                if (amountObj == null) yield "Vui l\u00F2ng nh\u1EADp s\u1ED1 ti\u1EC1n.";
                BigDecimal amount = toBigDecimal(amountObj, "amount");
                if (amount.compareTo(BigDecimal.ZERO) <= 0) yield "S\u1ED1 ti\u1EC1n ph\u1EA3i l\u1EDBn h\u01A1n 0.";
                String catName = (String) data.get("categoryName");
                if (catName == null || catName.isBlank()) yield "Vui l\u00F2ng ch\u1ECDn danh m\u1EE5c.";
                yield null;
            }
            case "CREATE_INCOME", "UPDATE_INCOME" -> {
                Object amountObj = data.get("amount");
                if (amountObj == null) yield "Vui l\u00F2ng nh\u1EADp s\u1ED1 ti\u1EC1n.";
                BigDecimal amount = toBigDecimal(amountObj, "amount");
                if (amount.compareTo(BigDecimal.ZERO) <= 0) yield "S\u1ED1 ti\u1EC1n ph\u1EA3i l\u1EDBn h\u01A1n 0.";
                String catNameIncome = (String) data.get("categoryName");
                if (catNameIncome == null || catNameIncome.isBlank()) yield "Vui l\u00F2ng ch\u1ECDn danh m\u1EE5c.";
                yield null;
            }
            case "CREATE_CATEGORY", "UPDATE_CATEGORY" -> {
                String name = (String) data.get("name");
                if (name == null || name.isBlank()) yield "Vui l\u00F2ng nh\u1EADp t\u00EAn danh m\u1EE5c.";
                yield null;
            }
            case "CREATE_BUDGET", "UPDATE_BUDGET" -> {
                Object amountObj = data.get("amount");
                if (amountObj == null) yield "Vui l\u00F2ng nh\u1EADp s\u1ED1 ti\u1EC1n ng\u00E2n s\u00E1ch.";
                BigDecimal amount = toBigDecimal(amountObj, "amount");
                if (amount.compareTo(BigDecimal.ZERO) <= 0) yield "S\u1ED1 ti\u1EC1n ng\u00E2n s\u00E1ch ph\u1EA3i l\u1EDBn h\u01A1n 0.";
                String catName = (String) data.get("categoryName");
                if (catName == null || catName.isBlank()) yield "Vui l\u00F2ng ch\u1ECDn danh m\u1EE5c.";
                yield null;
            }
            case "CREATE_SAVING_GOAL", "UPDATE_SAVING_GOAL" -> {
                String name = (String) data.get("name");
                if (name == null || name.isBlank()) yield "Vui l\u00F2ng nh\u1EADp t\u00EAn m\u1EE5c ti\u00EAu.";
                Object targetObj = data.get("targetAmount");
                if (targetObj == null) yield "Vui l\u00F2ng nh\u1EADp s\u1ED1 ti\u1EC1n m\u1EE5c ti\u00EAu.";
                BigDecimal targetAmount = toBigDecimal(targetObj, "targetAmount");
                if (targetAmount.compareTo(BigDecimal.ZERO) <= 0) yield "S\u1ED1 ti\u1EC1n m\u1EE5c ti\u00EAu ph\u1EA3i l\u1EDBn h\u01A1n 0.";
                yield null;
            }
            case "CREATE_JAR" -> {
                String name = (String) data.get("name");
                if (name == null || name.isBlank()) yield "Vui l\u00F2ng nh\u1EADp t\u00EAn h\u0169.";
                Object pctObj = data.get("targetPercentage");
                if (pctObj != null) {
                    BigDecimal pct = toBigDecimal(pctObj, "targetPercentage");
                    if (pct.compareTo(BigDecimal.ZERO) < 0 || pct.compareTo(new BigDecimal("100")) > 0)
                        yield "T\u1EF7 l\u1EC7 ph\u00E2n b\u1ED5 ph\u1EA3i trong kho\u1EA3ng 0-100%.";
                }
                yield null;
            }
            case "UPDATE_JAR" -> {
                Object pctObj = data.get("targetPercentage");
                if (pctObj != null) {
                    BigDecimal pct = toBigDecimal(pctObj, "targetPercentage");
                    if (pct.compareTo(BigDecimal.ZERO) < 0 || pct.compareTo(new BigDecimal("100")) > 0)
                        yield "T\u1EF7 l\u1EC7 ph\u00E2n b\u1ED5 ph\u1EA3i trong kho\u1EA3ng 0-100%.";
                }
                yield null;
            }
            case "DELETE_JAR" -> null;
            case "TRANSFER_JAR" -> {
                Object amountObj = data.get("amount");
                if (amountObj == null) yield "Vui l\u00F2ng nh\u1EADp s\u1ED1 ti\u1EC1n.";
                BigDecimal amount = toBigDecimal(amountObj, "amount");
                if (amount.compareTo(BigDecimal.ZERO) <= 0) yield "S\u1ED1 ti\u1EC1n ph\u1EA3i l\u1EDBn h\u01A1n 0.";
                String fromJarName = (String) data.get("fromJarName");
                String toJarName = (String) data.get("toJarName");
                if (fromJarName == null || fromJarName.isBlank()) yield "Vui l\u00F2ng ch\u1ECDn h\u0169 ngu\u1ED3n.";
                if (toJarName == null || toJarName.isBlank()) yield "Vui l\u00F2ng ch\u1ECDn h\u0169 \u0111\u00EDch.";
                if (fromJarName.equals(toJarName)) yield "Kh\u00F4ng th\u1EC3 chuy\u1EC3n ti\u1EC1n v\u00E0o c\u00F9ng m\u1ED9t h\u0169.";
                Long fromId = findJarId(fromJarName, profile.getId());
                Long toId = findJarId(toJarName, profile.getId());
                if (fromId == null) yield "Kh\u00F4ng t\u00ECm th\u1EA5y h\u0169 \"" + fromJarName + "\".";
                if (toId == null) yield "Kh\u00F4ng t\u00ECm th\u1EA5y h\u0169 \"" + toJarName + "\".";
                yield null;
            }
            default -> null;
        };
    }

    private String executeIntent(String intent, Map<String, Object> data, ProfileEntity profile) {
        return switch (intent) {
            case "CREATE_EXPENSE" -> {
                String catNameExp = (String) data.get("categoryName");
                Long catIdExp = findCategoryId(catNameExp, profile.getId(), "expense");
                if (catIdExp == null) {
                    String available = String.join(", ", categoryRepository.findByTypeAndProfileId("expense", profile.getId())
                            .stream().map(CategoryEntity::getName).toList());
                    yield "\u26A0\uFE0F Kh\u00F4ng t\u00ECm th\u1EA5y danh m\u1EE5c \"" + catNameExp + "\". Danh m\u1EE5c chi ti\u00EAu hi\u1EC7n c\u00F3: " + (available.isBlank() ? "(ch\u01B0a c\u00F3)" : available);
                }
                ExpenseDTO dto = mapToExpenseDTO(data, catIdExp);
                Long jarId = extractJarId(data, profile);
                if (jarId != null) {
                    dto.setJarId(jarId);
                    jarRepository.findById(jarId).ifPresent(j -> dto.setJarName(j.getName()));
                }
                expenseService.addExpense(dto);
                String jarInfo = dto.getJarId() != null ? " v\u00E0o h\u0169 " + dto.getJarName() : "";
                yield "\u2705 \u0110\u00E3 t\u1EA1o chi ti\u00EAu " + formatCurrency(dto.getAmount()) + "\u0111 cho " + dto.getCategoryName() + jarInfo;
            }
            case "UPDATE_EXPENSE" -> updateExpenseFromAI(data, profile);
            case "CREATE_INCOME" -> {
                String catNameInc = (String) data.get("categoryName");
                Long catIdInc = findCategoryId(catNameInc, profile.getId(), "income");
                if (catIdInc == null) {
                    String available = String.join(", ", categoryRepository.findByTypeAndProfileId("income", profile.getId())
                            .stream().map(CategoryEntity::getName).toList());
                    yield "\u26A0\uFE0F Kh\u00F4ng t\u00ECm th\u1EA5y danh m\u1EE5c \"" + catNameInc + "\". Danh m\u1EE5c thu nh\u1EADp hi\u1EC7n c\u00F3: " + (available.isBlank() ? "(ch\u01B0a c\u00F3)" : available);
                }
                IncomeDTO dto = mapToIncomeDTO(data, catIdInc);
                incomeService.addIncome(dto);
                yield "\u2705 \u0110\u00E3 t\u1EA1o thu nh\u1EADp " + formatCurrency(dto.getAmount()) + "\u0111";
            }
            case "UPDATE_INCOME" -> updateIncomeFromAI(data, profile);
            case "CREATE_CATEGORY" -> {
                CategoryDTO dto = mapToCategoryDTO(data);
                CategoryDTO result = categoryService.saveCategory(dto);
                yield "\u2705 \u0110\u00E3 t\u1EA1o danh m\u1EE5c \"" + result.getName() + "\"";
            }
            case "UPDATE_CATEGORY" -> updateCategoryFromAI(data, profile);
            case "CREATE_BUDGET" -> {
                BudgetDTO dto = mapToBudgetDTO(data, profile);
                budgetService.setBudget(dto);
                yield "\u2705 \u0110\u00E3 t\u1EA1o ng\u00E2n s\u00E1ch " + formatCurrency(dto.getAmountLimit()) + "\u0111 cho " + dto.getCategoryName();
            }
            case "UPDATE_BUDGET" -> updateBudgetFromAI(data, profile);
            case "CREATE_SAVING_GOAL" -> {
                SavingGoalDTO dto = mapToSavingGoalDTO(data);
                savingGoalService.createGoal(dto);
                yield "\u2705 \u0110\u00E3 t\u1EA1o m\u1EE5c ti\u00EAu \"" + dto.getName() + "\"";
            }
            case "UPDATE_SAVING_GOAL" -> updateSavingGoalFromAI(data);
            case "DELETE_EXPENSE" -> {
                Object idObj = data.get("expenseId");
                if (idObj != null) {
                    expenseService.deleteExpense(toLong(idObj));
                    yield "\u2705 \u0110\u00E3 x\u00F3a chi ti\u00EAu.";
                }
                yield "\u26A0\uFE0F Kh\u00F4ng t\u00ECm th\u1EA5y chi ti\u00EAu \u0111\u1EC3 x\u00F3a.";
            }
            case "DELETE_INCOME" -> {
                Object idObj = data.get("incomeId");
                if (idObj != null) {
                    incomeService.deleteIncome(toLong(idObj));
                    yield "\u2705 \u0110\u00E3 x\u00F3a thu nh\u1EADp.";
                }
                yield "\u26A0\uFE0F Kh\u00F4ng t\u00ECm th\u1EA5y thu nh\u1EADp \u0111\u1EC3 x\u00F3a.";
            }
            case "DELETE_CATEGORY" -> {
                Object idObj = data.get("categoryId");
                if (idObj != null) {
                    categoryService.deleteCategory(toLong(idObj));
                    yield "\u2705 \u0110\u00E3 x\u00F3a danh m\u1EE5c.";
                }
                yield "\u26A0\uFE0F Kh\u00F4ng t\u00ECm th\u1EA5y danh m\u1EE5c \u0111\u1EC3 x\u00F3a.";
            }
            case "DELETE_BUDGET" -> {
                Object idObj = data.get("budgetId");
                if (idObj != null) {
                    budgetService.deleteBudget(toLong(idObj));
                    yield "\u2705 \u0110\u00E3 x\u00F3a ng\u00E2n s\u00E1ch.";
                }
                yield "\u26A0\uFE0F Kh\u00F4ng t\u00ECm th\u1EA5y ng\u00E2n s\u00E1ch \u0111\u1EC3 x\u00F3a.";
            }
            case "DELETE_SAVING_GOAL" -> {
                Object idObj = data.get("savingGoalId");
                if (idObj != null) {
                    savingGoalService.deleteGoal(toLong(idObj));
                    yield "\u2705 \u0110\u00E3 x\u00F3a m\u1EE5c ti\u00EAu ti\u1EBFt ki\u1EC7m.";
                }
                yield "\u26A0\uFE0F Kh\u00F4ng t\u00ECm th\u1EA5y m\u1EE5c ti\u00EAu \u0111\u1EC3 x\u00F3a.";
            }
            case "CREATE_JAR" -> {
                String name = (String) data.get("name");
                String icon = (String) data.getOrDefault("icon", "\uD83C\uDFEB");
                String color = (String) data.getOrDefault("color", "#4CAF50");
                BigDecimal targetPct = data.get("targetPercentage") != null ? toBigDecimal(data.get("targetPercentage")) : BigDecimal.ZERO;
                JarDTO jarDTO = JarDTO.builder()
                        .name(name)
                        .icon(icon)
                        .color(color)
                        .targetPercentage(targetPct)
                        .build();
                JarDTO result = jarService.createJar(jarDTO);
                yield "\u2705 \u0110\u00E3 t\u1EA1o h\u0169 \"" + result.getName() + "\"" + (targetPct.compareTo(BigDecimal.ZERO) > 0 ? " v\u1EDBi " + targetPct + "% ph\u00E2n b\u1ED5" : "");
            }
            case "UPDATE_JAR" -> {
                String jarName = (String) data.get("jarName");
                Long jarId = findJarId(jarName, profile.getId());
                if (jarId == null) {
                    String available = String.join(", ", jarRepository.findByProfile(profile).stream().map(JarEntity::getName).toList());
                    yield "\u26A0\uFE0F Kh\u00F4ng t\u00ECm th\u1EA5y h\u0169 \"" + jarName + "\". H\u0169 hi\u1EC7n c\u00F3: " + (available.isBlank() ? "(ch\u01B0a c\u00F3)" : available);
                }
                JarEntity existingJar = jarRepository.findById(jarId)
                        .orElseThrow(() -> new RuntimeException("Kh\u00F4ng t\u00ECm th\u1EA5y h\u0169"));
                JarDTO jarDTO = JarDTO.builder()
                        .name(data.get("name") != null ? (String) data.get("name") : existingJar.getName())
                        .icon(data.get("icon") != null ? (String) data.get("icon") : existingJar.getIcon())
                        .color(data.get("color") != null ? (String) data.get("color") : existingJar.getColor())
                        .targetPercentage(data.get("targetPercentage") != null
                                ? toBigDecimal(data.get("targetPercentage"), "targetPercentage")
                                : existingJar.getTargetPercentage())
                        .build();
                JarDTO result = jarService.updateJar(jarId, jarDTO);
                yield "\u2705 \u0110\u00E3 c\u1EADp nh\u1EADt h\u0169 \"" + result.getName() + "\"";
            }
            case "DELETE_JAR" -> {
                String jarName = (String) data.get("jarName");
                Long jarId = findJarId(jarName, profile.getId());
                if (jarId == null) {
                    String available = String.join(", ", jarRepository.findByProfile(profile).stream().map(JarEntity::getName).toList());
                    yield "\u26A0\uFE0F Kh\u00F4ng t\u00ECm th\u1EA5y h\u0169 \"" + jarName + "\". H\u0169 hi\u1EC7n c\u00F3: " + (available.isBlank() ? "(ch\u01B0a c\u00F3)" : available);
                }
                jarService.deleteJar(jarId);
                yield "\u2705 \u0110\u00E3 x\u00F3a h\u0169 \"" + jarName + "\".";
            }
            case "TRANSFER_JAR" -> {
                String fromJarName = (String) data.get("fromJarName");
                String toJarName = (String) data.get("toJarName");
                BigDecimal amount = toBigDecimal(data.get("amount"));
                Long fromId = findJarId(fromJarName, profile.getId());
                Long toId = findJarId(toJarName, profile.getId());
                jarService.transferBalance(fromId, toId, amount);
                yield "\u2705 \u0110\u00E3 chuy\u1EC3n " + formatCurrency(amount) + "\u0111 t\u1EEB \"" + fromJarName + "\" sang \"" + toJarName + "\".";
            }
            default -> throw new IllegalArgumentException("Intent kh\u00F4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3: " + intent);
        };
    }

    private String updateExpenseFromAI(Map<String, Object> data, ProfileEntity profile) {
        Object idObj = data.get("expenseId");
        if (idObj == null) return "\u26A0\uFE0F C\u1EA7n ID chi ti\u00EAu \u0111\u1EC3 c\u1EADp nh\u1EADt.";
        Long expenseId = toLong(idObj);
        ExpenseEntity entity = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Kh\u00F4ng t\u00ECm th\u1EA5y chi ti\u00EAu"));
        if (!entity.getProfile().getId().equals(profile.getId()))
            throw new RuntimeException("Kh\u00F4ng c\u00F3 quy\u1EC1n s\u1EEDa chi ti\u00EAu n\u00E0y");
        if (data.get("amount") != null) entity.setAmount(toBigDecimal(data.get("amount")));
        if (data.get("categoryName") != null) {
            String catName = (String) data.get("categoryName");
            Long catId = findCategoryId(catName, profile.getId(), "expense");
            if (catId != null) {
                entity.setCategory(categoryRepository.findById(catId).orElse(entity.getCategory()));
            }
        }
        if (data.get("date") != null) entity.setDate(parseDate((String) data.get("date")));
        if (data.get("jarName") != null) {
            Long jarId = findJarId((String) data.get("jarName"), profile.getId());
            if (jarId != null) {
                entity.setJar(jarRepository.findById(jarId).orElse(null));
            }
        }
        String catDisplayName = entity.getCategory() != null ? entity.getCategory().getName() : "danh m\u1EE5c";
        expenseRepository.save(entity);
        return "\u2705 \u0110\u00E3 c\u1EADp nh\u1EADt chi ti\u00EAu " + formatCurrency(entity.getAmount()) + "\u0111 cho " + catDisplayName;
    }

    private String updateIncomeFromAI(Map<String, Object> data, ProfileEntity profile) {
        Object idObj = data.get("incomeId");
        if (idObj == null) return "\u26A0\uFE0F C\u1EA7n ID thu nh\u1EADp \u0111\u1EC3 c\u1EADp nh\u1EADt.";
        Long incomeId = toLong(idObj);
        IncomeEntity entity = incomeRepository.findById(incomeId)
                .orElseThrow(() -> new RuntimeException("Kh\u00F4ng t\u00ECm th\u1EA5y thu nh\u1EADp"));
        if (!entity.getProfile().getId().equals(profile.getId()))
            throw new RuntimeException("Kh\u00F4ng c\u00F3 quy\u1EC1n s\u1EEDa thu nh\u1EADp n\u00E0y");
        if (data.get("amount") != null) entity.setAmount(toBigDecimal(data.get("amount")));
        if (data.get("categoryName") != null) {
            String catName = (String) data.get("categoryName");
            Long catId = findCategoryId(catName, profile.getId(), "income");
            if (catId != null) {
                entity.setCategory(categoryRepository.findById(catId).orElse(entity.getCategory()));
            }
        }
        if (data.get("date") != null) entity.setDate(parseDate((String) data.get("date")));
        incomeRepository.save(entity);
        return "\u2705 \u0110\u00E3 c\u1EADp nh\u1EADt thu nh\u1EADp " + formatCurrency(entity.getAmount()) + "\u0111";
    }

    private String updateCategoryFromAI(Map<String, Object> data, ProfileEntity profile) {
        Object idObj = data.get("categoryId");
        if (idObj == null) return "\u26A0\uFE0F C\u1EA7n ID danh m\u1EE5c \u0111\u1EC3 c\u1EADp nh\u1EADt.";
        Long categoryId = toLong(idObj);
        CategoryEntity existing = categoryRepository.findByIdAndProfileId(categoryId, profile.getId())
                .orElseThrow(() -> new RuntimeException("Kh\u00F4ng t\u00ECm th\u1EA5y danh m\u1EE5c ho\u1EB7c kh\u00F4ng c\u00F3 quy\u1EC1n s\u1EEDa"));
        CategoryDTO dto = CategoryDTO.builder()
                .id(categoryId)
                .name((String) data.get("name"))
                .icon((String) data.getOrDefault("icon", existing.getIcon()))
                .type((String) data.getOrDefault("type", existing.getType()))
                .build();
        categoryService.updateCategory(categoryId, dto);
        return "\u2705 \u0110\u00E3 c\u1EADp nh\u1EADt danh m\u1EE5c \"" + dto.getName() + "\"";
    }

    private String updateBudgetFromAI(Map<String, Object> data, ProfileEntity profile) {
        Object idObj = data.get("budgetId");
        if (idObj == null) return "\u26A0\uFE0F C\u1EA7n ID ng\u00E2n s\u00E1ch \u0111\u1EC3 c\u1EADp nh\u1EADt.";
        Long budgetId = toLong(idObj);
        BudgetEntity entity = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Kh\u00F4ng t\u00ECm th\u1EA5y ng\u00E2n s\u00E1ch"));
        if (!entity.getProfile().getId().equals(profile.getId()))
            throw new RuntimeException("Kh\u00F4ng c\u00F3 quy\u1EC1n s\u1EEDa ng\u00E2n s\u00E1ch n\u00E0y");
        if (data.get("amount") != null) entity.setAmountLimit(toBigDecimal(data.get("amount")));
        if (data.get("categoryName") != null) {
            String catName = (String) data.get("categoryName");
            Long catId = findCategoryId(catName, profile.getId(), "expense");
            if (catId != null) {
                entity.setCategory(categoryRepository.findById(catId).orElse(entity.getCategory()));
            }
        }
        String catDisplayName = entity.getCategory() != null ? entity.getCategory().getName() : "danh mục";
        budgetRepository.save(entity);
        return "\u2705 \u0110\u00E3 c\u1EADp nh\u1EADt ng\u00E2n s\u00E1ch " + formatCurrency(entity.getAmountLimit()) + "\u0111 cho " + catDisplayName;
    }

    private String updateSavingGoalFromAI(Map<String, Object> data) {
        Object idObj = data.get("savingGoalId");
        if (idObj == null) return "\u26A0\uFE0F C\u1EA7n ID m\u1EE5c ti\u00EAu \u0111\u1EC3 c\u1EADp nh\u1EADt.";
        Long goalId = toLong(idObj);
        SavingGoalEntity existing = savingGoalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Kh\u00F4ng t\u00ECm th\u1EA5y m\u1EE5c ti\u00EAu ti\u1EBFt ki\u1EC7m"));
        String name = data.get("name") != null ? (String) data.get("name") : existing.getName();
        BigDecimal targetAmount = data.get("targetAmount") != null
                ? toBigDecimal(data.get("targetAmount"))
                : existing.getTargetAmount();
        SavingGoalDTO dto = SavingGoalDTO.builder()
                .id(goalId)
                .name(name)
                .targetAmount(targetAmount)
                .build();
        savingGoalService.updateGoal(goalId, dto);
        return "\u2705 \u0110\u00E3 c\u1EADp nh\u1EADt m\u1EE5c ti\u00EAu \"" + dto.getName() + "\"";
    }

    private String generateConfirmationPrompt(String intent, Map<String, Object> data) {
        return switch (intent) {
            case "CREATE_EXPENSE" -> {
                Object amount = data.get("amount");
                Object category = data.get("categoryName");
                Object date = data.get("date");
                yield String.format("B\u1EA1n mu\u1ED1n t\u1EA1o chi ti\u00EAu %s\u0111 cho %s v\u00E0o ng\u00E0y %s, \u0111\u00FAng kh\u00F4ng?",
                        amount != null ? formatCurrency(toBigDecimal(amount)) : "?",
                        category != null ? category : "?",
                        date != null ? date : "h\u00F4m nay");
            }
            case "CREATE_INCOME" -> {
                Object amount = data.get("amount");
                yield String.format("B\u1EA1n mu\u1ED1n t\u1EA1o thu nh\u1EADp %s\u0111, \u0111\u00FAng kh\u00F4ng?",
                        amount != null ? formatCurrency(toBigDecimal(amount)) : "?");
            }
            case "CREATE_CATEGORY" -> {
                Object name = data.get("name");
                yield String.format("B\u1EA1n mu\u1ED1n t\u1EA1o danh m\u1EE5c \"%s\", \u0111\u00FAng kh\u00F4ng?", name != null ? name : "?");
            }
            case "CREATE_BUDGET" -> {
                Object amount = data.get("amount");
                Object category = data.get("categoryName");
                yield String.format("B\u1EA1n mu\u1ED1n \u0111\u1EB7t ng\u00E2n s\u00E1ch %s\u0111 cho %s, \u0111\u00FAng kh\u00F4ng?",
                        amount != null ? formatCurrency(toBigDecimal(amount)) : "?",
                        category != null ? category : "?");
            }
            case "CREATE_JAR" -> {
                Object name = data.get("name");
                Object pct = data.get("targetPercentage");
                yield String.format("B\u1EA1n mu\u1ED1n t\u1EA1o h\u0169 \"%s\"%s, \u0111\u00FAng kh\u00F4ng?",
                        name != null ? name : "?",
                        pct != null ? " v\u1EDBi " + pct + "% ph\u00E2n b\u1ED5" : "");
            }
            case "TRANSFER_JAR" -> {
                Object amount = data.get("amount");
                Object from = data.get("fromJarName");
                Object to = data.get("toJarName");
                yield String.format("B\u1EA1n mu\u1ED1n chuy\u1EC3n %s\u0111 t\u1EEB \"%s\" sang \"%s\", \u0111\u00FAng kh\u00F4ng?",
                        amount != null ? formatCurrency(toBigDecimal(amount)) : "?",
                        from != null ? from : "?",
                        to != null ? to : "?");
            }
            default -> "B\u1EA1n x\u00E1c nh\u1EADn th\u1EF1c hi\u1EC7n thao t\u00E1c n\u00E0y?";
        };
    }

    private String extractJson(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.startsWith("```")) {
            int firstNewline = s.indexOf('\n');
            if (firstNewline != -1) s = s.substring(firstNewline + 1).trim();
            int closingFence = s.lastIndexOf("```");
            if (closingFence != -1) s = s.substring(0, closingFence).trim();
        }
        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return s.substring(start, end + 1);
        }
        return null;
    }

    private AIIntentResponseDTO buildAnswerResponse(String answer, String provider, String model) {
        return AIIntentResponseDTO.builder()
                .status("SUCCESS")
                .intent("ANSWER_QUESTION")
                .answer(answer)
                .provider(provider)
                .modelUsed(model)
                .build();
    }

    private String callProviderForIntent(String provider, String systemPrompt, String userMessage, List<AIChatMessageDTO> history) {
        List<AIChatMessageDTO> messages = new ArrayList<>();
        if (history != null) {
            messages.addAll(history);
            // Tránh lỗi trùng lặp consecutive user role trong API Gemini
            if (!messages.isEmpty() && "user".equals(messages.get(messages.size() - 1).getRole())) {
                messages.remove(messages.size() - 1);
            }
        }
        messages.add(AIChatMessageDTO.builder().role("user").content(userMessage).build());

        AIChatRequestDTO chatRequest = AIChatRequestDTO.builder()
                .provider(provider != null ? provider : "gemini")
                .model(geminiProperties.model())
                .messages(messages)
                .build();

        return aiChatService.chatWithSystemPrompt(systemPrompt, chatRequest);
    }

    private List<AIChatMessageDTO> buildMessages(AIIntentRequestDTO request) {
        List<AIChatMessageDTO> messages = new ArrayList<>();
        if (request.getConversationHistory() != null) {
            messages.addAll(request.getConversationHistory());
            // Tránh lỗi trùng lặp consecutive user role trong API Gemini
            if (!messages.isEmpty() && "user".equals(messages.get(messages.size() - 1).getRole())) {
                messages.remove(messages.size() - 1);
            }
        }
        messages.add(AIChatMessageDTO.builder().role("user").content(request.getUserMessage()).build());
        return messages;
    }

    private Map<String, Object> loadPageData(String pageContext, ProfileEntity profile) {
        Map<String, Object> result = new HashMap<>();
        try {
            // Always load jars for all contexts to ensure AI has context of user's spending jars
            try {
                List<JarDTO> jars = jarService.getAllJars();
                result.put("jars", jars.stream().map(j -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", j.getId());
                    m.put("name", j.getName());
                    m.put("icon", j.getIcon() != null ? j.getIcon() : "");
                    m.put("color", j.getColor());
                    m.put("targetPercentage", j.getTargetPercentage());
                    m.put("currentBalance", j.getCurrentBalance());

                    try {
                        List<ExpenseEntity> jarExpenses = expenseRepository.findTop5ByJarIdOrderByDateDesc(j.getId());
                        m.put("recentExpenses", jarExpenses.stream().map(e -> {
                            Map<String, Object> em = new HashMap<>();
                            em.put("id", e.getId());
                            em.put("amount", e.getAmount());
                            em.put("categoryName", e.getCategory() != null ? e.getCategory().getName() : "");
                            em.put("date", e.getDate() != null ? e.getDate().toString() : "");
                            em.put("name", e.getName() != null ? e.getName() : "");
                            return em;
                        }).toList());
                    } catch (Exception ex) {
                        m.put("recentExpenses", List.of());
                    }

                    return m;
                }).toList());
            } catch (Exception e) {
                log.warn("Could not load jars for AI context: {}", e.getMessage());
            }

            switch (pageContext.trim().toLowerCase()) {
                case "category" -> {
                    List<CategoryDTO> categories = categoryService.getCategoriesForCurrentUser();
                    result.put("categories", categories.stream().map(c -> Map.of("id", c.getId(), "name", c.getName(), "type", c.getType())).toList());
                }
                case "expense" -> {
                    List<CategoryDTO> categories = categoryService.getCategoriesForCurrentUser();
                    result.put("categories", categories.stream().map(c -> Map.of("id", c.getId(), "name", c.getName(), "type", c.getType())).toList());
                    result.put("totalExpenseCount", expenseService.getTotalExpenseCountForCurrentUser());
                    result.put("totalExpenseAmount", expenseService.getTotalExpenseForCurrentUser());
                    List<ExpenseDTO> recent = expenseService.getLatest5ExpensesForCurrentUser();
                    result.put("recentExpenses", recent.stream().map(e -> buildExpenseMap(e)).toList());
                }
                case "income" -> {
                    List<CategoryDTO> categories = categoryService.getCategoriesForCurrentUser();
                    result.put("categories", categories.stream().map(c -> Map.of("id", c.getId(), "name", c.getName(), "type", c.getType())).toList());
                    result.put("totalIncomeCount", incomeService.getTotalIncomeCountForCurrentUser());
                    result.put("totalIncomeAmount", incomeService.getTotalIncomeForCurrentUser());
                    List<IncomeDTO> recent = incomeService.getLatest5IncomesForCurrentUser();
                    result.put("recentIncomes", recent.stream().map(i -> buildIncomeMap(i)).toList());
                }
                case "budget" -> {
                    List<CategoryDTO> categories = categoryService.getCategoriesForCurrentUser();
                    result.put("categories", categories.stream().map(c -> Map.of("id", c.getId(), "name", c.getName(), "type", c.getType())).toList());
                    List<BudgetDTO> budgets = budgetService.getBudgetsForCurrentMonth();
                    result.put("budgets", budgets.stream().map(b -> Map.of("id", b.getId(), "categoryName", b.getCategoryName(), "amount", b.getAmountLimit())).toList());
                }
                case "savinggoals" -> {
                    List<SavingGoalDTO> goals = savingGoalService.getAllGoals();
                    result.put("savingGoals", goals.stream().map(g -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", g.getId());
                        m.put("name", g.getName());
                        m.put("targetAmount", g.getTargetAmount());
                        m.put("currentAmount", g.getCurrentAmount());
                        m.put("remainingAmount", g.getRemainingAmount());
                        m.put("progressPercent", g.getProgressPercent());
                        m.put("monthlyTarget", g.getMonthlyTarget());
                        m.put("monthlyContributed", g.getMonthlyContributed());
                        m.put("isBehindSchedule", g.getIsBehindSchedule());
                        m.put("startDate", g.getStartDate());
                        m.put("targetDate", g.getTargetDate());
                        return m;
                    }).toList());
                }
                case "jars" -> {
                    List<JarDTO> jars = jarService.getAllJars();
                    result.put("jars", jars.stream().map(j -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", j.getId());
                        m.put("name", j.getName());
                        m.put("icon", j.getIcon() != null ? j.getIcon() : "");
                        m.put("color", j.getColor());
                        m.put("targetPercentage", j.getTargetPercentage());
                        m.put("currentBalance", j.getCurrentBalance());
                        return m;
                    }).toList());
                }
                case "aichat" -> {
                    result.put("totalExpenseCount", expenseService.getTotalExpenseCountForCurrentUser());
                    result.put("totalIncomeCount", incomeService.getTotalIncomeCountForCurrentUser());
                    result.put("totalExpenseAmount", expenseService.getTotalExpenseForCurrentUser());
                    result.put("totalIncomeAmount", incomeService.getTotalIncomeForCurrentUser());
                    List<ExpenseDTO> recentExp = expenseService.getLatest5ExpensesForCurrentUser();
                    result.put("recentExpenses", recentExp.stream().map(this::buildExpenseMap).toList());
                    List<IncomeDTO> recentInc = incomeService.getLatest5IncomesForCurrentUser();
                    result.put("recentIncomes", recentInc.stream().map(this::buildIncomeMap).toList());
                    List<CategoryDTO> categories = categoryService.getCategoriesForCurrentUser();
                    result.put("categories", categories.stream()
                            .map(c -> Map.of("id", c.getId(), "name", c.getName(), "type", c.getType()))
                            .toList());
                }
                default -> {
                    result.put("totalExpenseCount", expenseService.getTotalExpenseCountForCurrentUser());
                    result.put("totalIncomeCount", incomeService.getTotalIncomeCountForCurrentUser());
                    result.put("totalExpenseAmount", expenseService.getTotalExpenseForCurrentUser());
                    result.put("totalIncomeAmount", incomeService.getTotalIncomeForCurrentUser());
                    List<ExpenseDTO> recentExp = expenseService.getLatest5ExpensesForCurrentUser();
                    result.put("recentExpenses", recentExp.stream().map(e -> buildExpenseMap(e)).toList());
                    List<IncomeDTO> recentInc = incomeService.getLatest5IncomesForCurrentUser();
                    result.put("recentIncomes", recentInc.stream().map(i -> buildIncomeMap(i)).toList());
                }
            }
        } catch (Exception e) {
            log.warn("Could not load page data for {}: {}", pageContext, e.getMessage());
        }
        return result;
    }

    private Map<String, Object> buildExpenseMap(ExpenseDTO e) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", e.getId());
        m.put("amount", e.getAmount());
        m.put("categoryName", e.getCategoryName() != null ? e.getCategoryName() : "");
        m.put("date", e.getDate() != null ? e.getDate().toString() : "");
        m.put("name", e.getName() != null ? e.getName() : "");
        m.put("jarName", e.getJarName() != null ? e.getJarName() : "");
        return m;
    }

    private Map<String, Object> buildIncomeMap(IncomeDTO i) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", i.getId());
        m.put("amount", i.getAmount());
        m.put("categoryName", i.getCategoryName() != null ? i.getCategoryName() : "");
        m.put("date", i.getDate() != null ? i.getDate().toString() : "");
        m.put("name", i.getName() != null ? i.getName() : "");
        return m;
    }

    private boolean isCrudIntent(String intent) {
        return intent != null && (intent.startsWith("CREATE_") || intent.startsWith("UPDATE_") ||
                intent.startsWith("DELETE_") || intent.startsWith("TRANSFER_"));
    }

    /**
     * Suy ra intentType từ tên intent nếu model không trả về intentType.
     */
    private String deriveIntentType(String intent) {
        if (intent == null) return "INVALID";
        return switch (intent) {
            case "ANSWER_QUESTION" -> "QUESTION";
            case "INVALID_REQUEST" -> "INVALID";
            default -> "ACTION";
        };
    }

    /**
     * Chuẩn hóa intent aliases và field keys trong response AI.
     * Ví dụ: intent "CREATE EXPENSE" → "CREATE_EXPENSE", key "expense_id" → "expenseId".
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> canonicalizeIntentResponse(Map<String, Object> parsed) {
        if (parsed == null) return new HashMap<>();
        Map<String, Object> result = new HashMap<>(parsed);

        // Normalize intent name: spaces/dashes to underscores, uppercase
        Object rawIntent = result.get("intent");
        if (rawIntent instanceof String intentStr) {
            String normalized = intentStr.trim().toUpperCase().replace(" ", "_").replace("-", "_");
            result.put("intent", normalized);
        }

        // Normalize extractedFields keys: snake_case → camelCase aliases
        Object fieldsObj = result.get("extractedFields");
        if (fieldsObj instanceof Map<?, ?> fieldsRaw) {
            Map<String, Object> fields = new HashMap<>();
            fieldsRaw.forEach((k, v) -> {
                String key = k.toString();
                // Common field key aliases
                key = switch (key) {
                    case "expense_id", "expenseid"       -> "expenseId";
                    case "income_id", "incomeid"         -> "incomeId";
                    case "jar_name", "jarname"           -> "jarName";
                    case "from_jar", "from_jar_name"     -> "fromJarName";
                    case "to_jar", "to_jar_name"         -> "toJarName";
                    case "category_name", "categoryname" -> "categoryName";
                    case "target_amount", "targetamount" -> "targetAmount";
                    case "current_amount", "currentamount" -> "currentAmount";
                    case "target_percentage", "targetpercentage" -> "targetPercentage";
                    case "budget_id", "budgetid"         -> "budgetId";
                    case "saving_goal_id", "savinggoalid" -> "savingGoalId";
                    case "category_id", "categoryid"     -> "categoryId";
                    default -> key;
                };
                fields.put(key, v);
            });
            result.put("extractedFields", fields);
        }

        return result;
    }

    /**
     * Tính toán danh sách field bắt buộc còn thiếu cho mỗi intent.
     * Thay vì hạ intent xuống ANSWER_QUESTION, trả về đúng intent + missingFields.
     */
    private List<String> computeMissingFields(String intent, Map<String, Object> fields) {
        if (intent == null || fields == null) return List.of();
        List<String> missing = new ArrayList<>();
        switch (intent) {
            case "CREATE_EXPENSE" -> {
                if (!hasValue(fields, "amount"))       missing.add("amount");
                if (!hasValue(fields, "categoryName")) missing.add("categoryName");
                if (!hasValue(fields, "date"))         missing.add("date");
            }
            case "UPDATE_EXPENSE" -> {
                if (!hasValue(fields, "expenseId"))    missing.add("expenseId");
            }
            case "DELETE_EXPENSE" -> {
                if (!hasValue(fields, "expenseId"))    missing.add("expenseId");
            }
            case "CREATE_INCOME" -> {
                if (!hasValue(fields, "amount"))       missing.add("amount");
                if (!hasValue(fields, "categoryName")) missing.add("categoryName");
                if (!hasValue(fields, "date"))         missing.add("date");
            }
            case "UPDATE_INCOME" -> {
                if (!hasValue(fields, "incomeId"))     missing.add("incomeId");
            }
            case "DELETE_INCOME" -> {
                if (!hasValue(fields, "incomeId"))     missing.add("incomeId");
            }
            case "CREATE_BUDGET" -> {
                if (!hasValue(fields, "amount"))       missing.add("amount");
                if (!hasValue(fields, "categoryName")) missing.add("categoryName");
            }
            case "CREATE_SAVING_GOAL" -> {
                if (!hasValue(fields, "name"))         missing.add("name");
                if (!hasValue(fields, "targetAmount")) missing.add("targetAmount");
            }
            case "UPDATE_JAR" -> {
                if (!hasValue(fields, "jarName"))      missing.add("jarName");
            }
            case "DELETE_JAR" -> {
                if (!hasValue(fields, "jarName"))      missing.add("jarName");
            }
            case "TRANSFER_JAR" -> {
                if (!hasValue(fields, "fromJarName"))  missing.add("fromJarName");
                if (!hasValue(fields, "toJarName"))    missing.add("toJarName");
                if (!hasValue(fields, "amount"))       missing.add("amount");
            }
            case "CREATE_JAR" -> {
                if (!hasValue(fields, "name"))         missing.add("name");
            }
        }
        return missing;
    }

    private boolean hasValue(Map<String, Object> fields, String key) {
        Object val = fields.get(key);
        return val != null && !val.toString().isBlank();
    }

    /**
     * Nếu AI trả ANSWER_QUESTION cho câu có động từ agent rõ ràng,
     * thử reclassify thành intent phù hợp nhất dựa trên pageContext.
     * Trả null nếu không thể xác định intent tốt hơn.
     */
    private String reclassifyByPageContext(String userMessage, String pageContext, List<AIChatMessageDTO> history) {
        String msg = normalizeIntentText(userMessage);
        String ctx = normalizeIntentText(pageContext != null ? pageContext : "dashboard");

        boolean hasDelete = msg.matches(".*\\b(xoa|bo|huy)\\b.*");
        boolean hasUpdate = msg.matches(".*\\b(sua|chinh|doi|cap nhat)\\b.*");
        boolean hasCreate = msg.matches(".*\\b(them|tao|ghi|nhap)\\b.*");
        boolean hasExport = msg.matches(".*\\b(xuat|tai|download|export)\\b.*");
        boolean hasEmailCommand = msg.matches(".*\\b(gui(?:\\s+qua)?\\s+(?:mail|email)|email\\s+bao\\s+cao|mail\\s+bao\\s+cao)\\b.*");
        boolean mentionsEmail = msg.matches(".*\\b(email|mail)\\b.*");
        boolean followUpToReport = mentionsEmail && recentHistorySuggestsReportAction(history);
        boolean hasJar = msg.matches(".*\\b(hu|jar)\\b.*");
        boolean isAnalysisQuery = msg.matches(".*\\b(phan tich|goi y|tu van|tom tat|tinh hinh tai chinh|dong tien)\\b.*")
                || msg.matches(".*\\b(lam the nao de|cach .* tiet kiem|goi y tiet kiem|tiet kiem hon)\\b.*");

        if (hasEmailCommand || followUpToReport) {
            return ctx.equals("income") ? "EMAIL_INCOME_REPORT" : "EMAIL_EXPENSE_REPORT";
        }
        if (hasExport) {
            return ctx.equals("income") ? "EXPORT_EXCEL_INCOME" : "EXPORT_EXCEL_EXPENSE";
        }
        if (isAnalysisQuery) {
            return null;
        }
        if (hasJar) {
            if (hasDelete) return "DELETE_JAR";
            if (hasUpdate) return "UPDATE_JAR";
            if (hasCreate) return "CREATE_JAR";
        }
        return switch (ctx) {
            case "expense" -> {
                if (hasDelete) yield "DELETE_EXPENSE";
                if (hasUpdate) yield "UPDATE_EXPENSE";
                if (hasCreate) yield "CREATE_EXPENSE";
                yield null;
            }
            case "income" -> {
                if (hasDelete) yield "DELETE_INCOME";
                if (hasUpdate) yield "UPDATE_INCOME";
                if (hasCreate) yield "CREATE_INCOME";
                yield null;
            }
            case "budget" -> {
                if (hasDelete) yield "DELETE_BUDGET";
                if (hasUpdate) yield "UPDATE_BUDGET";
                if (hasCreate) yield "CREATE_BUDGET";
                yield null;
            }
            case "savinggoals" -> {
                if (hasDelete) yield "DELETE_SAVING_GOAL";
                if (hasUpdate) yield "UPDATE_SAVING_GOAL";
                if (hasCreate) yield "CREATE_SAVING_GOAL";
                yield null;
            }
            case "jars" -> {
                if (hasDelete) yield "DELETE_JAR";
                if (hasUpdate) yield "UPDATE_JAR";
                if (hasCreate) yield "CREATE_JAR";
                yield null;
            }
            default -> null;
        };
    }

    private boolean recentHistorySuggestsReportAction(List<AIChatMessageDTO> history) {
        if (history == null || history.isEmpty()) return false;

        int startIndex = Math.max(0, history.size() - 4);
        for (int i = startIndex; i < history.size(); i++) {
            String content = normalizeIntentText(history.get(i).getContent());
            if (content.contains("xuat")
                    || content.contains("excel")
                    || content.contains("bao cao")
                    || content.contains("report")) {
                return true;
            }
        }
        return false;
    }

    private String normalizeIntentText(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return normalized.toLowerCase(Locale.ROOT).trim();
    }

    /**
     * Trim conversation history to a maximum number of messages (most recent).
     */
    private List<AIChatMessageDTO> trimConversationHistory(List<AIChatMessageDTO> history, int maxMessages) {
        if (history == null || history.isEmpty()) return new ArrayList<>();
        int size = history.size();
        if (size <= maxMessages) return new ArrayList<>(history);
        return new ArrayList<>(history.subList(size - maxMessages, size));
    }

    private Double toDouble(Object value) {
        if (value == null) return null;
        try {
            return Double.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal toBigDecimal(Object value, String fieldName) {
        if (value == null) return BigDecimal.ZERO;
        try {
            return new BigDecimal(normalizeAmountLiteral(value.toString().trim()));
        } catch (NumberFormatException e) {
            log.warn("Invalid BigDecimal for field '{}': '{}'. Defaulting to ZERO.", fieldName, value);
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        return toBigDecimal(value, "unknown");
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String normalizeAmountLiteral(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return "0";
        }

        String normalized = Normalizer.normalize(rawValue, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace("đ", "")
                .replace("Đ", "")
                .trim()
                .toLowerCase(Locale.ROOT);

        String compactValue = normalized.replaceAll("\\s+", "");
        if (compactValue.matches("^\\d+(?:[.,]\\d+)?k$")) {
            String numericPart = compactValue.substring(0, compactValue.length() - 1).replace(',', '.');
            return BigDecimal.valueOf(Double.parseDouble(numericPart))
                    .multiply(BigDecimal.valueOf(1_000))
                    .setScale(0, java.math.RoundingMode.HALF_UP)
                    .toPlainString();
        }

        if (compactValue.matches("^\\d+(?:[.,]\\d+)?(tr|trieu|m)$")) {
            String numericPart = compactValue.replaceAll("(tr|trieu|m)$", "").replace(',', '.');
            return BigDecimal.valueOf(Double.parseDouble(numericPart))
                    .multiply(BigDecimal.valueOf(1_000_000))
                    .setScale(0, java.math.RoundingMode.HALF_UP)
                    .toPlainString();
        }

        if (compactValue.matches("^\\d+(?:[.,]\\d+)?(nghin|ngan)$")) {
            String numericPart = compactValue.replaceAll("(nghin|ngan)$", "").replace(',', '.');
            return BigDecimal.valueOf(Double.parseDouble(numericPart))
                    .multiply(BigDecimal.valueOf(1_000))
                    .setScale(0, java.math.RoundingMode.HALF_UP)
                    .toPlainString();
        }

        if (compactValue.matches("^\\d{1,3}([.,]\\d{3})+$")) {
            return compactValue.replaceAll("[.,]", "");
        }

        if (compactValue.matches("^\\d+[.,]\\d+$")) {
            int separatorIndex = Math.max(compactValue.lastIndexOf('.'), compactValue.lastIndexOf(','));
            int digitsAfterSeparator = compactValue.length() - separatorIndex - 1;
            if (digitsAfterSeparator == 3) {
                return compactValue.replaceAll("[.,]", "");
            }
            return compactValue.replace(',', '.');
        }

        if (normalized.matches("^[\\d\\s]+$")) {
            return normalized.replaceAll("\\s+", "");
        }

        return rawValue;
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,.0f", amount);
    }

    private ExpenseDTO mapToExpenseDTO(Map<String, Object> data, Long categoryId) {
        BigDecimal amount = toBigDecimal(data.get("amount"));
        String categoryName = (String) data.get("categoryName");
        String description = (String) data.get("description");
        LocalDate date = parseDate((String) data.get("date"));
        return ExpenseDTO.builder()
                .name(description != null && !description.isBlank() ? description : categoryName)
                .amount(amount)
                .categoryId(categoryId)
                .categoryName(categoryName)
                .date(date)
                .build();
    }

    private IncomeDTO mapToIncomeDTO(Map<String, Object> data, Long categoryId) {
        BigDecimal amount = toBigDecimal(data.get("amount"));
        String categoryName = (String) data.get("categoryName");
        String description = (String) data.get("description");
        LocalDate date = parseDate((String) data.get("date"));
        return IncomeDTO.builder()
                .name(description != null && !description.isBlank() ? description : categoryName)
                .amount(amount)
                .categoryId(categoryId)
                .categoryName(categoryName)
                .date(date)
                .build();
    }

    private CategoryDTO mapToCategoryDTO(Map<String, Object> data) {
        return CategoryDTO.builder()
                .name((String) data.get("name"))
                .icon((String) data.getOrDefault("icon", "\uD83D\uDCC1"))
                .type((String) data.getOrDefault("type", "expense"))
                .build();
    }

    private BudgetDTO mapToBudgetDTO(Map<String, Object> data, ProfileEntity profile) {
        BigDecimal amount = toBigDecimal(data.get("amount"));
        String categoryName = (String) data.get("categoryName");
        Long categoryId = findCategoryId(categoryName, profile.getId(), "expense");
        LocalDate now = LocalDate.now();

        return BudgetDTO.builder()
                .amountLimit(amount)
                .categoryId(categoryId)
                .categoryName(categoryName)
                .month(now.getMonthValue())
                .year(now.getYear())
                .build();
    }

    private SavingGoalDTO mapToSavingGoalDTO(Map<String, Object> data) {
        BigDecimal target = toBigDecimal(data.get("targetAmount"));
        LocalDate now = LocalDate.now();

        return SavingGoalDTO.builder()
                .name((String) data.get("name"))
                .targetAmount(target)
                .currentAmount(toBigDecimal(data.getOrDefault("currentAmount", 0)))
                .startDate(now)
                .targetDate(now.plusMonths(3))
                .build();
    }

    private String normalizeUnicode(String str) {
        if (str == null) return "";
        return java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFC).trim();
    }

    private Long findCategoryId(String categoryName, Long profileId, String type) {
        if (categoryName == null || categoryName.isBlank()) return null;
        Long directId = categoryRepository.findByNameIgnoreCaseAndTypeAndProfileId(categoryName, type, profileId)
                .map(CategoryEntity::getId).orElse(null);
        if (directId != null) return directId;

        // Fallback: Stream-based unicode-normalized lookup
        String normalizedInput = normalizeUnicode(categoryName);
        return categoryRepository.findByTypeAndProfileId(type, profileId).stream()
                .filter(c -> normalizeUnicode(c.getName()).equalsIgnoreCase(normalizedInput))
                .findFirst()
                .map(CategoryEntity::getId)
                .orElse(null);
    }

    private Long findCategoryId(String categoryName, Long profileId) {
        if (categoryName == null || categoryName.isBlank()) return null;
        Long directId = categoryRepository.findByNameIgnoreCaseAndProfileId(categoryName, profileId)
                .map(CategoryEntity::getId).orElse(null);
        if (directId != null) return directId;

        // Fallback: Stream-based unicode-normalized lookup
        String normalizedInput = normalizeUnicode(categoryName);
        return categoryRepository.findByProfileId(profileId).stream()
                .filter(c -> normalizeUnicode(c.getName()).equalsIgnoreCase(normalizedInput))
                .findFirst()
                .map(CategoryEntity::getId)
                .orElse(null);
    }

    private Long findJarId(String jarName, Long profileId) {
        if (jarName == null || jarName.isBlank()) return null;
        String normalizedInput = normalizeUnicode(jarName);
        return jarRepository.findByProfileId(profileId).stream()
                .filter(j -> normalizeUnicode(j.getName()).equalsIgnoreCase(normalizedInput))
                .findFirst()
                .map(JarEntity::getId)
                .orElse(null);
    }

    private Long extractJarId(Map<String, Object> data, ProfileEntity profile) {
        String jarName = (String) data.get("jarName");
        if (jarName == null || jarName.isBlank()) return null;
        return findJarId(jarName, profile.getId());
    }

    private String sanitizeUserMessage(String message) {
        if (message.length() > MAX_USER_MESSAGE_LENGTH) {
            log.warn("User message truncated from {} to {} chars", message.length(), MAX_USER_MESSAGE_LENGTH);
            message = message.substring(0, MAX_USER_MESSAGE_LENGTH);
        }
        if (INJECTION_PATTERN.matcher(message).find()) {
            log.warn("Potential prompt injection detected in user message");
            throw new IllegalArgumentException("Tin nhắn không hợp lệ. Vui lòng thử lại.");
        }
        return message;
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return LocalDate.now();
        }
    }

    private String persistAgentUserMessage(String sessionId, Long userId, String userMessage, String intent, String answer) {
        try {
            if (sessionId == null || sessionId.isBlank()) {
                String title = userMessage.length() > 50 ? userMessage.substring(0, 50) + "..." : userMessage;
                var session = chatHistoryService.createSession(userId, title);
                sessionId = session.getId();
            }
            chatHistoryService.addMessage(sessionId, "user", userMessage);
            if ("ANSWER_QUESTION".equals(intent) && answer != null && !answer.isBlank()) {
                chatHistoryService.addMessage(sessionId, "assistant", answer);
            }
            return sessionId;
        } catch (Exception e) {
            log.warn("Failed to persist agent user message: {}", e.getMessage());
            return sessionId;
        }
    }

    private void persistAgentAssistantMessage(String sessionId, String message) {
        if (sessionId == null || sessionId.isBlank() || message == null) return;
        try {
            chatHistoryService.addMessage(sessionId, "assistant", message);
        } catch (Exception e) {
            log.warn("Failed to persist agent assistant message: {}", e.getMessage());
        }
    }
}
