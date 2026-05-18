package com.example.moneymanager.service;

import com.example.moneymanager.config.GeminiKeyRotator;
import com.example.moneymanager.config.GeminiProperties;
import com.example.moneymanager.dto.AIChatMessageDTO;
import com.example.moneymanager.dto.AssistantChatResponseDTO;
import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.dto.IncomeDTO;
import com.example.moneymanager.dto.VoiceParseResponseDTO;
import com.example.moneymanager.dto.SpendingTipsResponseDTO;
import com.example.moneymanager.entity.ProfileEntity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.Arrays;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    private final RestClient geminiRestClient;
    private final GeminiProperties geminiProperties;
    private final GeminiKeyRotator geminiKeyRotator;
    private final ObjectMapper objectMapper;
    private final ProfileService profileService;
    private final IncomeService incomeService;
    private final ExpenseService expenseService;

    // Helper method Ä‘á»ƒ chia an toÃ n
    private BigDecimal safeDivide(BigDecimal numerator, BigDecimal denominator, int scale) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (numerator == null) {
            return BigDecimal.ZERO;
        }
        return numerator.divide(denominator, scale, RoundingMode.HALF_UP);
    }

    public String callGeminiWithPrompt(String systemPrompt, String userMessage, int maxOutputTokens) {
        validateConfiguration();
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.set("systemInstruction", buildSystemInstruction(systemPrompt));
        requestBody.set("contents", buildUserContents(userMessage));
        ObjectNode genConfig = objectMapper.createObjectNode();
        genConfig.put("temperature", 0.4);
        genConfig.put("maxOutputTokens", maxOutputTokens);
        requestBody.set("generationConfig", genConfig);
        JsonNode responseBody = executeGenerateContentRequest(requestBody);
        return extractOutputText(responseBody);
    }

    public AssistantChatResponseDTO testConnection(String message) {
        String prompt = (message == null || message.isBlank())
                ? "Trả lời đúng 5 từ: Gemini đang hoạt động tốt."
                : message.trim();

        JsonNode responseBody = executeGenerateContentRequest(buildPublicRequestBody(prompt));
        String outputText = extractOutputText(responseBody);

        if (outputText == null || outputText.isBlank()) {
            throw new RuntimeException("Gemini khÃ´ng tráº£ vá» ná»™i dung há»£p lá»‡.");
        }

        return AssistantChatResponseDTO.builder()
                .reply(outputText.trim())
                .model(geminiProperties.model())
                .build();
    }

    public AssistantChatResponseDTO chat(String message) {
        validateConfiguration();

        if (message == null || message.isBlank()) {
            throw new RuntimeException("Nội dung tin nhắn không được để trống.");
        }

        String trimmedMessage = message.trim();
        if (!isSupportedQuestion(trimmedMessage)) {
            return AssistantChatResponseDTO.builder()
                    .reply("Tôi chỉ hỗ trợ các câu hỏi về quản lý chi tiêu, tài chính cá nhân và cách sử dụng Money Manager. Bạn hãy hỏi một nội dung liên quan đến các chủ đề này nhé.")
                    .model("Trợ lý Money Manager")
                    .build();
        }

        ProfileEntity currentProfile = profileService.getCurrentProfile();
        JsonNode responseBody = executeGenerateContentRequest(
                buildAuthenticatedRequestBody(currentProfile, trimmedMessage)
        );
        String outputText = extractOutputText(responseBody);

        if (outputText == null || outputText.isBlank()) {
            throw new RuntimeException("Gemini khÃ´ng tráº£ vá» ná»™i dung há»£p lá»‡.");
        }

        return AssistantChatResponseDTO.builder()
                .reply(outputText.trim())
                .model(geminiProperties.model())
                .build();
    }

    public VoiceParseResponseDTO parseVoiceCommand(String text) {
        validateConfiguration();

        if (text == null || text.isBlank()) {
            throw new RuntimeException("Nội dung giọng nói không được để trống.");
        }

        String currentDate = LocalDate.now().toString();
        String systemPrompt = "Bạn là chuyên gia phân tích dữ liệu tài chính cho ứng dụng Money Manager.\n" +
                "Nhiệm vụ của bạn là phân tích câu nói của người dùng về việc thu chi và trích xuất thông tin theo định dạng JSON.\n" +
                "\n" +
                "Cấu trúc JSON yêu cầu:\n" +
                "{\n" +
                "  \"type\": \"EXPENSE\" hoặc \"INCOME\",\n" +
                "  \"amount\": số tiền (số nguyên),\n" +
                "  \"name\": \"tên ngắn gọn của giao dịch\",\n" +
                "  \"categoryHint\": \"gợi ý danh mục (ví dụ: Ăn uống, Lương, Mua sắm, ...)\",\n" +
                "  \"date\": \"YYYY-MM-DD\" (mặc định là hôm nay nếu không có thông tin),\n" +
                "  \"note\": \"ghi chú thêm (nếu có)\"\n" +
                "}\n" +
                "\n" +
                "Quy tắc:\n" +
                "1. Nếu người dùng nói \"chi\", \"mua\", \"trả\", \"tiêu\", ... -> type là \"EXPENSE\".\n" +
                "2. Nếu người dùng nói \"thu\", \"nhận\", \"lương\", \"được tặng\", ... -> type là \"INCOME\".\n" +
                "3. Nếu không rõ, mặc định là \"EXPENSE\".\n" +
                "4. Date: Nếu người dùng nói \"hôm qua\", \"hôm nay\", \"ngày kia\", ... hãy tính toán đúng ngày YYYY-MM-DD dựa trên ngày hiện tại là: " + currentDate + ".\n" +
                "5. Nếu có thông tin về việc chia tiền (ví dụ: \"chia với vợ\"), hãy ghi chú vào trường 'note' và nếu được hãy đề xuất số tiền sau khi chia nếu người dùng nói rõ (ví dụ: \"chi 200k... chia đôi với vợ\" -> amount: 100000, note: \"Tổng 200k, chia đôi với vợ\").\n" +
                "\n" +
                "Chỉ trả về DUY NHẤT mã JSON, không có văn bản giải thích, không dùng markdown code block (không cần ```json).";

        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.set("systemInstruction", buildSystemInstruction(systemPrompt));
        requestBody.set("contents", buildUserContents(text));

        ObjectNode genConfig = buildGenerationConfig();
        genConfig.put("temperature", 0.1); // Thấp để chính xác hơn
        requestBody.set("generationConfig", genConfig);

        try {
            JsonNode responseBody = executeGenerateContentRequest(requestBody);
            String outputText = extractOutputText(responseBody);

            if (outputText == null || outputText.isBlank()) {
                throw new RuntimeException("Gemini không trả về kết quả phân tích.");
            }

            // Clean output if it contains markdown markers
            String cleanedJson = outputText.replaceAll("```json", "").replaceAll("```", "").trim();
            return objectMapper.readValue(cleanedJson, VoiceParseResponseDTO.class);
        } catch (Exception e) {
            log.error("Error parsing voice with Gemini: {}", e.getMessage());
            throw new RuntimeException("Không thể phân tích dữ liệu giọng nói: " + e.getMessage());
        }
    }

    public SpendingTipsResponseDTO getSpendingTips() {
        List<ExpenseDTO> expenses = expenseService.getCurrentMonthExpensesForCurrentUser();

        if (expenses.isEmpty()) {
            return SpendingTipsResponseDTO.builder()
                    .tips(List.of())
                    .timestamp(LocalDateTime.now())
                    .disclaimer("Chưa có đủ dữ liệu chi tiêu tháng này để đưa ra gợi ý.")
                    .build();
        }

        Map<String, BigDecimal> categorySpending = expenses.stream()
                .filter(e -> e.getCategoryName() != null && e.getAmount() != null)
                .collect(Collectors.groupingBy(
                        ExpenseDTO::getCategoryName,
                        Collectors.reducing(BigDecimal.ZERO, ExpenseDTO::getAmount, BigDecimal::add)
                ));

        StringBuilder context = new StringBuilder("Chi tiêu tháng này theo danh mục:\n");
        categorySpending.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .forEach(e -> context.append("- ").append(e.getKey()).append(": ")
                        .append(formatCurrency(e.getValue())).append(" VND\n"));

        String systemPrompt = "Bạn là chuyên gia tài chính cá nhân. Dựa vào dữ liệu chi tiêu, hãy đưa ra đúng 5 gợi ý thực tế để tiết kiệm. Mỗi gợi ý bắt đầu bằng dấu '-' trên một dòng riêng. Không dùng markdown, không giải thích thêm. Trả lời bằng tiếng Việt.";
        String response = callGeminiWithPrompt(systemPrompt, context.toString(), 500);

        List<String> tips = Arrays.stream(response.split("\n"))
                .map(String::trim)
                .filter(line -> line.startsWith("-"))
                .map(line -> line.substring(1).trim())
                .filter(line -> !line.isBlank())
                .collect(Collectors.toList());

        if (tips.isEmpty()) {
            tips = List.of(response.trim());
        }

        return SpendingTipsResponseDTO.builder()
                .tips(tips)
                .timestamp(LocalDateTime.now())
                .disclaimer("Gợi ý được tạo bởi AI, chỉ mang tính tham khảo.")
                .build();
    }

    // Dashboard insight - phiên bản ngắn gọn
    public AssistantChatResponseDTO getDashboardInsight(Map<String, Object> dashboardData, String fullName) {
        validateConfiguration();
        ObjectNode requestBody = objectMapper.createObjectNode();

        String statsInfo = String.format(
                "Thu nhập: %s VND. Chi tiêu: %s VND. Số dư: %s VND. Số mục tiêu tiết kiệm đang chạy: %s. Tổng tiền tiết kiệm: %s VND.",
                dashboardData.get("totalIncome"),
                dashboardData.get("totalExpense"),
                dashboardData.get("totalBalance"),
                dashboardData.get("savingGoalActiveCount"),
                dashboardData.get("savingGoalTotalSaved")
        );

        requestBody.set("systemInstruction", buildSystemInstruction(
                "Bạn là chuyên gia tài chính AI của Money Manager. Dựa vào số liệu tháng này của " + fullName + ":\n" +
                        statsInfo + "\n" +
                        "Nhiệm vụ: Đưa ra đúng 1 câu dự đoán rủi ro/xu hướng và 1 câu khuyên hành động thực tế.\n" +
                        "Quy tắc nghiêm ngặt: Trả lời tối đa 40 chữ. Không dùng markdown, không dùng ký tự đặc biệt (*, #). Nói thẳng vấn đề."
        ));

        requestBody.set("contents", buildUserContents("Hãy phân tích nhanh số liệu và cho tôi dự đoán."));
        requestBody.set("generationConfig", buildGenerationConfig());

        JsonNode responseBody = executeGenerateContentRequest(requestBody);
        String outputText = extractOutputText(responseBody);

        if (outputText == null || outputText.isBlank()) {
            outputText = "Hiện tại dữ liệu đang được cập nhật, AI sẽ sớm có dự đoán cho bạn.";
        }

        return AssistantChatResponseDTO.builder()
                .reply(outputText.trim())
                .model(geminiProperties.model())
                .build();
    }

    // Dashboard insight CHI TIáº¾T - Dá»° ÄOÃN TÆ¯Æ NG LAI
    public Map<String, Object> getDetailedDashboardInsight(Map<String, Object> dashboardData, String fullName) {
        if (dashboardData == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "No dashboard data available");
            return errorResponse;
        }

        if (fullName == null || fullName.isBlank()) {
            fullName = "báº¡n";
        }

        Map<String, Object> detailedInsight = new LinkedHashMap<>();

        try {
            List<MonthlyData> monthlyTrends = getMonthlyTrends(3);
            List<ExpenseDTO> currentMonthExpenses = expenseService.getCurrentMonthExpensesForCurrentUser();
            List<IncomeDTO> currentMonthIncomes = incomeService.getCurrentMonthIncomesForCurrentUser();

            ForecastResult forecast = predictFuture(monthlyTrends, currentMonthExpenses, currentMonthIncomes);
            List<Map<String, Object>> categoryAnalysis = analyzeCategorySpending(currentMonthExpenses, dashboardData);
            TrendAnalysis trendAnalysis = analyzeTimeTrend(monthlyTrends);
            FinancialRatios ratios = calculateFinancialRatios(dashboardData, monthlyTrends);
            String detailedAdvice = generateForecastAdvice(forecast, trendAnalysis, ratios, fullName);

            detailedInsight.put("forecast", forecast);
            detailedInsight.put("categoryAnalysis", categoryAnalysis);
            detailedInsight.put("trendAnalysis", trendAnalysis);
            detailedInsight.put("financialRatios", ratios);
            detailedInsight.put("detailedAdvice", detailedAdvice);
            detailedInsight.put("currentMonth", getCurrentMonthInfo());
            detailedInsight.put("totalIncome", dashboardData.get("totalIncome"));
            detailedInsight.put("totalExpense", dashboardData.get("totalExpense"));
            detailedInsight.put("totalBalance", dashboardData.get("totalBalance"));

        } catch (Exception e) {
            log.error("Error generating detailed insight: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Không thể tạo phân tích chi tiết");
            return errorResponse;
        }

        return detailedInsight;
    }

    public String generateMultiTurn(String systemPrompt, List<AIChatMessageDTO> messages, int maxOutputTokens) {
        validateConfiguration();
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.set("systemInstruction", buildSystemInstruction(systemPrompt));
        ArrayNode contents = objectMapper.createArrayNode();
        for (AIChatMessageDTO msg : messages) {
            ObjectNode contentNode = objectMapper.createObjectNode();
            String role = "assistant".equals(msg.getRole()) ? "model" : msg.getRole();
            contentNode.put("role", role);
            ArrayNode parts = objectMapper.createArrayNode();
            ObjectNode part = objectMapper.createObjectNode();
            part.put("text", msg.getContent());
            parts.add(part);
            contentNode.set("parts", parts);
            contents.add(contentNode);
        }
        requestBody.set("contents", contents);
        ObjectNode genConfig = objectMapper.createObjectNode();
        genConfig.put("temperature", 0.4);
        genConfig.put("maxOutputTokens", maxOutputTokens);
        requestBody.set("generationConfig", genConfig);
        JsonNode responseBody = executeGenerateContentRequest(requestBody);
        String outputText = extractOutputText(responseBody);
        if (outputText == null || outputText.isBlank()) {
            throw new RuntimeException("Gemini kh\u00F4ng tr\u1EA3 v\u1EC1 n\u1ED9i dung h\u1EE3p l\u1EC7.");
        }
        return outputText.trim();
    }

    // Láº¥y dá»¯ liá»‡u cÃ¡c thÃ¡ng gáº§n Ä‘Ã¢y
    private List<MonthlyData> getMonthlyTrends(int months) {
        List<MonthlyData> trends = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = months; i >= 0; i--) {
            LocalDate targetDate = now.minusMonths(i);
            YearMonth yearMonth = YearMonth.from(targetDate);

            List<ExpenseDTO> expenses = expenseService.getExpensesByMonthForCurrentUser(yearMonth.getYear(), yearMonth.getMonthValue());
            List<IncomeDTO> incomes = incomeService.getIncomesByMonthForCurrentUser(yearMonth.getYear(), yearMonth.getMonthValue());

            BigDecimal totalExpense = expenses.stream()
                    .map(ExpenseDTO::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalIncome = incomes.stream()
                    .map(IncomeDTO::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            MonthlyData data = new MonthlyData();
            data.setYear(yearMonth.getYear());
            data.setMonth(yearMonth.getMonthValue());
            data.setMonthName(yearMonth.getMonth().getDisplayName(java.time.format.TextStyle.FULL, new Locale("vi")));
            data.setTotalExpense(totalExpense);
            data.setTotalIncome(totalIncome);
            data.setNetCashFlow(totalIncome.subtract(totalExpense));
            data.setTransactionCount(expenses.size() + incomes.size());

            trends.add(data);
        }

        return trends;
    }

    // Dá»° ÄOÃN TÆ¯Æ NG LAI - ÄÃƒ Sá»¬A AN TOÃ€N
    private ForecastResult predictFuture(List<MonthlyData> monthlyTrends,
                                         List<ExpenseDTO> currentExpenses,
                                         List<IncomeDTO> currentIncomes) {
        ForecastResult result = new ForecastResult();

        // GiÃ¡ trá»‹ máº·c Ä‘á»‹nh
        result.setPredictedNextMonthExpense(BigDecimal.ZERO);
        result.setPredictedNextMonthIncome(BigDecimal.ZERO);
        result.setPredictedNextMonthNetCashFlow(BigDecimal.ZERO);
        result.setProjectedEndExpense(BigDecimal.ZERO);
        result.setProjectedEndBalance(BigDecimal.ZERO);
        result.setAvgExpenseGrowthRate(BigDecimal.ZERO);
        result.setAvgIncomeGrowthRate(BigDecimal.ZERO);
        result.setDaysLeftInMonth(0);
        result.setAvgDailyExpense(BigDecimal.ZERO);
        result.setRunOutDate(null);
        result.setRiskLevel("THẤP");
        result.setRiskMessage("Chưa đủ dữ liệu để dự đoán");

        if (monthlyTrends == null || monthlyTrends.isEmpty()) {
            return result;
        }

        // TÃ­nh tá»· lá»‡ tÄƒng trÆ°á»Ÿng trung bÃ¬nh
        BigDecimal avgExpenseGrowth = BigDecimal.ZERO;
        BigDecimal avgIncomeGrowth = BigDecimal.ZERO;
        int expenseCount = 0;
        int incomeCount = 0;

        for (int i = 1; i < monthlyTrends.size(); i++) {
            MonthlyData prev = monthlyTrends.get(i - 1);
            MonthlyData curr = monthlyTrends.get(i);

            // TÃ­nh tÄƒng trÆ°á»Ÿng chi tiÃªu an toÃ n
            if (prev.getTotalExpense() != null && prev.getTotalExpense().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal expenseGrowth = safeDivide(
                        curr.getTotalExpense().subtract(prev.getTotalExpense()),
                        prev.getTotalExpense(),
                        4
                );
                avgExpenseGrowth = avgExpenseGrowth.add(expenseGrowth);
                expenseCount++;
            }

            // TÃ­nh tÄƒng trÆ°á»Ÿng thu nháº­p an toÃ n
            if (prev.getTotalIncome() != null && prev.getTotalIncome().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal incomeGrowth = safeDivide(
                        curr.getTotalIncome().subtract(prev.getTotalIncome()),
                        prev.getTotalIncome(),
                        4
                );
                avgIncomeGrowth = avgIncomeGrowth.add(incomeGrowth);
                incomeCount++;
            }
        }

        if (expenseCount > 0) {
            avgExpenseGrowth = avgExpenseGrowth.divide(BigDecimal.valueOf(expenseCount), 4, RoundingMode.HALF_UP);
        }
        if (incomeCount > 0) {
            avgIncomeGrowth = avgIncomeGrowth.divide(BigDecimal.valueOf(incomeCount), 4, RoundingMode.HALF_UP);
        }

        // Dá»± Ä‘oÃ¡n cho thÃ¡ng tiáº¿p theo
        MonthlyData lastMonth = monthlyTrends.get(monthlyTrends.size() - 1);
        if (lastMonth.getTotalExpense() != null) {
            result.setPredictedNextMonthExpense(lastMonth.getTotalExpense().multiply(BigDecimal.ONE.add(avgExpenseGrowth)));
        }
        if (lastMonth.getTotalIncome() != null) {
            result.setPredictedNextMonthIncome(lastMonth.getTotalIncome().multiply(BigDecimal.ONE.add(avgIncomeGrowth)));
        }
        result.setPredictedNextMonthNetCashFlow(result.getPredictedNextMonthIncome().subtract(result.getPredictedNextMonthExpense()));

        // Dá»± Ä‘oÃ¡n cuá»‘i thÃ¡ng hiá»‡n táº¡i
        int currentDay = LocalDate.now().getDayOfMonth();
        int daysInMonth = LocalDate.now().lengthOfMonth();
        int daysLeft = daysInMonth - currentDay;
        result.setDaysLeftInMonth(daysLeft);

        BigDecimal currentTotalExpense = BigDecimal.ZERO;
        if (currentExpenses != null) {
            currentTotalExpense = currentExpenses.stream()
                    .map(ExpenseDTO::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        BigDecimal avgDailyExpense = BigDecimal.ZERO;
        if (currentDay > 0 && currentTotalExpense.compareTo(BigDecimal.ZERO) > 0) {
            avgDailyExpense = currentTotalExpense.divide(BigDecimal.valueOf(currentDay), 2, RoundingMode.HALF_UP);
        }
        result.setAvgDailyExpense(avgDailyExpense);
        result.setProjectedEndExpense(currentTotalExpense.add(avgDailyExpense.multiply(BigDecimal.valueOf(daysLeft))));

        BigDecimal currentTotalIncome = BigDecimal.ZERO;
        if (currentIncomes != null) {
            currentTotalIncome = currentIncomes.stream()
                    .map(IncomeDTO::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        result.setProjectedEndBalance(currentTotalIncome.subtract(result.getProjectedEndExpense()));

        // Dá»± Ä‘oÃ¡n thá»i Ä‘iá»ƒm cáº¡n kiá»‡t tiá»n
        if (result.getProjectedEndExpense().compareTo(currentTotalIncome) > 0 && avgDailyExpense.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal daysToRunOut = safeDivide(currentTotalIncome, avgDailyExpense, 0);
            LocalDate runOutDay = LocalDate.now().plusDays(daysToRunOut.longValue());
            result.setRunOutDate(runOutDay.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }

        // ÄÃ¡nh giÃ¡ rá»§i ro
        if (currentTotalIncome.compareTo(BigDecimal.ZERO) > 0) {
            if (result.getProjectedEndExpense().compareTo(currentTotalIncome) > 0) {
                result.setRiskLevel("CAO");
                result.setRiskMessage(String.format("Dự đoán cuối tháng bạn sẽ chi tiêu vượt thu nhập %.0f VND",
                        result.getProjectedEndExpense().subtract(currentTotalIncome)));
            } else if (result.getProjectedEndExpense().compareTo(currentTotalIncome.multiply(BigDecimal.valueOf(0.8))) > 0) {
                result.setRiskLevel("TRUNG_BÌNH");
                result.setRiskMessage("Chi tiêu đang ở mức cao, cần theo dõi sát sao");
            } else {
                result.setRiskLevel("THẤP");
                result.setRiskMessage("Tình hình tài chính ổn định");
            }
        } else {
            result.setRiskLevel("THẤP");
            result.setRiskMessage("Chưa có dữ liệu thu nhập để đánh giá");
        }

        result.setAvgExpenseGrowthRate(avgExpenseGrowth.multiply(BigDecimal.valueOf(100)));
        result.setAvgIncomeGrowthRate(avgIncomeGrowth.multiply(BigDecimal.valueOf(100)));

        return result;
    }

    // PhÃ¢n tÃ­ch chi tiÃªu theo danh má»¥c - ÄÃƒ Sá»¬A AN TOÃ€N
    private List<Map<String, Object>> analyzeCategorySpending(List<ExpenseDTO> expenses, Map<String, Object> dashboardData) {
        if (expenses == null || expenses.isEmpty()) {
            return new ArrayList<>();
        }

        Map<String, BigDecimal> categorySpending = expenses.stream()
                .filter(e -> e.getCategoryName() != null && e.getAmount() != null)
                .collect(Collectors.groupingBy(
                        ExpenseDTO::getCategoryName,
                        Collectors.reducing(BigDecimal.ZERO, ExpenseDTO::getAmount, BigDecimal::add)
                ));

        if (categorySpending.isEmpty()) {
            return new ArrayList<>();
        }

        BigDecimal totalExpense = new BigDecimal(dashboardData.get("totalExpense").toString());

        if (totalExpense == null || totalExpense.compareTo(BigDecimal.ZERO) == 0) {
            return new ArrayList<>();
        }

        return categorySpending.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    Map<String, Object> cat = new LinkedHashMap<>();
                    cat.put("category", entry.getKey());
                    cat.put("amount", entry.getValue());
                    BigDecimal percentage = safeDivide(
                            entry.getValue().multiply(BigDecimal.valueOf(100)),
                            totalExpense,
                            1
                    );
                    cat.put("percentage", percentage.toString() + "%");
                    cat.put("icon", getCategoryIcon(entry.getKey()));
                    cat.put("advice", getCategoryAdvice(entry.getKey(), entry.getValue(), totalExpense));
                    return cat;
                })
                .collect(Collectors.toList());
    }

    // PhÃ¢n tÃ­ch xu hÆ°á»›ng theo thá»i gian - ÄÃƒ Sá»¬A AN TOÃ€N
    private TrendAnalysis analyzeTimeTrend(List<MonthlyData> monthlyTrends) {
        TrendAnalysis analysis = new TrendAnalysis();

        if (monthlyTrends == null || monthlyTrends.size() < 2) {
            analysis.setTrend("CHƯA ĐỦ DỮ LIỆU");
            analysis.setDescription("Cần thêm dữ liệu các tháng trước để phân tích xu hướng");
            analysis.setExpenseTrend("CHƯA ĐỦ DỮ LIỆU");
            analysis.setExpenseTrendMessage("Chưa có đủ dữ liệu chi tiêu");
            analysis.setIncomeTrend("CHƯA ĐỦ DỮ LIỆU");
            analysis.setIncomeTrendMessage("Chưa có đủ dữ liệu thu nhập");
            return analysis;
        }

        List<BigDecimal> expenseChanges = new ArrayList<>();
        List<BigDecimal> incomeChanges = new ArrayList<>();

        for (int i = 1; i < monthlyTrends.size(); i++) {
            MonthlyData prev = monthlyTrends.get(i - 1);
            MonthlyData curr = monthlyTrends.get(i);

            if (prev.getTotalExpense() != null && prev.getTotalExpense().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal expenseChange = safeDivide(
                        curr.getTotalExpense().subtract(prev.getTotalExpense()),
                        prev.getTotalExpense(),
                        4
                );
                expenseChanges.add(expenseChange);
            }

            if (prev.getTotalIncome() != null && prev.getTotalIncome().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal incomeChange = safeDivide(
                        curr.getTotalIncome().subtract(prev.getTotalIncome()),
                        prev.getTotalIncome(),
                        4
                );
                incomeChanges.add(incomeChange);
            }
        }

        if (!expenseChanges.isEmpty()) {
            BigDecimal avgExpenseChange = expenseChanges.stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(expenseChanges.size()), 4, RoundingMode.HALF_UP);

            if (avgExpenseChange.compareTo(BigDecimal.valueOf(0.05)) > 0) {
                analysis.setExpenseTrend("TĂNG MẠNH");
                analysis.setExpenseTrendMessage(String.format("Chi tiêu đang tăng %.1f%% mỗi tháng",
                        avgExpenseChange.multiply(BigDecimal.valueOf(100))));
            } else if (avgExpenseChange.compareTo(BigDecimal.ZERO) > 0) {
                analysis.setExpenseTrend("TĂNG NHẸ");
                analysis.setExpenseTrendMessage(String.format("Chi tiêu tăng %.1f%% mỗi tháng",
                        avgExpenseChange.multiply(BigDecimal.valueOf(100))));
            } else if (avgExpenseChange.compareTo(BigDecimal.valueOf(-0.05)) < 0) {
                analysis.setExpenseTrend("GIẢM MẠNH");
                analysis.setExpenseTrendMessage(String.format("Chi tiêu giảm %.1f%% mỗi tháng, rất tốt!",
                        avgExpenseChange.abs().multiply(BigDecimal.valueOf(100))));
            } else if (avgExpenseChange.compareTo(BigDecimal.ZERO) < 0) {
                analysis.setExpenseTrend("GIẢM NHẸ");
                analysis.setExpenseTrendMessage(String.format("Chi tiêu giảm %.1f%% mỗi tháng",
                        avgExpenseChange.abs().multiply(BigDecimal.valueOf(100))));
            } else {
                analysis.setExpenseTrend("ỔN ĐỊNH");
                analysis.setExpenseTrendMessage("Chi tiêu ổn định qua các tháng");
            }
        } else {
            analysis.setExpenseTrend("CHƯA ĐỦ DỮ LIỆU");
            analysis.setExpenseTrendMessage("Chưa có đủ dữ liệu chi tiêu");
        }

        if (!incomeChanges.isEmpty()) {
            BigDecimal avgIncomeChange = incomeChanges.stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(incomeChanges.size()), 4, RoundingMode.HALF_UP);

            if (avgIncomeChange.compareTo(BigDecimal.valueOf(0.05)) > 0) {
                analysis.setIncomeTrend("TĂNG MẠNH");
                analysis.setIncomeTrendMessage(String.format("Thu nhập đang tăng %.1f%% mỗi tháng",
                        avgIncomeChange.multiply(BigDecimal.valueOf(100))));
            } else if (avgIncomeChange.compareTo(BigDecimal.ZERO) > 0) {
                analysis.setIncomeTrend("TĂNG NHẸ");
                analysis.setIncomeTrendMessage(String.format("Thu nhập tăng %.1f%% mỗi tháng",
                        avgIncomeChange.multiply(BigDecimal.valueOf(100))));
            } else if (avgIncomeChange.compareTo(BigDecimal.valueOf(-0.05)) < 0) {
                analysis.setIncomeTrend("GIẢM MẠNH");
                analysis.setIncomeTrendMessage(String.format("Thu nhập đang giảm %.1f%% mỗi tháng, cần lưu ý!",
                        avgIncomeChange.abs().multiply(BigDecimal.valueOf(100))));
            } else if (avgIncomeChange.compareTo(BigDecimal.ZERO) < 0) {
                analysis.setIncomeTrend("GIẢM NHẸ");
                analysis.setIncomeTrendMessage(String.format("Thu nhập giảm %.1f%% mỗi tháng",
                        avgIncomeChange.abs().multiply(BigDecimal.valueOf(100))));
            } else {
                analysis.setIncomeTrend("ỔN ĐỊNH");
                analysis.setIncomeTrendMessage("Thu nhập ổn định qua các tháng");
            }
        } else {
            analysis.setIncomeTrend("CHƯA ĐỦ DỮ LIỆU");
            analysis.setIncomeTrendMessage("Chưa có đủ dữ liệu thu nhập");
        }

        analysis.setTrend("ỔN ĐỊNH");
        analysis.setDescription("Xu hướng tài chính đang được phân tích");

        return analysis;
    }

    // TÃ­nh cÃ¡c chá»‰ sá»‘ tÃ i chÃ­nh - ÄÃƒ Sá»¬A AN TOÃ€N
    private FinancialRatios calculateFinancialRatios(Map<String, Object> dashboardData, List<MonthlyData> monthlyTrends) {
        FinancialRatios ratios = new FinancialRatios();

        ratios.setSavingsRate(BigDecimal.ZERO);
        ratios.setFixedExpenseRatio(BigDecimal.ZERO);
        ratios.setMonthsOfSurvival(BigDecimal.ZERO);
        ratios.setHealthScore("CHƯA ĐỦ DỮ LIỆU");
        ratios.setHealthMessage("Chưa có đủ dữ liệu để đánh giá");

        try {
            BigDecimal totalIncome = new BigDecimal(dashboardData.get("totalIncome").toString());
            BigDecimal totalExpense = new BigDecimal(dashboardData.get("totalExpense").toString());
            BigDecimal totalBalance = new BigDecimal(dashboardData.get("totalBalance").toString());

            if (totalIncome != null && totalIncome.compareTo(BigDecimal.ZERO) > 0) {
                ratios.setSavingsRate(safeDivide(
                        totalIncome.subtract(totalExpense).multiply(BigDecimal.valueOf(100)),
                        totalIncome,
                        1
                ));
            }

            if (totalExpense != null && totalExpense.compareTo(BigDecimal.ZERO) > 0) {
                ratios.setMonthsOfSurvival(safeDivide(totalBalance, totalExpense, 1));
            }

            if (ratios.getSavingsRate().compareTo(BigDecimal.valueOf(20)) >= 0) {
                ratios.setHealthScore("TỐT");
                ratios.setHealthMessage("Bạn đang tiết kiệm rất tốt! Hãy duy trì.");
            } else if (ratios.getSavingsRate().compareTo(BigDecimal.valueOf(10)) >= 0) {
                ratios.setHealthScore("KHÁ");
                ratios.setHealthMessage("Tiết kiệm ở mức khá, có thể cải thiện thêm.");
            } else if (ratios.getSavingsRate().compareTo(BigDecimal.ZERO) >= 0) {
                ratios.setHealthScore("TRUNG BÌNH");
                ratios.setHealthMessage("Tiết kiệm còn thấp, cần cắt giảm chi tiêu không cần thiết.");
            } else if (ratios.getSavingsRate().compareTo(BigDecimal.ZERO) < 0) {
                ratios.setHealthScore("KÉM");
                ratios.setHealthMessage("Bạn đang chi tiêu nhiều hơn thu nhập! Cần điều chỉnh ngay.");
            }

        } catch (Exception e) {
            log.error("Error calculating financial ratios: {}", e.getMessage());
        }

        ratios.setFixedExpenseRatio(calculateFixedExpenseRatio());
        return ratios;
    }

    private String generateForecastAdvice(ForecastResult forecast, TrendAnalysis trend,
                                          FinancialRatios ratios, String userName) {
        StringBuilder advice = new StringBuilder();

        advice.append("🔮 DỰ ĐOÁN TƯƠNG LAI CHO ").append(userName.toUpperCase()).append(":\n\n");

        advice.append("📊 DỰ BÁO THÁNG TớI:\n");
        advice.append(String.format("• Chi tiêu dự kiến: %s VND\n", formatCurrency(forecast.getPredictedNextMonthExpense())));
        advice.append(String.format("• Thu nhập dự kiến: %s VND\n", formatCurrency(forecast.getPredictedNextMonthIncome())));
        advice.append(String.format("• Dòng tiền ròng: %s VND\n", formatCurrency(forecast.getPredictedNextMonthNetCashFlow())));

        if (forecast.getPredictedNextMonthNetCashFlow().compareTo(BigDecimal.ZERO) < 0) {
            advice.append("⚠️ CẢNH BÁO: Dự đoán tháng tới sẽ thâm hụt! Hãy chuẩn bị kế hoạch cắt giảm chi tiêu.\n");
        }

        advice.append("\n📅 DỰ BÁO CUỐI THÁNG NÀY:\n");
        advice.append(String.format("• Chi tiêu dự kiến: %s VND\n", formatCurrency(forecast.getProjectedEndExpense())));
        advice.append(String.format("• Số dư dự kiến: %s VND\n", formatCurrency(forecast.getProjectedEndBalance())));
        advice.append(String.format("• Chi tiêu trung bình/ngày: %s VND\n", formatCurrency(forecast.getAvgDailyExpense())));

        if (forecast.getRunOutDate() != null) {
            advice.append(String.format("🚨 CẢNH BÁO NGHIÊM TRọNG: Dự đoán bạn sẽ hết tiền vào ngày %s!\n", forecast.getRunOutDate()));
            advice.append("→ HÀNH ĐỘNG NGAY: Cắt giảm chi tiêu không thiết yếu, tìm thêm nguồn thu nhập.\n");
        }

        advice.append("\n📈 PHÂN TÍCH XU HƯớNG:\n");
        advice.append(String.format("• %s\n", trend.getExpenseTrendMessage()));
        advice.append(String.format("• %s\n", trend.getIncomeTrendMessage()));

        advice.append("\n💪 CHỆ SỐ TÀI CHÍNH:\n");
        advice.append(String.format("• Tỷ lệ tiết kiệm: %.1f%% (%s)\n", ratios.getSavingsRate(), ratios.getHealthMessage()));
        advice.append(String.format("• Số tháng có thể sống nếu không có thu nhập: %.1f tháng\n", ratios.getMonthsOfSurvival()));

        advice.append("\n🎯 KHUYếN NGHị CỤ THỂ:\n");
        if ("CAO".equals(forecast.getRiskLevel())) {
            advice.append("1. CẮT GIẢM NGAY: Ăn ngoài, mua sắm không cần thiết, giải trí\n");
            advice.append("2. THEO DÕI SÁT: Cập nhật giao dịch hàng ngày\n");
            advice.append("3. TĂNG THU NHẬ P: Làm thêm, bán đồ không dùng\n");
        } else if ("TRUNG_BÌNH".equals(forecast.getRiskLevel())) {
            advice.append("1. ĐẶT NGÂN SÁCH: Giới hạn chi tiêu cho từng danh mục\n");
            advice.append("2. TIẾT KIỆM 10%: Tự động trích 10% thu nhập vào tiết kiệm\n");
            advice.append("3. RÀ SOÁT ĐịNH KỲ: Kiểm tra chi tiêu mỗi tuần\n");
        } else {
            advice.append("1. DUY TRÌ TỐT: Tiếp tục thói quen chi tiêu hiện tại\n");
            advice.append("2. ĐẦU TƯ: Cân nhắc đầu tư số tiền dư để sinh lẽi\n");
            advice.append("3. MỤC TIÊU LớN: Đặt mục tiêu tiết kiệm dài hạn\n");
        }

        advice.append("\n⭐ ").append(getMotivationalMessage(forecast, ratios));
        return advice.toString();
    }

    private String getCategoryIcon(String category) {
        Map<String, String> icons = new HashMap<>();
        icons.put("Ăn uống", "🍜");
        icons.put("Mua sắm", "🛍️");
        icons.put("Di chuyển", "🚗");
        icons.put("Xăng xe", "⛽");
        icons.put("Hóa đơn", "📄");
        icons.put("Tiền điện", "💡");
        icons.put("Tiền nước", "💧");
        icons.put("Giải trí", "🎬");
        icons.put("Sức khỏe", "🏥");
        icons.put("Giáo dục", "📚");
        icons.put("Du lịch", "✈️");
        return icons.getOrDefault(category, "📌");
    }

    private String getCategoryAdvice(String category, BigDecimal amount, BigDecimal totalExpense) {
        if (totalExpense == null || totalExpense.compareTo(BigDecimal.ZERO) == 0) {
            return "Chưa có dữ liệu chi tiêu";
        }

        BigDecimal percentage = safeDivide(amount.multiply(BigDecimal.valueOf(100)), totalExpense, 1);

        if (category.contains("Ăn uống") && percentage.compareTo(BigDecimal.valueOf(30)) > 0) {
            return "Chiếm " + percentage + "% tổng chi tiêu. Nên nấu ăn tại nhà để tiết kiệm.";
        } else if (category.contains("Mua sắm") && percentage.compareTo(BigDecimal.valueOf(20)) > 0) {
            return "Chiếm " + percentage + "% tổng chi tiêu. Cần lên danh sách trước khi mua sắm.";
        } else if (category.contains("Giải trí") && percentage.compareTo(BigDecimal.valueOf(15)) > 0) {
            return "Chiếm " + percentage + "% tổng chi tiêu. Cân nhắc giảm tần suất giải trí.";
        } else if (percentage.compareTo(BigDecimal.valueOf(10)) > 0) {
            return "Chiếm " + percentage + "% tổng chi tiêu. Đang ở mức ổn.";
        } else {
            return "Chiếm " + percentage + "% tổng chi tiêu. Tiếp tục duy trì.";
        }
    }

    private BigDecimal calculateFixedExpenseRatio() {
        List<ExpenseDTO> fixedExpenses = expenseService.getCurrentMonthExpensesForCurrentUser().stream()
                .filter(e -> e.getCategoryName() != null &&
                        (e.getCategoryName().contains("Hóa đơn") ||
                                e.getCategoryName().contains("Tiền điện") ||
                                e.getCategoryName().contains("Tiền nước") ||
                                e.getCategoryName().contains("Tiền nhà")))
                .collect(Collectors.toList());

        BigDecimal totalFixedExpense = fixedExpenses.stream()
                .map(ExpenseDTO::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = expenseService.getTotalExpenseForCurrentUser();

        if (totalExpense != null && totalExpense.compareTo(BigDecimal.ZERO) > 0) {
            return safeDivide(totalFixedExpense.multiply(BigDecimal.valueOf(100)), totalExpense, 1);
        }

        return BigDecimal.valueOf(30);
    }

    private String getMotivationalMessage(ForecastResult forecast, FinancialRatios ratios) {
        if ("CAO".equals(forecast.getRiskLevel())) {
            return "Hãy bắt đầu ngay hôm nay! Mỗi đồng tiết kiệm đều có giá trị. Bạn có thể làm được! 💪";
        } else if ("TRUNG_BÌNH".equals(forecast.getRiskLevel())) {
            return "Bạn đang đi đúng hướng! Hãy kiên trì và cải thiện mỗi ngày. Thành công đang chờ! 🌟";
        } else {
            if (ratios.getSavingsRate().compareTo(BigDecimal.valueOf(20)) >= 0) {
                return "Tuyệt vời! Bạn đang kiểm soát tài chính rất tốt. Hãy nghĩ đến các mục tiêu lớn hơn! 🎯";
            } else {
                return "Tình hình tài chính khả quan! Hãy duy trì và nâng cao tỷ lệ tiết kiệm. Cố lên! 🚀";
            }
        }
    }

    private Map<String, Object> getCurrentMonthInfo() {
        Map<String, Object> info = new LinkedHashMap<>();
        LocalDate now = LocalDate.now();
        info.put("month", now.getMonth().getDisplayName(java.time.format.TextStyle.FULL, new Locale("vi")));
        info.put("year", now.getYear());
        info.put("currentDay", now.getDayOfMonth());
        info.put("daysInMonth", now.lengthOfMonth());
        info.put("daysLeft", now.lengthOfMonth() - now.getDayOfMonth());
        return info;
    }

    private String formatCurrency(BigDecimal amount) {
        BigDecimal safeAmount = amount != null ? amount : BigDecimal.ZERO;
        NumberFormat formatter = NumberFormat.getNumberInstance(new Locale("vi", "VN"));
        return formatter.format(safeAmount);
    }

    private void validateConfiguration() {
        if (!geminiKeyRotator.hasKeys()) {
            throw new RuntimeException("Gemini API key ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\u00ECnh.");
        }
        if (geminiProperties.model() == null || geminiProperties.model().isBlank()) {
            throw new RuntimeException("Gemini model ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\u00ECnh.");
        }
    }

    private JsonNode executeGenerateContentRequest(ObjectNode requestBody) {
        validateConfiguration();
        try {
            String apiKey = geminiKeyRotator.nextKey();
            String requestJson = objectMapper.writeValueAsString(requestBody);
            String responseJson = geminiRestClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .queryParam("key", apiKey)
                            .build(geminiProperties.model()))
                    .body(requestJson)
                    .retrieve()
                    .body(String.class);
            if (responseJson == null || responseJson.isBlank()) {
                throw new RuntimeException("Gemini không trả về dữ liệu.");
            }
            return objectMapper.readTree(responseJson);
        } catch (Exception exception) {
            throw new RuntimeException("Không thể gọi Gemini API: " + exception.getMessage(), exception);
        }
    }

    private ObjectNode buildPublicRequestBody(String message) {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.set("systemInstruction", buildSystemInstruction(
                "Bạn là trợ lý AI cho ứng dụng Money Manager. Luôn trả lời bằng tiếng Việt, đúng trọng tâm, rõ ràng, dễ hiểu."
        ));
        requestBody.set("contents", buildUserContents(message));
        requestBody.set("generationConfig", buildGenerationConfig());
        return requestBody;
    }

    private ObjectNode buildAuthenticatedRequestBody(ProfileEntity profile, String message) {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.set("systemInstruction", buildSystemInstruction(
                "Bạn là trợ lý tài chính cho ứng dụng Money Manager.\n" +
                        "Người dùng: " + safeValue(profile.getFullName()) + ", email: " + safeValue(profile.getEmail())
        ));
        requestBody.set("contents", buildUserContents(message));
        requestBody.set("generationConfig", buildGenerationConfig());
        return requestBody;
    }

    private ObjectNode buildSystemInstruction(String text) {
        ObjectNode instruction = objectMapper.createObjectNode();
        ArrayNode parts = objectMapper.createArrayNode();
        ObjectNode part = objectMapper.createObjectNode();
        part.put("text", text);
        parts.add(part);
        instruction.set("parts", parts);
        return instruction;
    }

    private ArrayNode buildUserContents(String message) {
        ArrayNode contents = objectMapper.createArrayNode();
        ObjectNode userMessage = objectMapper.createObjectNode();
        userMessage.put("role", "user");
        ArrayNode parts = objectMapper.createArrayNode();
        ObjectNode part = objectMapper.createObjectNode();
        part.put("text", message);
        parts.add(part);
        userMessage.set("parts", parts);
        contents.add(userMessage);
        return contents;
    }

    private ObjectNode buildGenerationConfig() {
        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("temperature", 0.35);
        generationConfig.put("maxOutputTokens", 820);
        return generationConfig;
    }

    private String extractOutputText(JsonNode responseBody) {
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

    private String safeValue(String value) {
        return value == null || value.isBlank() ? "KhÃ´ng cÃ³" : value;
    }

    private boolean isSupportedQuestion(String message) {
        String normalizedMessage = normalizeText(message);
        List<String> supportedKeywords = List.of(
                "chi tieu", "thu chi", "thu nhap", "tiet kiem", "tai chinh",
                "ngan sach", "so du", "giao dich", "hoa don", "muc tieu"
        );
        return supportedKeywords.stream().anyMatch(normalizedMessage::contains);
    }

    private String normalizeText(String value) {
        String normalizedValue = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
        return normalizedValue.replaceAll("\\s+", " ").trim();
    }

    // Inner classes (ÄÃƒ Sá»¬A VÃ€ THÃŠM @DATA LOMBOK)
    @Data
    public static class MonthlyData {
        private int year;
        private int month;
        private String monthName;
        private BigDecimal totalExpense;
        private BigDecimal totalIncome;
        private BigDecimal netCashFlow;
        private int transactionCount;
    }

    @Data
    public static class ForecastResult {
        private BigDecimal predictedNextMonthExpense;
        private BigDecimal predictedNextMonthIncome;
        private BigDecimal predictedNextMonthNetCashFlow;
        private BigDecimal projectedEndExpense;
        private BigDecimal projectedEndBalance;
        private BigDecimal avgExpenseGrowthRate;
        private BigDecimal avgIncomeGrowthRate;
        private int daysLeftInMonth;
        private BigDecimal avgDailyExpense;
        private String runOutDate;
        private String riskLevel;
        private String riskMessage;
    }

    @Data
    public static class TrendAnalysis {
        private String trend;
        private String description;
        private String expenseTrend;
        private String expenseTrendMessage;
        private String incomeTrend;
        private String incomeTrendMessage;
    }

    @Data
    public static class FinancialRatios {
        private BigDecimal savingsRate;
        private BigDecimal fixedExpenseRatio;
        private BigDecimal monthsOfSurvival;
        private String healthScore;
        private String healthMessage;
    }
}
