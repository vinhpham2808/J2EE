package com.example.moneymanager.util;

import java.util.List;
import java.util.Map;

/**
 * Builds the system prompt for AI intent parsing on /ai/parse-intent.
 */
public class AIInstructionPromptBuilder {

    private static final String PART1_ROLE_AND_CONTRACT = """
            Bạn là Nova - bộ phân loại intent của Money Manager.
            Nhiệm vụ duy nhất: phân tích yêu cầu người dùng và trả về JSON thuần.

            OUTPUT CONTRACT (bắt buộc tuyệt đối):
            • Chỉ trả về một JSON object. Không có text trước hoặc sau JSON.
            • Bắt đầu bằng { và kết thúc bằng }.
            • Không bao giờ từ chối bằng câu văn thường - nếu ngoài phạm vi, vẫn trả JSON với intent=INVALID_REQUEST.

            SCHEMA JSON TRẢ VỀ:
            {
              "intent": "<tên intent>",
              "intentType": "ACTION" | "QUESTION" | "INVALID",
              "extractedFields": { <các field đã trích xuất được> },
              "missingFields": [ <tên field bắt buộc còn thiếu> ],
              "confidence": <0.0 đến 1.0>,
              "confirmationPrompt": "<câu xác nhận tiếng Việt thân thiện, chỉ có khi intentType=ACTION>",
              "answer": "<câu trả lời, chỉ có khi intentType=QUESTION>",
              "validationErrors": [ <lý do nếu intentType=INVALID> ]
            }
            """;

    private static final String PART2_TAXONOMY = """

            TAXONOMY INTENT (intentType=ACTION):
            • Chi tiêu  : CREATE_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE
            • Thu nhập  : CREATE_INCOME, UPDATE_INCOME, DELETE_INCOME
            • Danh mục  : CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY
            • Ngân sách : CREATE_BUDGET, UPDATE_BUDGET, DELETE_BUDGET
            • Mục tiêu  : CREATE_SAVING_GOAL, UPDATE_SAVING_GOAL, DELETE_SAVING_GOAL
            • Hũ/Hủ     : CREATE_JAR, UPDATE_JAR, DELETE_JAR, TRANSFER_JAR
            • Xuất file : EXPORT_EXCEL_INCOME, EXPORT_EXCEL_EXPENSE
            • Email báo cáo: EMAIL_INCOME_REPORT, EMAIL_EXPENSE_REPORT

            TAXONOMY INTENT (intentType=QUESTION):
            • Hỏi thống kê, tra cứu thông tin tài chính: ANSWER_QUESTION

            TAXONOMY INTENT (intentType=INVALID):
            • Ngoài phạm vi tài chính cá nhân (chính trị, y tế, v.v.): INVALID_REQUEST
            """;

    private static final String PART3_MAPPING_RULES = """

            QUY TẮC PHÂN LOẠI (áp dụng theo thứ tự ưu tiên):

            A. PHÁT HIỆN LOẠI THAO TÁC:
              THÊM/TẠO: thêm, tạo, ghi, nhập, add
              XÓA: xóa, bỏ, hủy, remove
              SỬA/ĐỔI: sửa, chỉnh, đổi, cập nhật, update
              XUẤT: xuất, tải, download, export
              EMAIL: gửi mail, gửi email, gửi báo cáo qua email
              CHUYỂN: chuyển tiền, dời tiền, transfer
              HỎI: hỏi, xem, cho biết, bao nhiêu, tổng, thống kê, liệt kê, hiện

            B. XÁC ĐỊNH DOMAIN:
              Chi tiêu/expense: chi tiêu, chi, giao dịch, mua, tiêu, ăn, đi lại
              Thu nhập/income : thu nhập, thu, lương, income, thêm tiền vào
              Hũ/Hủ/jar       : hũ, hủ, jar
              Ngân sách       : ngân sách, budget, hạn mức
              Mục tiêu        : mục tiêu, tiết kiệm, saving, goal
              Danh mục        : danh mục, category, loại

            C. CÂU FOLLOW-UP NGẮN:
              'cái đó', 'cái vừa rồi', 'mục vừa nêu', 'cái 50k hôm nay'
              -> Tìm entity trong recentExpenses/recentIncomes/jars theo amount+date
              'hũ này', 'hũ vừa rồi' -> Tìm jarName từ jars context

            D. XỬ LÝ DELETE - BẮT BUỘC:
              Khi phát hiện động từ xóa + domain -> phải trả DELETE_xxx.
              Không bao giờ trả ANSWER_QUESTION cho câu có từ xóa rõ ràng.

            E. EMAIL BÁO CÁO - PHÂN LOẠI THEO pageContext:
              pageContext='income' hoặc câu đề cập 'thu nhập' -> EMAIL_INCOME_REPORT
              pageContext='expense' hoặc câu đề cập 'chi tiêu' -> EMAIL_EXPENSE_REPORT
              pageContext='dashboard' hoặc 'aiChat' hoặc câu chung chung -> EMAIL_EXPENSE_REPORT
              Nếu user follow-up ngay sau export/excel/báo cáo gần nhất và câu mới chỉ nói 'gửi qua email', 'email luôn'
              -> vẫn phải phân loại EMAIL_*.

            F. KHI INTENT LÀ ACTION NHƯNG THIẾU FIELD:
              Không hạ xuống ANSWER_QUESTION.
              Trả đúng intent ACTION và điền missingFields.

            G1. PHÂN BIỆT DOMAIN CƠ BẢN:
              'thu nhập/lương/income' -> CREATE_INCOME
              'chi tiêu/mua/tiêu' -> CREATE_EXPENSE
              'đổi tên hũ X thành Y' -> UPDATE_JAR
              'chuyển tiền từ hũ A sang hũ B' -> TRANSFER_JAR
              Câu chỉ hỏi thông tin -> ANSWER_QUESTION

            G2. PHÂN BIỆT 'TIẾT KIỆM':
              'làm thế nào để tiết kiệm', 'cách tiết kiệm', 'gợi ý tiết kiệm', 'tiết kiệm hơn'
              -> ANSWER_QUESTION, KHÔNG phải CREATE_SAVING_GOAL
              'tạo mục tiêu tiết kiệm', 'thêm mục tiêu tiết kiệm', 'lập mục tiêu tiết kiệm'
              -> CREATE_SAVING_GOAL

            G3. PHÂN BIỆT 'PHÂN TÍCH / BÁO CÁO / TÓM TẮT':
              'phân tích tài chính', 'phân tích chi tiêu', 'tóm tắt tháng này', 'báo cáo tuần qua',
              'tình hình tài chính', 'dòng tiền của tôi'
              -> ANSWER_QUESTION
              'xuất báo cáo', 'tải báo cáo', 'export', 'download'
              -> EXPORT_EXCEL_EXPENSE hoặc EXPORT_EXCEL_INCOME
              'gửi mail báo cáo', 'gửi báo cáo qua email'
              -> EMAIL_EXPENSE_REPORT hoặc EMAIL_INCOME_REPORT

            H. FORMAT FIELD BẮT BUỘC:
              date: YYYY-MM-DD
              amount, targetAmount, currentAmount: số nguyên thuần
              CHUẨN HÓA SỐ TIỀN (bắt buộc):
                '75k' -> 75000
                '1.5tr' -> 1500000
                '2M' -> 2000000
                '100 nghìn' -> 100000
                '5 triệu' -> 5000000
              INFER DATE:
                'hôm nay' hoặc không đề cập ngày cho giao dịch mới -> today = %s
                'hôm qua' -> today - 1 ngày
                'tuần trước', 'tháng trước' trong câu hỏi phân tích -> vẫn là ANSWER_QUESTION
            """;

    private static final String PART4_FEW_SHOT = """

            FEW-SHOT EXAMPLES:

            pageContext: dashboard
            User: "gửi mail báo cáo giúp tôi"
            Trả về:
            {"intent":"EMAIL_EXPENSE_REPORT","intentType":"ACTION","extractedFields":{},"missingFields":[],"confidence":0.85,"confirmationPrompt":"Bạn muốn gửi báo cáo chi tiêu tháng này đến email của bạn?"}

            pageContext: expense
            recentExpenses: [{id:12, categoryName:'Ăn uống', amount:50000, date:'2026-05-29'}]
            User: "xóa giao dịch ăn sáng hôm nay"
            Trả về:
            {"intent":"DELETE_EXPENSE","intentType":"ACTION","extractedFields":{"expenseId":12},"missingFields":[],"confidence":0.9,"confirmationPrompt":"Bạn muốn xóa chi tiêu Ăn uống 50.000đ ngày 29/05?"}

            pageContext: jars
            jars: [{name:'Thiết yếu'}, {name:'Giải trí'}]
            User: "đổi tên hũ thiết yếu thành sinh hoạt"
            Trả về:
            {"intent":"UPDATE_JAR","intentType":"ACTION","extractedFields":{"jarName":"Thiết yếu","name":"Sinh hoạt"},"missingFields":[],"confidence":0.95,"confirmationPrompt":"Bạn muốn đổi tên hũ \"Thiết yếu\" thành \"Sinh hoạt\"?"}

            pageContext: income
            User: "xuất file tháng này"
            Trả về:
            {"intent":"EXPORT_EXCEL_INCOME","intentType":"ACTION","extractedFields":{},"missingFields":[],"confidence":0.9,"confirmationPrompt":"Bạn muốn xuất báo cáo Excel thu nhập tháng này về máy?"}

            pageContext: expense
            conversationHistory: [user:'thêm chi tiêu ăn trưa 50k hôm nay', assistant:'Đã tạo chi tiêu...']
            User: "cái vừa rồi sửa thành 80k"
            Trả về:
            {"intent":"UPDATE_EXPENSE","intentType":"ACTION","extractedFields":{"amount":80000},"missingFields":["expenseId"],"confidence":0.75,"confirmationPrompt":"Bạn muốn sửa chi tiêu vừa tạo thành 80.000đ?"}

            pageContext: expense
            User: "thêm chi tiêu"
            Trả về:
            {"intent":"CREATE_EXPENSE","intentType":"ACTION","extractedFields":{},"missingFields":["amount","categoryName","date"],"confidence":0.7,"confirmationPrompt":"Bạn muốn thêm chi tiêu. Bạn có thể cho mình biết số tiền, danh mục và ngày không?"}

            User: "hôm nay tôi tiêu bao nhiêu?"
            Trả về:
            {"intent":"ANSWER_QUESTION","intentType":"QUESTION","extractedFields":{},"missingFields":[],"confidence":0.95,"answer":"<câu trả lời dựa trên dữ liệu context>"}

            User: "ai là tổng thống Mỹ?"
            Trả về:
            {"intent":"INVALID_REQUEST","intentType":"INVALID","extractedFields":{},"missingFields":[],"confidence":0.99,"validationErrors":["Câu hỏi ngoài phạm vi tài chính cá nhân của Money Manager."]}

            pageContext: aiChat
            conversationHistory: [user:'xuất báo cáo qua excel cho tôi đi', assistant:'Đã xác nhận xuất Excel chi tiêu']
            User: "ok gửi qua email cho tôi luôn nhé"
            Trả về:
            {"intent":"EMAIL_EXPENSE_REPORT","intentType":"ACTION","extractedFields":{},"missingFields":[],"confidence":0.88,"confirmationPrompt":"Bạn muốn gửi báo cáo chi tiêu tháng này đến email của bạn?"}

            pageContext: aiChat
            categories: [{name:'Ăn uống', type:'expense'}]
            User: "Thêm chi tiêu ăn trưa cùng đồng nghiệp 75k danh mục Ăn uống hôm nay"
            Trả về:
            {"intent":"CREATE_EXPENSE","intentType":"ACTION","extractedFields":{"amount":75000,"categoryName":"Ăn uống","date":"%s"},"missingFields":[],"confidence":0.93,"confirmationPrompt":"Bạn muốn thêm chi tiêu Ăn uống 75.000đ hôm nay?"}

            pageContext: aiChat
            User: "Làm thế nào để tôi có thể tiết kiệm chi tiêu hiệu quả hơn trong tháng này?"
            Trả về:
            {"intent":"ANSWER_QUESTION","intentType":"QUESTION","extractedFields":{},"missingFields":[],"confidence":0.92,"answer":"<gợi ý tiết kiệm dựa trên context>"}

            pageContext: aiChat
            User: "Tóm tắt báo cáo chi tiêu và thu nhập của tôi trong tuần qua."
            Trả về:
            {"intent":"ANSWER_QUESTION","intentType":"QUESTION","extractedFields":{},"missingFields":[],"confidence":0.92,"answer":"<tóm tắt dựa trên context>"}

            pageContext: aiChat
            User: "Thêm thu nhập lương tháng 15 triệu hôm nay"
            Trả về:
            {"intent":"CREATE_INCOME","intentType":"ACTION","extractedFields":{"amount":15000000,"date":"%s"},"missingFields":["categoryName"],"confidence":0.86,"confirmationPrompt":"Bạn muốn thêm thu nhập lương tháng 15.000.000đ hôm nay?"}
            """;

    private static final String PAGE_CONTEXT_TEMPLATE = """

            NGỮ CẢNH HIỆN TẠI:
            Trang: %s
            Dữ liệu người dùng: %s
            """;

    public static String buildSystemPrompt(String pageContext, Map<String, Object> pageData) {
        String today = java.time.LocalDate.now().toString();
        String pageLabel = getPageLabel(pageContext).replace("%", "%%");
        String dataSummary = summarizePageData(pageContext, pageData).replace("%", "%%");
        String rules = String.format(PART3_MAPPING_RULES, today);
        String examples = String.format(PART4_FEW_SHOT, today, today, today);

        return PART1_ROLE_AND_CONTRACT
                + PART2_TAXONOMY
                + rules
                + examples
                + String.format(PAGE_CONTEXT_TEMPLATE, pageLabel, dataSummary);
    }

    public static String buildFallbackSystemPrompt() {
        return "Bạn là Nova, trợ lý AI đồng hành thân thiết của Money Manager. "
                + "Hỗ trợ tài chính cá nhân, tâm lý chi tiêu, hỗ trợ cảm xúc. "
                + "Trả lời bằng tiếng Việt, ấm áp và quan tâm, không phán xét, không cộc lốc. "
                + "Tối đa 200 chữ.";
    }

    private static String getPageLabel(String pageContext) {
        if (pageContext == null || pageContext.isBlank()) {
            return "Tổng quan";
        }

        return switch (pageContext.trim().toLowerCase()) {
            case "dashboard" -> "Tổng quan";
            case "income" -> "Thu nhập";
            case "expense" -> "Chi tiêu";
            case "budget" -> "Ngân sách";
            case "savinggoals" -> "Mục tiêu tiết kiệm";
            case "category" -> "Danh mục";
            case "filter" -> "Bộ lọc";
            case "forecast" -> "Dự báo";
            case "reports" -> "Báo cáo";
            case "jars" -> "Hũ chi tiêu";
            case "aichat" -> "Trợ lý AI";
            default -> "Tổng quan";
        };
    }

    @SuppressWarnings("unchecked")
    private static String summarizePageData(String pageContext, Map<String, Object> pageData) {
        if (pageData == null || pageData.isEmpty()) {
            return "Chưa có dữ liệu trang.";
        }

        StringBuilder summary = new StringBuilder();
        String normalizedPage = pageContext == null ? "" : pageContext.trim().toLowerCase();

        switch (normalizedPage) {
            case "category" -> appendCategoryNames(summary, pageData, "Danh mục");
            case "jars" -> appendJarSummary(summary, pageData);
            case "expense" -> {
                appendCountAndTotal(summary, "Tổng số chi tiêu", pageData.get("totalExpenseCount"), pageData.get("totalExpenseAmount"));
                appendRecentExpenses(summary, pageData, "Giao dịch gần nhất");
                appendCategoryNames(summary, pageData, "Danh mục chi tiêu");
            }
            case "income" -> {
                appendCountAndTotal(summary, "Tổng số thu nhập", pageData.get("totalIncomeCount"), pageData.get("totalIncomeAmount"));
                appendRecentIncomes(summary, pageData, "Thu nhập gần nhất");
                appendCategoryNames(summary, pageData, "Danh mục thu nhập");
            }
            case "budget" -> {
                appendCategoryNames(summary, pageData, "Danh mục");
                if (pageData.containsKey("budgets")) {
                    List<Map<String, Object>> budgets = (List<Map<String, Object>>) pageData.get("budgets");
                    appendSeparator(summary);
                    summary.append("Ngân sách hiện tại: ");
                    appendList(summary, budgets, 5, budget ->
                            budget.get("categoryName") + "=" + budget.get("amount") + "[budgetId=" + budget.get("id") + "]");
                }
            }
            case "savinggoals" -> {
                if (pageData.containsKey("savingGoals")) {
                    List<Map<String, Object>> goals = (List<Map<String, Object>>) pageData.get("savingGoals");
                    summary.append(goals.size()).append(" mục tiêu tiết kiệm: ");
                    appendList(summary, goals, 10, goal -> goal.get("name")
                            + " [savingGoalId=" + goal.get("id") + "]"
                            + " target=" + goal.get("targetAmount")
                            + " current=" + goal.get("currentAmount")
                            + " remaining=" + goal.get("remainingAmount"));
                }
            }
            case "aichat" -> {
                appendCountAndTotal(summary, "Chi tiêu", pageData.get("totalExpenseCount"), pageData.get("totalExpenseAmount"));
                appendCountAndTotal(summary, "Thu nhập", pageData.get("totalIncomeCount"), pageData.get("totalIncomeAmount"));
                appendCategoryNames(summary, pageData, "Danh mục");
                appendRecentExpenses(summary, pageData, "Chi tiêu gần nhất");
                appendRecentIncomes(summary, pageData, "Thu nhập gần nhất");
            }
            default -> {
                appendCountAndTotal(summary, "Chi tiêu", pageData.get("totalExpenseCount"), pageData.get("totalExpenseAmount"));
                appendCountAndTotal(summary, "Thu nhập", pageData.get("totalIncomeCount"), pageData.get("totalIncomeAmount"));
                appendRecentExpenses(summary, pageData, "Chi tiêu gần nhất");
                appendRecentIncomes(summary, pageData, "Thu nhập gần nhất");
            }
        }

        if (!"jars".equals(normalizedPage) && pageData.containsKey("jars")) {
            appendSeparator(summary);
            appendJarSummary(summary, pageData);
        }

        return summary.length() > 0 ? summary.toString() : "Chưa có dữ liệu.";
    }

    @SuppressWarnings("unchecked")
    private static void appendCategoryNames(StringBuilder summary, Map<String, Object> pageData, String label) {
        if (!pageData.containsKey("categories")) {
            return;
        }

        List<Map<String, Object>> categories = (List<Map<String, Object>>) pageData.get("categories");
        if (categories == null || categories.isEmpty()) {
            return;
        }

        appendSeparator(summary);
        summary.append(label).append(": ");
        appendList(summary, categories, 10, category -> {
            Object type = category.get("type");
            return type == null || type.toString().isBlank()
                    ? String.valueOf(category.get("name"))
                    : category.get("name") + "(" + type + ")";
        });
    }

    @SuppressWarnings("unchecked")
    private static void appendJarSummary(StringBuilder summary, Map<String, Object> pageData) {
        if (!pageData.containsKey("jars")) {
            return;
        }

        List<Map<String, Object>> jars = (List<Map<String, Object>>) pageData.get("jars");
        if (jars == null || jars.isEmpty()) {
            return;
        }

        if (summary.length() > 0 && !summary.toString().endsWith(" | ")) {
            appendSeparator(summary);
        }

        summary.append(jars.size()).append(" hũ/hủ chi tiêu: ");
        appendList(summary, jars, jars.size(), jar -> {
            StringBuilder item = new StringBuilder();
            item.append(jar.get("name"))
                    .append(" [jarId=").append(jar.get("id")).append("]")
                    .append("(số dư=").append(jar.getOrDefault("currentBalance", 0)).append("đ")
                    .append(", phân bổ=").append(jar.getOrDefault("targetPercentage", 0)).append("%");
            if (jar.get("icon") != null && !jar.get("icon").toString().isBlank()) {
                item.append(", icon=").append(jar.get("icon"));
            }
            item.append(")");
            return item.toString();
        });
    }

    @SuppressWarnings("unchecked")
    private static void appendRecentExpenses(StringBuilder summary, Map<String, Object> pageData, String label) {
        if (!pageData.containsKey("recentExpenses")) {
            return;
        }

        List<Map<String, Object>> expenses = (List<Map<String, Object>>) pageData.get("recentExpenses");
        if (expenses == null || expenses.isEmpty()) {
            return;
        }

        appendSeparator(summary);
        summary.append(label).append(": ");
        appendList(summary, expenses, 5, expense -> {
            StringBuilder item = new StringBuilder();
            item.append(expense.get("categoryName")).append(" ").append(expense.get("amount")).append("đ")
                    .append(" (").append(expense.get("date")).append(") [expenseId=").append(expense.get("id")).append("]");
            if (expense.get("description") != null && !expense.get("description").toString().isBlank()) {
                item.append("[desc=").append(expense.get("description")).append("]");
            }
            if (expense.get("jarName") != null && !expense.get("jarName").toString().isBlank()) {
                item.append("[jarName=").append(expense.get("jarName")).append("]");
            }
            return item.toString();
        });
    }

    @SuppressWarnings("unchecked")
    private static void appendRecentIncomes(StringBuilder summary, Map<String, Object> pageData, String label) {
        if (!pageData.containsKey("recentIncomes")) {
            return;
        }

        List<Map<String, Object>> incomes = (List<Map<String, Object>>) pageData.get("recentIncomes");
        if (incomes == null || incomes.isEmpty()) {
            return;
        }

        appendSeparator(summary);
        summary.append(label).append(": ");
        appendList(summary, incomes, 5, income ->
                income.get("name") + " " + income.get("amount") + "đ"
                        + " (" + income.get("date") + ") [incomeId=" + income.get("id") + "]");
    }

    private static void appendCountAndTotal(StringBuilder summary, String label, Object count, Object total) {
        if (count == null) {
            return;
        }

        appendSeparator(summary);
        summary.append(label).append(": ").append(count).append(" giao dịch");
        if (total != null) {
            summary.append(", tổng ").append(total).append("đ");
        }
    }

    private static void appendSeparator(StringBuilder summary) {
        if (summary.length() > 0) {
            summary.append(" | ");
        }
    }

    private static <T> void appendList(StringBuilder summary, List<T> items, int maxItems, java.util.function.Function<T, String> formatter) {
        for (int i = 0; i < Math.min(items.size(), maxItems); i++) {
            summary.append(formatter.apply(items.get(i)));
            if (i < Math.min(items.size(), maxItems) - 1) {
                summary.append(", ");
            }
        }
    }
}
