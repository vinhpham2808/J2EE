jest.mock("../../services/apiClient", () => ({ get: jest.fn(), post: jest.fn(), delete: jest.fn() }));
jest.mock("../../constants/api", () => ({ API_ENDPOINTS: { GET_GOALS: "/saving-goals", ADD_GOAL: "/saving-goals", DELETE_GOAL: (id) => `/saving-goals/${id}`, ADD_GOAL_CONTRIBUTION: (id) => `/saving-goals/${id}/contributions` } }));
jest.mock("../../utils/format", () => ({ parseCurrencyInput: (v) => Number(v) || 0, todayIso: () => "2026-06-19", getApiErrorMessage: (e, f) => e?.message || f }));
jest.mock("../../components/common/ShowMoreButton", () => ({ useVisibleItems: (items, opts) => ({ visibleItems: items.slice(0, opts?.initialCount || 3), canToggle: items.length > 3, expanded: false, toggle: jest.fn() }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return { useFocusEffect: jest.fn((cb) => React.useEffect(() => { cb(); }, [])) };
});

import { renderHook, act } from "@testing-library/react-native";
import useGoals from "../useGoals";

describe("useGoals", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("returns initial state", async () => {
    const { result } = renderHook(() => useGoals());
    // Flush async focus effect
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(result.current.goals).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.overview.totalTarget).toBe(0);
    expect(result.current.overview.totalCurrent).toBe(0);
    expect(result.current.overview.overallProgress).toBe(0);
    expect(result.current.overview.activeCount).toBe(0);
  });
});
