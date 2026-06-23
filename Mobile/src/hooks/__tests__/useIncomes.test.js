jest.mock("../../services/incomeService", () => ({
  fetchIncomesByFilter: jest.fn(),
  deleteIncomeById: jest.fn(),
  exportIncomeReport: jest.fn(),
  parseIncomeVoice: jest.fn(),
}));

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("@react-navigation/native", () => ({ useFocusEffect: jest.fn((cb) => cb()) }));
jest.mock("../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.message || f }));

import { INCOME_FILTER_TYPES } from "../useIncomes";

describe("useIncomes constants", () => {
  test("INCOME_FILTER_TYPES has current and all", () => {
    expect(INCOME_FILTER_TYPES.current).toBe("current");
    expect(INCOME_FILTER_TYPES.all).toBe("all");
  });
});
