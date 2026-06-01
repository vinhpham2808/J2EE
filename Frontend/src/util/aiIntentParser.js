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
  CREATE_JAR: "CREATE_JAR",
  UPDATE_JAR: "UPDATE_JAR",
  DELETE_JAR: "DELETE_JAR",
  TRANSFER_JAR: "TRANSFER_JAR",
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
  CREATE_JAR: "Tạo hũ tiền",
  UPDATE_JAR: "Sửa hũ tiền",
  DELETE_JAR: "Xóa hũ tiền",
  TRANSFER_JAR: "Chuyển tiền giữa hũ",
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
  CREATE_JAR: "🏦",
  UPDATE_JAR: "✏️",
  DELETE_JAR: "🗑️",
  TRANSFER_JAR: "↔️",
  EXPORT_EXCEL_INCOME: "📥",
  EXPORT_EXCEL_EXPENSE: "📥",
  EMAIL_INCOME_REPORT: "📧",
  EMAIL_EXPENSE_REPORT: "📧",
  ANSWER_QUESTION: "💬",
  INVALID_REQUEST: "⚠️"
};

export const parseIntentResponse = (response) => {
  if (!response) return { intent: INTENT_TYPES.INVALID_REQUEST, intentType: 'INVALID', extractedFields: {}, missingFields: [], confidence: null };

  const intent = response.intent;
  if (!intent || !INTENT_TYPES[intent]) {
    return { intent: INTENT_TYPES.INVALID_REQUEST, intentType: 'INVALID', extractedFields: {}, missingFields: [], confidence: null };
  }

  // Derive intentType from the response or fall back to intent-name heuristic
  const intentType = response.intentType ||
    (intent === 'ANSWER_QUESTION' ? 'QUESTION' :
     intent === 'INVALID_REQUEST' ? 'INVALID' : 'ACTION');

  return {
    intent,
    intentType,
    extractedFields: response.extractedFields || {},
    suggestedValues: response.suggestedValues || {},
    validationErrors: response.validationErrors || [],
    missingFields: response.missingFields || [],
    confirmationPrompt: response.confirmationPrompt || '',
    answer: response.answer || '',
    confidence: response.confidence ?? null
  };
};

export const isCrudIntent = (intent) => {
  return intent && (
    intent.startsWith('CREATE_') ||
    intent.startsWith('UPDATE_') ||
    intent.startsWith('DELETE_') ||
    intent.startsWith('TRANSFER_')
  );
};

/**
 * Returns true if this is an ACTION-type intent (CRUD, export, email).
 * Prefer using intentType from parseIntentResponse if available.
 */
export const isActionIntent = (intent, intentType) => {
  // Use intentType if provided (new schema)
  if (intentType) return intentType === 'ACTION';
  // Fallback: prefix-based check
  return intent && (
    intent.startsWith('CREATE_') ||
    intent.startsWith('UPDATE_') ||
    intent.startsWith('DELETE_') ||
    intent.startsWith('TRANSFER_') ||
    intent.startsWith('EXPORT_') ||
    intent.startsWith('EMAIL_')
  );
};

/**
 * Returns true only for export/email action intents.
 * These are handled client-side without calling the confirm-action backend.
 */
export const isExportEmailIntent = (intent) => {
  return Boolean(intent && (
    intent.startsWith('EXPORT_') ||
    intent.startsWith('EMAIL_')
  ));
};

export const normalizeAmountInput = (value) => {
  if (value === null || value === undefined || value === "") {
    return value;
  }

  const rawValue = String(value).trim();
  if (!rawValue) {
    return value;
  }

  const normalizedValue = rawValue
    .replace(/đ/giu, "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  const compactValue = normalizedValue.replace(/\s+/g, "");
  const parseShorthandNumber = (numericPart) => Number.parseFloat(numericPart.replace(",", "."));

  const thousandMatch = compactValue.match(/^(\d+(?:[.,]\d+)?)k$/i);
  if (thousandMatch) {
    return Math.round(parseShorthandNumber(thousandMatch[1]) * 1000);
  }

  const millionMatch = compactValue.match(/^(\d+(?:[.,]\d+)?)(tr|trieu|m)$/i);
  if (millionMatch) {
    return Math.round(parseShorthandNumber(millionMatch[1]) * 1000000);
  }

  const nghinMatch = compactValue.match(/^(\d+(?:[.,]\d+)?)(nghin|ngan)$/i);
  if (nghinMatch) {
    return Math.round(parseShorthandNumber(nghinMatch[1]) * 1000);
  }

  const digitsOnlyValue = normalizedValue.replace(/[.,\s]/g, "");
  if (/^\d+$/.test(digitsOnlyValue)) {
    return Math.round(Number.parseFloat(digitsOnlyValue));
  }

  return value;
};

/**
 * Client-side telemetry stubs for intent parsing quality monitoring.
 * Replace these with actual analytics calls (e.g., Mixpanel, Amplitude, or custom backend).
 */
export const clientTelemetry = {
  /**
   * Log when backend returns ANSWER_QUESTION but the message looks like an agent command.
   * This suggests either the AI or the reclassification heuristic missed the intent.
   */
  logAgentCommandFallback: (userMessage, pageContext) => {
    console.warn('[AI Telemetry] ANSWER_QUESTION fallback for probable agent command', {
      userMessage: userMessage?.substring(0, 80),
      pageContext,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log when user cancels a confirmation dialog, indicating a possible wrong parse.
   * High cancellation rate for a given intent suggests misclassification.
   */
  logConfirmationCancelled: (intent, extractedFields) => {
    console.warn('[AI Telemetry] User cancelled confirmation — possible wrong parse', {
      intent,
      fieldKeys: Object.keys(extractedFields || {}),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log when an ACTION intent has missingFields, indicating incomplete extraction.
   * Frequent occurrences for the same fields point to prompt training gaps.
   */
  logMissingFields: (intent, missingFields, pageContext) => {
    if (missingFields?.length > 0) {
      console.info('[AI Telemetry] Agent intent has missing fields', {
        intent,
        missingFields,
        pageContext,
        timestamp: new Date().toISOString()
      });
    }
  }
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
        { key: "description", label: "Mô tả", type: "text", required: false },
        { key: "jarName", label: "Hũ", type: "jar_select", required: false }
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
    case INTENT_TYPES.CREATE_JAR:
      return [
        { key: "name", label: "Tên hũ", type: "text", required: true },
        { key: "targetPercentage", label: "Tỷ lệ phân bổ (%)", type: "number", required: false },
        { key: "icon", label: "Icon", type: "text", required: false },
        { key: "color", label: "Màu sắc", type: "text", required: false }
      ];
    case INTENT_TYPES.UPDATE_JAR:
      return [
        { key: "jarName", label: "Tên hũ hiện tại", type: "jar_select", required: true },
        { key: "name", label: "Tên mới", type: "text", required: false },
        { key: "targetPercentage", label: "Tỷ lệ phân bổ (%)", type: "number", required: false },
        { key: "icon", label: "Icon", type: "text", required: false },
        { key: "color", label: "Màu sắc", type: "text", required: false }
      ];
    case INTENT_TYPES.DELETE_JAR:
      return [
        { key: "jarName", label: "Tên hũ", type: "jar_select", required: true }
      ];
    case INTENT_TYPES.TRANSFER_JAR:
      return [
        { key: "fromJarName", label: "Hũ nguồn", type: "jar_select", required: true },
        { key: "toJarName", label: "Hũ đích", type: "jar_select", required: true },
        { key: "amount", label: "Số tiền", type: "number", required: true }
      ];
    default:
      return [];
  }
};
