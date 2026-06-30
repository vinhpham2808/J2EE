import { renderHook, waitFor } from "@testing-library/react-native";
import useDashboard from "../useDashboard";
import {
  fetchDashboardData,
  fetchDashboardMonthlySeries,
  fetchDashboardGoals,
  fetchUnreadNotificationCount
} from "../../services/dashboardService";

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

describe("useDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns initial state and updates after dashboard data resolves", async () => {
    const mockGoals = [{ id: 1, name: "Mua xe" }];
    const mockDashboard = { recentTransactions: [] };
    const mockSeries = [];
    const mockUnread = 2;

    fetchDashboardData.mockResolvedValue(mockDashboard);
    fetchDashboardGoals.mockResolvedValue(mockGoals);
    fetchDashboardMonthlySeries.mockResolvedValue(mockSeries);
    fetchUnreadNotificationCount.mockResolvedValue(mockUnread);

    const { result } = renderHook(() => useDashboard());

    // 1. Kiểm tra trạng thái ban đầu đồng bộ
    expect(result.current.dashboard).toBeNull();
    expect(result.current.monthlySeries).toEqual([]);
    expect(result.current.unreadCount).toBe(0);

    // 2. Chờ cho đến khi các Promise bất đồng bộ kết thúc hoàn toàn (loại bỏ cảnh báo act)
    await waitFor(() => {
      expect(result.current.goals).toEqual(mockGoals);
      expect(result.current.unreadCount).toBe(2);
    });
  });
});
