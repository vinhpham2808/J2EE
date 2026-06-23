jest.mock("../../../constants/colors", () => ({
  COLORS: {
    INCOME: "#2A9D8F", INCOME_LIGHT: "#E8F5F3",
    EXPENSE: "#E76F51", EXPENSE_LIGHT: "#FDE8E3",
    WARNING: "#FFB84D", WARNING_LIGHT: "#FFF3E0",
    INFO: "#6B9BD2", INFO_LIGHT: "#E8F0FE",
    TEXT_SECONDARY: "#8B7B80", BG: "#FFF5F7", CARD_BORDER: "#F0E2E6",
  },
}));

import { getGoalVisual } from "../goalUtils";

describe("goalUtils", () => {
  const t = (key) => ({ "goalUtils.completed": "Hoàn thành", "goalUtils.cancelled": "Đã hủy", "goalUtils.behindSchedule": "Chậm tiến độ", "goalUtils.inProgress": "Đang thực hiện" }[key] || key);

  test("COMPLETED status returns green", () => {
    const result = getGoalVisual({ progressPercent: 100, status: "COMPLETED" }, t);
    expect(result.color).toBe("#2A9D8F");
    expect(result.label).toBe("Hoàn thành");
  });

  test("CANCELLED status returns muted", () => {
    const result = getGoalVisual({ status: "CANCELLED" }, t);
    expect(result.color).toBe("#8B7B80");
    expect(result.label).toBe("Đã hủy");
  });

  test("behind schedule returns red", () => {
    const result = getGoalVisual({ progressPercent: 50, status: "ACTIVE", isBehindSchedule: true }, t);
    expect(result.color).toBe("#E76F51");
    expect(result.label).toBe("Chậm tiến độ");
  });

  test("progress >= 75 returns green in-progress", () => {
    const result = getGoalVisual({ progressPercent: 80, status: "ACTIVE", isBehindSchedule: false }, t);
    expect(result.color).toBe("#2A9D8F");
    expect(result.label).toBe("Đang thực hiện");
  });

  test("progress >= 40 returns warning in-progress", () => {
    const result = getGoalVisual({ progressPercent: 50, status: "ACTIVE", isBehindSchedule: false }, t);
    expect(result.color).toBe("#FFB84D");
    expect(result.label).toBe("Đang thực hiện");
  });

  test("progress < 40 returns info in-progress", () => {
    const result = getGoalVisual({ progressPercent: 10, status: "ACTIVE", isBehindSchedule: false }, t);
    expect(result.color).toBe("#6B9BD2");
    expect(result.label).toBe("Đang thực hiện");
  });

  test("handles null/undefined goal", () => {
    const result = getGoalVisual({}, t);
    expect(result.color).toBe("#6B9BD2");
    expect(result.label).toBe("Đang thực hiện");
  });

  test("default t function returns key when not provided", () => {
    const result = getGoalVisual({ progressPercent: 100, status: "COMPLETED" });
    expect(result.label).toBe("goalUtils.completed");
  });

  test("case-insensitive status matching", () => {
    expect(getGoalVisual({ status: "completed" }, t).label).toBe("Hoàn thành");
    expect(getGoalVisual({ status: "Cancelled" }, t).label).toBe("Đã hủy");
  });
});
