import {
  PAYMENT_STATUS_META,
  normalizePaymentStatus,
  getPaymentStatusMeta,
  canSyncPaymentStatus,
  formatPaymentDate,
} from "../paymentStatus";

describe("PAYMENT_STATUS_META", () => {
  test("contains all expected status keys", () => {
    expect(PAYMENT_STATUS_META).toHaveProperty("PAID");
    expect(PAYMENT_STATUS_META).toHaveProperty("PENDING");
    expect(PAYMENT_STATUS_META).toHaveProperty("PROCESSING");
    expect(PAYMENT_STATUS_META).toHaveProperty("FAILED");
    expect(PAYMENT_STATUS_META).toHaveProperty("CANCELLED");
    expect(PAYMENT_STATUS_META).toHaveProperty("CANCELED");
    expect(PAYMENT_STATUS_META).toHaveProperty("EXPIRED");
    expect(PAYMENT_STATUS_META).toHaveProperty("UNDERPAID");
  });

  test("each entry has label, tone, and icon", () => {
    Object.values(PAYMENT_STATUS_META).forEach((meta) => {
      expect(meta).toHaveProperty("label");
      expect(meta).toHaveProperty("tone");
      expect(meta).toHaveProperty("icon");
    });
  });
});

describe("normalizePaymentStatus", () => {
  test("returns uppercase trimmed status", () => {
    expect(normalizePaymentStatus("paid")).toBe("PAID");
    expect(normalizePaymentStatus(" Pending ")).toBe("PENDING");
    expect(normalizePaymentStatus("CANCELLED")).toBe("CANCELLED");
  });

  test("defaults to PENDING for empty input", () => {
    expect(normalizePaymentStatus("")).toBe("PENDING");
    expect(normalizePaymentStatus(undefined)).toBe("PENDING");
  });
});

describe("getPaymentStatusMeta", () => {
  test("returns correct meta for PAID", () => {
    const meta = getPaymentStatusMeta("PAID");
    expect(meta.label).toBe("Đã thanh toán");
    expect(meta.tone).toBe("success");
  });

  test("returns correct meta for FAILED", () => {
    const meta = getPaymentStatusMeta("FAILED");
    expect(meta.label).toBe("Thất bại");
    expect(meta.tone).toBe("danger");
  });

  test("returns fallback meta for unknown status", () => {
    const meta = getPaymentStatusMeta("UNKNOWN");
    expect(meta.label).toBe("UNKNOWN");
    expect(meta.tone).toBe("muted");
    expect(meta.icon).toBe("help-circle-outline");
  });
});

describe("canSyncPaymentStatus", () => {
  test("returns false for PAID", () => {
    expect(canSyncPaymentStatus("PAID")).toBe(false);
    expect(canSyncPaymentStatus("paid")).toBe(false);
  });

  test("returns true for non-PAID statuses", () => {
    expect(canSyncPaymentStatus("PENDING")).toBe(true);
    expect(canSyncPaymentStatus("FAILED")).toBe(true);
    expect(canSyncPaymentStatus("CANCELLED")).toBe(true);
  });
});

describe("formatPaymentDate", () => {
  test("formats valid date string", () => {
    const result = formatPaymentDate("2025-06-15T10:30:00");
    expect(result).not.toBe("--");
    expect(result.length).toBeGreaterThan(0);
  });

  test("returns '--' for empty or invalid input", () => {
    expect(formatPaymentDate("")).toBe("--");
    expect(formatPaymentDate(null)).toBe("--");
    expect(formatPaymentDate(undefined)).toBe("--");
    expect(formatPaymentDate("not-a-date")).toBe("--");
  });
});
