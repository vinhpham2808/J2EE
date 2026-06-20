import {
  INTENT_TYPES,
  INTENT_LABELS,
  INTENT_ICONS,
  parseIntentResponse,
  isCrudIntent,
  isActionIntent,
  getFieldsForIntent,
} from "../aiIntent";

describe("INTENT_TYPES config", () => {
  test("has all expected intent types", () => {
    const expected = [
      "CREATE_CATEGORY", "UPDATE_CATEGORY", "DELETE_CATEGORY",
      "CREATE_EXPENSE", "UPDATE_EXPENSE", "DELETE_EXPENSE",
      "CREATE_INCOME", "UPDATE_INCOME", "DELETE_INCOME",
      "CREATE_BUDGET", "UPDATE_BUDGET", "DELETE_BUDGET",
      "CREATE_SAVING_GOAL", "UPDATE_SAVING_GOAL", "DELETE_SAVING_GOAL",
      "EXPORT_EXCEL_INCOME", "EXPORT_EXCEL_EXPENSE",
      "EMAIL_INCOME_REPORT", "EMAIL_EXPENSE_REPORT",
      "ANSWER_QUESTION", "INVALID_REQUEST",
    ];
    expected.forEach((key) => {
      expect(INTENT_TYPES[key]).toBe(key);
    });
  });
});

describe("INTENT_LABELS config", () => {
  test("every intent type has a label", () => {
    Object.keys(INTENT_TYPES).forEach((key) => {
      expect(INTENT_LABELS[key]).toBeTruthy();
    });
  });

  test("contains Vietnamese labels", () => {
    expect(INTENT_LABELS.CREATE_EXPENSE).toBe("Tạo chi tiêu");
    expect(INTENT_LABELS.ANSWER_QUESTION).toBe("Trả lời câu hỏi");
  });
});

describe("INTENT_ICONS config", () => {
  test("every intent type has an icon", () => {
    Object.keys(INTENT_TYPES).forEach((key) => {
      expect(INTENT_ICONS[key]).toBeTruthy();
    });
  });
});

describe("parseIntentResponse", () => {
  test("parses valid response with intent", () => {
    const result = parseIntentResponse({ intent: "CREATE_EXPENSE", extractedFields: { amount: 500000 } });
    expect(result.intent).toBe("CREATE_EXPENSE");
    expect(result.extractedFields.amount).toBe(500000);
  });

  test("returns INVALID_REQUEST for null/undefined response", () => {
    expect(parseIntentResponse(null).intent).toBe("INVALID_REQUEST");
    expect(parseIntentResponse(undefined).intent).toBe("INVALID_REQUEST");
  });

  test("returns INVALID_REQUEST for unknown intent", () => {
    const result = parseIntentResponse({ intent: "UNKNOWN_INTENT" });
    expect(result.intent).toBe("INVALID_REQUEST");
  });

  test("provides empty extractedFields, suggestedValues, validationErrors by default", () => {
    const result = parseIntentResponse({ intent: "CREATE_EXPENSE" });
    expect(result.extractedFields).toEqual({});
    expect(result.suggestedValues).toEqual({});
    expect(result.validationErrors).toEqual([]);
    expect(result.confirmationPrompt).toBe("");
    expect(result.answer).toBe("");
  });
});

describe("isCrudIntent", () => {
  test("returns true for CREATE_ intents", () => {
    expect(isCrudIntent("CREATE_EXPENSE")).toBe(true);
    expect(isCrudIntent("CREATE_INCOME")).toBe(true);
  });

  test("returns true for UPDATE_ intents", () => {
    expect(isCrudIntent("UPDATE_EXPENSE")).toBe(true);
  });

  test("returns true for DELETE_ intents", () => {
    expect(isCrudIntent("DELETE_EXPENSE")).toBe(true);
  });

  test("returns false for non-CRUD intents", () => {
    expect(isCrudIntent("EXPORT_EXCEL_INCOME")).toBe(false);
    expect(isCrudIntent("ANSWER_QUESTION")).toBe(false);
    expect(isCrudIntent(null)).toBeFalsy();
  });
});

describe("isActionIntent", () => {
  test("returns true for EXPORT_ intents", () => {
    expect(isActionIntent("EXPORT_EXCEL_INCOME")).toBe(true);
  });

  test("returns true for EMAIL_ intents", () => {
    expect(isActionIntent("EMAIL_INCOME_REPORT")).toBe(true);
  });

  test("returns false for non-action intents", () => {
    expect(isActionIntent("CREATE_EXPENSE")).toBe(false);
    expect(isActionIntent(null)).toBeFalsy();
  });
});

describe("getFieldsForIntent", () => {
  test("returns fields for CREATE_EXPENSE", () => {
    const fields = getFieldsForIntent("CREATE_EXPENSE");
    expect(fields.length).toBeGreaterThan(0);
    expect(fields.find((f) => f.key === "amount").required).toBe(true);
    expect(fields.find((f) => f.key === "description").required).toBe(false);
  });

  test("returns fields for CREATE_INCOME", () => {
    const fields = getFieldsForIntent("CREATE_INCOME");
    expect(fields.find((f) => f.key === "categoryName").categoryType).toBe("income");
  });

  test("returns fields for CREATE_BUDGET", () => {
    const fields = getFieldsForIntent("CREATE_BUDGET");
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("amount");
    expect(keys).toContain("categoryName");
    expect(keys).toContain("month");
    expect(keys).toContain("year");
  });

  test("returns empty array for unknown intent", () => {
    expect(getFieldsForIntent("UNKNOWN")).toEqual([]);
  });
});
