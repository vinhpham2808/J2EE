export const INTENT_TYPES = {
  CREATE_CATEGORY: "CREATE_CATEGORY",
  UPDATE_CATEGORY: "UPDATE_CATEGORY",
  DELETE_CATEGORY: "DELETE_CATEGORY",
  CREATE_EXPENSE: "CREATE_EXPENSE",
  UPDATE_EXPENSE: "UPDATE_EXPENSE",
  DELETE_EXPENSE: "DELETE_EXPENSE",
  CREATE_INCOME: "CREATE_INCOME",
  UPDATE_INCOME: "UPDATE_INCOME",
  DELETE_INCOME: "DELETE_INCOME",
  CREATE_BUDGET: "CREATE_BUDGET",
  UPDATE_BUDGET: "UPDATE_BUDGET",
  DELETE_BUDGET: "DELETE_BUDGET",
  CREATE_SAVING_GOAL: "CREATE_SAVING_GOAL",
  UPDATE_SAVING_GOAL: "UPDATE_SAVING_GOAL",
  DELETE_SAVING_GOAL: "DELETE_SAVING_GOAL",
  EXPORT_EXCEL_INCOME: "EXPORT_EXCEL_INCOME",
  EXPORT_EXCEL_EXPENSE: "EXPORT_EXCEL_EXPENSE",
  EMAIL_INCOME_REPORT: "EMAIL_INCOME_REPORT",
  EMAIL_EXPENSE_REPORT: "EMAIL_EXPENSE_REPORT",
  ANSWER_QUESTION: "ANSWER_QUESTION",
  INVALID_REQUEST: "INVALID_REQUEST"
};

export const INTENT_LABELS = {
  CREATE_CATEGORY: "Tạo danh mục",
  UPDATE_CATEGORY: "Sửa danh mục",
  DELETE_CATEGORY: "Xóa danh mục",
  CREATE_EXPENSE: "Tạo chi tiêu",
  UPDATE_EXPENSE: "Sửa chi tiêu",
  DELETE_EXPENSE: "Xóa chi tiêu",
  CREATE_INCOME: "Tạo thu nhập",
  UPDATE_INCOME: "Sửa thu nhập",
  DELETE_INCOME: "Xóa thu nhập",
  CREATE_BUDGET: "Tạo ngân sách",
  UPDATE_BUDGET: "Sửa ngân sách",
  DELETE_BUDGET: "Xóa ngân sách",
  CREATE_SAVING_GOAL: "Tạo mục tiêu",
  UPDATE_SAVING_GOAL: "Sửa mục tiêu",
  DELETE_SAVING_GOAL: "Xóa mục tiêu",
  EXPORT_EXCEL_INCOME: "Xuất Excel thu nhập",
  EXPORT_EXCEL_EXPENSE: "Xuất Excel chi tiêu",
  EMAIL_INCOME_REPORT: "Gửi email báo cáo thu nhập",
  EMAIL_EXPENSE_REPORT: "Gửi email báo cáo chi tiêu",
  ANSWER_QUESTION: "Trả lời câu hỏi",
  INVALID_REQUEST: "Yêu cầu không hợp lệ"
};

export const INTENT_ICONS = {
  CREATE_CATEGORY: "📁",
  UPDATE_CATEGORY: "✏️",
  DELETE_CATEGORY: "🗑️",
  CREATE_EXPENSE: "💸",
  UPDATE_EXPENSE: "✏️",
  DELETE_EXPENSE: "🗑️",
  CREATE_INCOME: "💰",
  UPDATE_INCOME: "✏️",
  DELETE_INCOME: "🗑️",
  CREATE_BUDGET: "📊",
  UPDATE_BUDGET: "✏️",
  DELETE_BUDGET: "🗑️",
  CREATE_SAVING_GOAL: "🎯",
  UPDATE_SAVING_GOAL: "✏️",
  DELETE_SAVING_GOAL: "🗑️",
  EXPORT_EXCEL_INCOME: "📥",
  EXPORT_EXCEL_EXPENSE: "📥",
  EMAIL_INCOME_REPORT: "📧",
  EMAIL_EXPENSE_REPORT: "📧",
  ANSWER_QUESTION: "💬",
  INVALID_REQUEST: "⚠️"
};

export const parseIntentResponse = (response) => {
  if (!response) return { intent: INTENT_TYPES.INVALID_REQUEST, extractedFields: {} };

  const intent = response.intent;
  if (!intent || !INTENT_TYPES[intent]) {
    return { intent: INTENT_TYPES.INVALID_REQUEST, extractedFields: {} };
  }

  return {
    intent,
    extractedFields: response.extractedFields || {},
    suggestedValues: response.suggestedValues || {},
    validationErrors: response.validationErrors || [],
    confirmationPrompt: response.confirmationPrompt || "",
    answer: response.answer || ""
  };
};

export const isCrudIntent = (intent) => {
  return intent && (
    intent.startsWith("CREATE_") ||
    intent.startsWith("UPDATE_") ||
    intent.startsWith("DELETE_")
  );
};

export const isActionIntent = (intent) => {
  return intent && (
    intent.startsWith("EXPORT_") ||
    intent.startsWith("EMAIL_")
  );
};

export const getFieldsForIntent = (intent) => {
  switch (intent) {
    case INTENT_TYPES.CREATE_CATEGORY:
    case INTENT_TYPES.UPDATE_CATEGORY:
      return [
        { key: "name", label: "Tên danh mục", type: "text", required: true },
        { key: "icon", label: "Icon", type: "text", required: false },
        { key: "type", label: "Loại (income/expense)", type: "text", required: true }
      ];
    case INTENT_TYPES.CREATE_EXPENSE:
      return [
        { key: "amount", label: "Số tiền", type: "number", required: true },
        { key: "categoryName", label: "Danh mục", type: "category_select", categoryType: "expense", required: true },
        { key: "date", label: "Ngày", type: "date", required: true },
        { key: "description", label: "Mô tả", type: "text", required: false }
      ];
    case INTENT_TYPES.UPDATE_EXPENSE:
      return [
        { key: "amount", label: "Số tiền", type: "number", required: true },
        { key: "categoryName", label: "Danh mục", type: "category_select", categoryType: "expense", required: false },
        { key: "date", label: "Ngày", type: "date", required: false },
        { key: "description", label: "Mô tả", type: "text", required: false }
      ];
    case INTENT_TYPES.CREATE_INCOME:
      return [
        { key: "amount", label: "Số tiền", type: "number", required: true },
        { key: "categoryName", label: "Danh mục", type: "category_select", categoryType: "income", required: true },
        { key: "date", label: "Ngày", type: "date", required: true },
        { key: "description", label: "Mô tả", type: "text", required: false }
      ];
    case INTENT_TYPES.UPDATE_INCOME:
      return [
        { key: "amount", label: "Số tiền", type: "number", required: true },
        { key: "categoryName", label: "Danh mục", type: "category_select", categoryType: "income", required: false },
        { key: "date", label: "Ngày", type: "date", required: false },
        { key: "description", label: "Mô tả", type: "text", required: false }
      ];
    case INTENT_TYPES.CREATE_BUDGET:
      return [
        { key: "amount", label: "Số tiền", type: "number", required: true },
        { key: "categoryName", label: "Danh mục", type: "category_select", categoryType: "expense", required: true },
        { key: "month", label: "Tháng", type: "number", required: true },
        { key: "year", label: "Năm", type: "number", required: true }
      ];
    case INTENT_TYPES.UPDATE_BUDGET:
      return [
        { key: "amount", label: "Số tiền", type: "number", required: true },
        { key: "categoryName", label: "Danh mục", type: "category_select", categoryType: "expense", required: false }
      ];
    case INTENT_TYPES.CREATE_SAVING_GOAL:
    case INTENT_TYPES.UPDATE_SAVING_GOAL:
      return [
        { key: "name", label: "Tên mục tiêu", type: "text", required: true },
        { key: "targetAmount", label: "Số tiền mục tiêu", type: "number", required: true },
        { key: "currentAmount", label: "Số tiền hiện tại", type: "number", required: false }
      ];
    default:
      return [];
  }
};
