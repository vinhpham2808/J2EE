jest.mock("../../services/dashboardService", () => ({
  fetchDashboardData: jest.fn(),
  fetchDashboardMonthlySeries: jest.fn(),
  fetchDashboardGoals: jest.fn(),
  fetchUnreadNotificationCount: jest.fn(),
}));

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return { useFocusEffect: jest.fn((cb) => React.useEffect(() => { cb(); }, [])) };
});
jest.mock("../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.message || f }));

import { renderHook } from "@testing-library/react-native";
import useDashboard from "../useDashboard";

describe("useDashboard", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("returns initial state", () => {
    const { result } = renderHook(() => useDashboard());
    expect(result.current.dashboard).toBeNull();
    expect(result.current.monthlySeries).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.recentTransactions).toEqual([]);
  });
});
