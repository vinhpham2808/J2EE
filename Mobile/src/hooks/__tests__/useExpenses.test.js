jest.mock("../../services/expenseService", () => ({
  fetchExpensesByFilter: jest.fn(),
  deleteExpenseById: jest.fn(),
  exportExpenseReport: jest.fn(),
  parseExpenseVoice: jest.fn(),
}));

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("@react-navigation/native", () => ({ useFocusEffect: jest.fn((cb) => cb()) }));
jest.mock("../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.message || f }));

import { EXPENSE_FILTER_TYPES } from "../useExpenses";

describe("useExpenses constants", () => {
  test("EXPENSE_FILTER_TYPES has current and all", () => {
    expect(EXPENSE_FILTER_TYPES.current).toBe("current");
    expect(EXPENSE_FILTER_TYPES.all).toBe("all");
  });
});
