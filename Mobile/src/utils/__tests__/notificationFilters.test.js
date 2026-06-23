const {
  NOTIFICATION_CATEGORY_FILTERS,
  NOTIFICATION_READ_FILTERS,
  filterNotifications,
  getNextSelectionForVisibleNotifications,
} = require("../notificationFilters");

const notifs = [
  { id: "1", type: "EXPENSE", isRead: false },
  { id: "2", type: "INCOME", isRead: true },
  { id: "3", type: "BUDGET_WARNING", isRead: false },
  { id: "4", type: "SYSTEM_UPDATE", isRead: true },
  { id: "5", type: "SPENDING_ALERT", isRead: false },
];

describe("filterNotifications", () => {
  test("ALL filter returns all notifications", () => {
    const result = filterNotifications(notifs);
    expect(result).toHaveLength(5);
  });

  test("UNREAD only returns unread notifications", () => {
    const result = filterNotifications(notifs, { readFilter: NOTIFICATION_READ_FILTERS.UNREAD });
    expect(result).toHaveLength(3);
    result.forEach((n) => expect(n.isRead).toBe(false));
  });

  test("FINANCIAL category returns EXPENSE, INCOME, SPENDING_ALERT types", () => {
    const result = filterNotifications(notifs, { categoryFilter: NOTIFICATION_CATEGORY_FILTERS.FINANCIAL });
    expect(result).toHaveLength(3);
    expect(result.map((n) => n.id)).toEqual(["1", "2", "5"]);
  });

  test("BUDGET category returns BUDGET_WARNING type", () => {
    const result = filterNotifications(notifs, { categoryFilter: NOTIFICATION_CATEGORY_FILTERS.BUDGET });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  test("SYSTEM category returns non-financial and non-budget types", () => {
    const result = filterNotifications(notifs, { categoryFilter: NOTIFICATION_CATEGORY_FILTERS.SYSTEM });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("4");
  });

  test("combines read + category filters", () => {
    const result = filterNotifications(notifs, {
      readFilter: NOTIFICATION_READ_FILTERS.UNREAD,
      categoryFilter: NOTIFICATION_CATEGORY_FILTERS.FINANCIAL,
    });
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(["1", "5"]);
  });

  test("returns empty array for empty input", () => {
    expect(filterNotifications([])).toEqual([]);
  });

  test("handles undefined options", () => {
    expect(filterNotifications(notifs, undefined)).toHaveLength(5);
  });
});

describe("getNextSelectionForVisibleNotifications", () => {
  test("selects all when none selected", () => {
    const result = getNextSelectionForVisibleNotifications(
      [{ id: "1" }, { id: "2" }],
      new Set()
    );
    expect(result.has("1")).toBe(true);
    expect(result.has("2")).toBe(true);
  });

  test("deselects all when all are selected", () => {
    const result = getNextSelectionForVisibleNotifications(
      [{ id: "1" }, { id: "2" }],
      new Set(["1", "2"])
    );
    expect(result.has("1")).toBe(false);
    expect(result.has("2")).toBe(false);
  });

  test("selects all when only some selected", () => {
    const result = getNextSelectionForVisibleNotifications(
      [{ id: "1" }, { id: "2" }],
      new Set(["1"])
    );
    expect(result.has("1")).toBe(true);
    expect(result.has("2")).toBe(true);
  });

  test("handles notification without id", () => {
    const result = getNextSelectionForVisibleNotifications(
      [{ id: "1" }, { noId: true }],
      new Set()
    );
    expect(result.has("1")).toBe(true);
    expect(result.size).toBe(1);
  });
});
