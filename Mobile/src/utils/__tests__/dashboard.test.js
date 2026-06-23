import { formatRelativeTime } from "../dashboard";

describe("formatRelativeTime", () => {
  const realDateNow = Date.now;

  afterEach(() => {
    global.Date.now = realDateNow;
  });

  test("returns '-' for falsy value", () => {
    expect(formatRelativeTime(null)).toBe("-");
    expect(formatRelativeTime(undefined)).toBe("-");
    expect(formatRelativeTime("")).toBe("-");
  });

  test("returns 'Vừa xong' for future timestamp", () => {
    const future = new Date(Date.now() + 3600000).toISOString();
    expect(formatRelativeTime(future)).toBe("Vừa xong");
  });

  test("returns 'Vừa xong' for less than 1 minute", () => {
    const now = new Date(Date.now() - 30000).toISOString();
    expect(formatRelativeTime(now)).toBe("Vừa xong");
  });

  test("returns minutes ago format", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toMatch(/phút trước/);
  });

  test("returns hours ago format", () => {
    const threeHrAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(formatRelativeTime(threeHrAgo)).toMatch(/giờ trước/);
  });

  test("returns days ago format", () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString();
    expect(formatRelativeTime(fiveDaysAgo)).toMatch(/ngày trước/);
  });

  test("returns months ago format", () => {
    const twoMonthsAgo = new Date(Date.now() - 62 * 86400000).toISOString();
    expect(formatRelativeTime(twoMonthsAgo)).toMatch(/tháng trước/);
  });

  test("returns years ago format", () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 86400000).toISOString();
    expect(formatRelativeTime(twoYearsAgo)).toMatch(/năm trước/);
  });
});
