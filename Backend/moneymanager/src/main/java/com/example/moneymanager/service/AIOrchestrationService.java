package com.example.moneymanager.service;

import com.example.moneymanager.dto.*;
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
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIOrchestrationService {

    private final AIChatService aiChatService;
    private final ProfileService profileService;
    private final ExpenseService expenseService;
    private final IncomeService incomeService;
    private final CategoryService categoryService;
    private final BudgetService budgetService;
    private final SavingGoalService savingGoalService;
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final BudgetRepository budgetRepository;
    private final SavingGoalRepository savingGoalRepository;
    private final ProfileRepository profileRepository;
    private final ObjectMapper objectMapper;

    public AIIntentResponseDTO parseIntentFromChat(AIIntentRequestDTO request) {
        String userMessage = request.getUserMessage();
        if (userMessage == null || userMessage.isBlank()) {
            return AIIntentResponseDTO.builder()
                    .intent("INVALID_REQUEST")
                    .validationErrors(List.of("Tin nh\u1EAFn kh\u00F4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng."))
                    .build();
        }

        String provider = request.getProvider() != null ? request.getProvider() : "gemini";
        String model = request.getModel() != null ? request.getModel() : "gemini-2.5-flash";

        try {
            ProfileEntity profile = profileService.getCurrentProfile();
            String pageContext = request.getPageContext() != null ? request.getPageContext() : "dashboard";
            Map<String, Object> pageData = loadPageData(pageContext, profile);
            String systemPrompt = AIInstructionPromptBuilder.buildSystemPrompt(pageContext, pageData);

            String crudInstruction = userMessage + "\n\n" +
                    "H\u00E3y ph\u00E2n t\u00EDch y\u00EAu c\u1EA7u tr\u00EAn v\u00E0 tr\u1EA3 v\u1EC1 JSON v\u1EDBi intent v\u00E0 extracted fields. " +
                    "N\u1EBFu l\u00E0 CRUD, bao g\u1ED3m confirmationPrompt b\u1EB1ng ti\u1EBFng Vi\u1EC7t.";

            String rawResponse = callGeminiForIntent(systemPrompt, crudInstruction, request.getConversationHistory());

            String cleanedJson = extractJson(rawResponse);
            if (cleanedJson == null || cleanedJson.isBlank()) {
                if (rawResponse != null && !rawResponse.isBlank()) {
                    log.warn("AI intent response did not contain JSON, returning it as an answer: {}", rawResponse);
                    return buildAnswerResponse(rawResponse, provider, model);
                }
                throw new RuntimeException("AI kh\u00F4ng tr\u1EA3 v\u1EC1 n\u1ED9i dung.");
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

            String intent = (String) parsed.getOrDefault("intent", "ANSWER_QUESTION");
            Map<String, Object> extractedFields = (Map<String, Object>) parsed.getOrDefault("extractedFields", parsed);
            Map<String, Object> suggestedValues = (Map<String, Object>) parsed.getOrDefault("suggestedValues", new HashMap<>());
            List<String> validationErrors = (List<String>) parsed.getOrDefault("validationErrors", new ArrayList<>());
            String confirmationPrompt = (String) parsed.get("confirmationPrompt");
            String answer = (String) parsed.get("answer");

            if (confirmationPrompt == null && isCrudIntent(intent)) {
                confirmationPrompt = generateConfirmationPrompt(intent, extractedFields);
            }

            return AIIntentResponseDTO.builder()
                    .status("NEED_CONFIRMATION")
                    .intent(intent)
                    .extractedFields(extractedFields)
                    .suggestedValues(suggestedValues)
                    .validationErrors(validationErrors)
                    .confirmationPrompt(confirmationPrompt)
                    .answer(answer)
                    .provider(provider)
                    .modelUsed(model)
                    .build();
        } catch (Exception e) {
            log.error("Error parsing intent: {}", e.getMessage(), e);
            try {
                AIChatResponseDTO fallback = aiChatService.chat(AIChatRequestDTO.builder()
                        .provider(provider)
                        .model(model)
                        .messages(buildMessages(request))
                        .build());
                String reply = fallback.getReply();
                if (reply == null || reply.contains("s\u1EF1 c\u1ED1") || reply.contains("ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\u00ECnh")) {
                    log.warn("Fallback AI returned error message, using neutral response");
                    reply = "M\u00F4 h\u00ECnh AI \u0111ang b\u1EADn. Vui l\u00F2ng th\u1EED l\u1EA1i sau v\u00E0i gi\u00E2y nh\u00E9.";
                }
                return AIIntentResponseDTO.builder()
                        .intent("ANSWER_QUESTION")
                        .answer(reply)
                        .provider(fallback.getProvider())
                        .modelUsed(fallback.getModelUsed())
                        .build();
            } catch (Exception fallbackError) {
                return AIIntentResponseDTO.builder()
                        .intent("ANSWER_QUESTION")
                        .answer("Xin l\u1ED7i, t\u00F4i ch\u01B0a x\u1EED l\u00FD \u0111\u01B0\u1EE3c y\u00EAu c\u1EA7u n\u00E0y. B\u1EA1n th\u1EED l\u1EA1i nh\u00E9.")
                        .build();
            }
        }
    }

    @Transactional
    public AIConfirmActionResponseDTO executeConfirmedIntent(AIConfirmActionRequestDTO request) {
        ProfileEntity profile = profileService.getCurrentProfile();
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
            Long operationId = System.currentTimeMillis();

            return AIConfirmActionResponseDTO.builder()
                    .status("SUCCESS")
                    .message(resultMessage)
                    .undoable(true)
                    .operationId(operationId)
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
                BigDecimal amount = toBigDecimal(amountObj);
                if (amount.compareTo(BigDecimal.ZERO) <= 0) yield "S\u1ED1 ti\u1EC1n ph\u1EA3i l\u1EDBn h\u01A1n 0.";
                String catName = (String) data.get("categoryName");
                if (catName == null || catName.isBlank()) yield "Vui l\u00F2ng ch\u1ECDn danh m\u1EE5c.";
                yield null;
            }
            case "CREATE_INCOME", "UPDATE_INCOME" -> {
                Object amountObj = data.get("amount");
                if (amountObj == null) yield "Vui l\u00F2ng nh\u1EADp s\u1ED1 ti\u1EC1n.";
                BigDecimal amount = toBigDecimal(amountObj);
                if (amount.compareTo(BigDecimal.ZERO) <= 0) yield "S\u1ED1 ti\u1EC1n ph\u1EA3i l\u1EDBn h\u01A1n 0.";
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
                BigDecimal amount = toBigDecimal(amountObj);
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
                BigDecimal targetAmount = toBigDecimal(targetObj);
                if (targetAmount.compareTo(BigDecimal.ZERO) <= 0) yield "S\u1ED1 ti\u1EC1n m\u1EE5c ti\u00EAu ph\u1EA3i l\u1EDBn h\u01A1n 0.";
                yield null;
            }
            default -> null;
        };
    }

    private String executeIntent(String intent, Map<String, Object> data, ProfileEntity profile) {
        return switch (intent) {
            case "CREATE_EXPENSE" -> {
                ExpenseDTO dto = mapToExpenseDTO(data, profile);
                ExpenseResponseDTO result = expenseService.addExpense(dto);
                yield "\u2705 \u0110\u00E3 t\u1EA1o chi ti\u00EAu " + formatCurrency(dto.getAmount()) + "\u0111 cho " + dto.getCategoryName();
            }
            case "UPDATE_EXPENSE" -> updateExpenseFromAI(data, profile);
            case "CREATE_INCOME" -> {
                IncomeDTO dto = mapToIncomeDTO(data, profile);
                incomeService.addIncome(dto);
                yield "\u2705 \u0110\u00E3 t\u1EA1o thu nh\u1EADp " + formatCurrency(dto.getAmount()) + "\u0111";
            }
            case "UPDATE_INCOME" -> updateIncomeFromAI(data, profile);
            case "CREATE_CATEGORY" -> {
                CategoryDTO dto = mapToCategoryDTO(data);
                CategoryDTO result = categoryService.saveCategory(dto);
                yield "\u2705 \u0110\u00E3 t\u1EA1o danh m\u1EE5c \"" + result.getName() + "\"";
            }
            case "UPDATE_CATEGORY" -> updateCategoryFromAI(data);
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
            default -> "\u2705 Thao t\u00E1c th\u00E0nh c\u00F4ng!";
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
            Long catId = findCategoryId(catName, profile.getId());
            if (catId != null) {
                entity.setCategory(categoryRepository.findById(catId).orElse(entity.getCategory()));
            }
        }
        if (data.get("date") != null) entity.setDate(parseDate((String) data.get("date")));
        expenseRepository.save(entity);
        return "\u2705 \u0110\u00E3 c\u1EADp nh\u1EADt chi ti\u00EAu " + formatCurrency(entity.getAmount()) + "\u0111 cho " +
                (entity.getCategory() != null ? entity.getCategory().getName() : "danh m\u1EE5c");
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
            Long catId = findCategoryId(catName, profile.getId());
            if (catId != null) {
                entity.setCategory(categoryRepository.findById(catId).orElse(entity.getCategory()));
            }
        }
        if (data.get("date") != null) entity.setDate(parseDate((String) data.get("date")));
        incomeRepository.save(entity);
        return "\u2705 \u0110\u00E3 c\u1EADp nh\u1EADt thu nh\u1EADp " + formatCurrency(entity.getAmount()) + "\u0111";
    }

    private String updateCategoryFromAI(Map<String, Object> data) {
        Object idObj = data.get("categoryId");
        if (idObj == null) return "\u26A0\uFE0F C\u1EA7n ID danh m\u1EE5c \u0111\u1EC3 c\u1EADp nh\u1EADt.";
        Long categoryId = toLong(idObj);
        CategoryDTO dto = CategoryDTO.builder()
                .id(categoryId)
                .name((String) data.get("name"))
                .icon((String) data.getOrDefault("icon", "\uD83D\uDCC1"))
                .type((String) data.getOrDefault("type", "expense"))
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
            Long catId = findCategoryId(catName, profile.getId());
            if (catId != null) {
                entity.setCategory(categoryRepository.findById(catId).orElse(entity.getCategory()));
            }
        }
        budgetRepository.save(entity);
        return "\u2705 \u0110\u00E3 c\u1EADp nh\u1EADt ng\u00E2n s\u00E1ch " + formatCurrency(entity.getAmountLimit()) + "\u0111 cho " +
                (entity.getCategory() != null ? entity.getCategory().getName() : "danh m\u1EE5c");
    }

    private String updateSavingGoalFromAI(Map<String, Object> data) {
        Object idObj = data.get("savingGoalId");
        if (idObj == null) return "\u26A0\uFE0F C\u1EA7n ID m\u1EE5c ti\u00EAu \u0111\u1EC3 c\u1EADp nh\u1EADt.";
        Long goalId = toLong(idObj);
        SavingGoalDTO dto = SavingGoalDTO.builder()
                .id(goalId)
                .name((String) data.get("name"))
                .targetAmount(toBigDecimal(data.get("targetAmount")))
                .currentAmount(toBigDecimal(data.getOrDefault("currentAmount", 0)))
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

    private String callGeminiForIntent(String systemPrompt, String userMessage, List<AIChatMessageDTO> history) {
        List<AIChatMessageDTO> messages = new ArrayList<>();
        if (history != null) messages.addAll(history);
        messages.add(AIChatMessageDTO.builder().role("user").content(userMessage).build());

        AIChatRequestDTO chatRequest = AIChatRequestDTO.builder()
                .provider("gemini")
                .model("gemini-2.5-flash")
                .messages(messages)
                .build();

        return aiChatService.chatWithSystemPrompt(systemPrompt, chatRequest);
    }

    private List<AIChatMessageDTO> buildMessages(AIIntentRequestDTO request) {
        List<AIChatMessageDTO> messages = new ArrayList<>();
        if (request.getConversationHistory() != null) messages.addAll(request.getConversationHistory());
        messages.add(AIChatMessageDTO.builder().role("user").content(request.getUserMessage()).build());
        return messages;
    }

    private Map<String, Object> loadPageData(String pageContext, ProfileEntity profile) {
        Map<String, Object> result = new HashMap<>();
        try {
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
                    result.put("savingGoals", goals.stream().map(g -> Map.of("id", g.getId(), "name", g.getName(), "targetAmount", g.getTargetAmount())).toList());
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
        return intent != null && (intent.startsWith("CREATE_") || intent.startsWith("UPDATE_") || intent.startsWith("DELETE_"));
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,.0f", amount);
    }

    private ExpenseDTO mapToExpenseDTO(Map<String, Object> data, ProfileEntity profile) {
        BigDecimal amount = toBigDecimal(data.get("amount"));
        String categoryName = (String) data.get("categoryName");
        String dateStr = (String) data.get("date");

        LocalDate date = parseDate(dateStr);
        Long categoryId = findCategoryId(categoryName, profile.getId());

        return ExpenseDTO.builder()
                .name(categoryName)
                .amount(amount)
                .categoryId(categoryId)
                .categoryName(categoryName)
                .date(date)
                .build();
    }

    private IncomeDTO mapToIncomeDTO(Map<String, Object> data, ProfileEntity profile) {
        BigDecimal amount = toBigDecimal(data.get("amount"));
        String categoryName = (String) data.get("categoryName");
        String dateStr = (String) data.get("date");

        LocalDate date = parseDate(dateStr);
        Long categoryId = findCategoryId(categoryName, profile.getId());

        return IncomeDTO.builder()
                .name(categoryName)
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
        Long categoryId = findCategoryId(categoryName, profile.getId());
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

    private Long findCategoryId(String categoryName, Long profileId) {
        if (categoryName == null || categoryName.isBlank()) return null;
        Optional<CategoryEntity> category = categoryRepository.findByNameIgnoreCaseAndProfileId(categoryName, profileId);
        return category.map(CategoryEntity::getId).orElse(null);
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return LocalDate.now();
        }
    }
}
